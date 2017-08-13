$(document).ready(() => {
    $(function () {
        let socket = io();

        // Handling regular and private messages. Adding message only to sender
        $('#chat-form').submit((e) => {   
            let checked = $('input:checkbox:checked').map(function(){ return $(this).val(); }).get();
            if ($('#nickname').val() && $('#message').val()) {
                if (checked.length !== 0) {
                    socket.emit('private', {msg: $('#message').val(), checked: checked});
                    $('#messages').append($('<li class="private">').html('<b>You</b>: ' + $('#message').val()));                    
                    $('#message').val('');
                    e.preventDefault();
                    return false;                
                } else {
                    socket.emit('chat message', $('#message').val());
                    $('#messages').append($('<li>').html('<b>You</b>: ' + $('#message').val()));
                    $('#message').val('');
                    e.preventDefault();            
                    return false;
                }
            } else {
                e.preventDefault();
                return false;     
            }
        });

        // Sending a regular message to clients except sender
        socket.on('send private', (data) => {
            if (data.nickname && data.msg) {
                $('#messages').append($('<li class="private">').html('<b>' + data.nickname + '</b>' + ': ' + data.msg));
            }
        });
        
        // Sending a private message to selected users except sender
        socket.on('send message', (data) => {
            if (data.nickname && data.msg) {
                $('#messages').append($('<li>').html('<b>' + data.nickname + '</b>' + ': ' + data.msg));
            }
        });

        // Adding a user to the chat
        $('#login-user').submit((e) => {        
            if ($('#nickname').val()) {
                socket.emit('new user', $('#nickname').val());
                $('#nickname').css('border', 'solid 2px green')
                e.preventDefault();           
                return false;
            } else {
                $('#nickname').css('border', 'solid 2px red').attr('placeholder', 'Please, enter a nickname');
                e.preventDefault();
                return false;
            }
        });

        // Displaying online users
        socket.on('get users', (data) => {
            let online = '';
            data.forEach((item) => {
                online += `<label><input type="checkbox" value="${item}" name="onlineUser"><span>${item}</span></label><br />`;
            });           
            $('#users').html(online);
        });

        // Informing clients when someone connects
        socket.on('connected', (data) => {
            $('#messages').append($('<li class="off-on">').text(data.nickname + ' has joined the chat room'));
        });

        // Informing clients when someone disconnects
        socket.on('disconnected', (data) => {
            $('#messages').append($('<li class="off-on">').text(data.nickname + ' has left the chat room'));
        });

        let flag = false;
        let timer;

        let pause = () => {
            flag = false;
            socket.emit('isTyping', flag);
        };        

        $('#message').keypress((e) => {            
            if (e.which !== 13 && flag === false) {
                flag = true;
                socket.emit('isTyping', flag);
                timer = setTimeout(pause, 700); 
            } else {
                clearTimeout(timer);
                timer = setTimeout(pause, 700);                
            }
        });

        // Displaying “{user} is typing” when someone types in except this person
        socket.on('isTyping', (data) => {
            if (data.nickname && data.flag) {
                $('#typing-info').css('visibility', 'visible');
                $('#typing-info').html(data.nickname + ' is typing...');               
            } else {
                $('#typing-info').css('visibility', 'hidden');
            }
        });   
    });    
})