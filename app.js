const express = require('express');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

let users = {};
let updateUsersOnline = () => { io.emit('get users', Object.keys(users)) };

io.on('connection', (socket => {
    socket.on('chat message', (data) => {
        if (data) {
            socket.broadcast.emit('send message', {msg: data, nickname: socket.nickname});            
        } 
    });

    socket.on('private', (data) => {
        let message = data.msg;
        data.checked.forEach((user) => {
            socket.broadcast.to(users[user].id).emit('send private', {msg: message, nickname: socket.nickname});
        });
    });    

    socket.on('new user', (data) => {
        if (!(data in users)) {            
            socket.nickname = data;            
            users[socket.nickname] = socket;
            io.emit('connected', {nickname: socket.nickname});
            updateUsersOnline();
        }
    });

    socket.on('disconnect', (data) => {
        if (socket.nickname) {
            delete users[socket.nickname];
            io.emit('disconnected', {nickname: socket.nickname});        
            updateUsersOnline();
        }        
    });
    
    socket.on('isTyping', (data) => {
        socket.broadcast.emit('isTyping', {nickname: socket.nickname, flag: data});
    });
}));

http.listen(3000, (req, res) => {
    console.log('Chat started');
});