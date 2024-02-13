const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botName = 'Chat Bot';

//Setting the static folder
app.use(express.static(path.join(__dirname, 'public')));

//클라이언트에서 websocket을 생성하면 먼저 처리한다. connection
io.on('connection', socket => {

    // socket.emit('joinRoom')이 발생하면 실행한다.
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        // 특정 채널에 소켓을 구독한다.
        socket.join(user.room);

        // 채널에 참여한 소켓에 메시지를 전달한다.
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));
        
        // socket.broadcast => 발신자를 제외한 모든 소켓에만 브로드케스트되도록 한다.
        // emit('message) => 클라이언트의 'message' 이벤트 핸들러 처리
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined.`));

        // 채널에 존재하는 모든 사람들에게 메시지를 전달한다. => 클라이언트의 'roomUsers'이벤트에서 처리한다.
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // 클라이언트에서 메시지를 작성하면 웹소켓 서버('chatMessage')에 전달한다.
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id); // 유저 정보를 가지고...
        console.log(msg);
        //Emit the message to everybody
        io.to(user.room).emit('message', formatMessage(user.username, msg)); // 다시 클라이언트에 메시지 정보를 전달(모든 소켓들에게...)
    });

    // 연결 종료 => 강제 페이지 나갔을때 등...
    socket.on('disconnect', () => {
        const user = userLeave(socket.id); // 사용자 정보 제외하고...
        if (user) {
            // 사용자가 떠났음을 알려주는 메시지를 전달해야한다.
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat.`));
            //send users and room info
            // 그리고 채팅방의 모든 사용자에게 현재 접속중인 사용자 정보를 전달해야한다.
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
})

// 웹 서버 포트 설정
const PORT = process.env.PORT || 5000;

// 웹 서버 실행
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));