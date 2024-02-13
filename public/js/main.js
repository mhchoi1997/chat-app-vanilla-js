const socket = io();
const chatForm = document.getElementById('chat-form');

//Get user and room info from URL
const {username, room} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});


//Join a Chatroom
socket.emit('joinRoom', { username, room});


//Listen for the event and Get the room and users from server
socket.on('roomUsers', (({room, users}) => {
    //Updating the room name on the sidebar
    document.querySelector('#room-name').textContent = room;

    //Updating the users list on the sidebar
    const usersList = document.querySelector('#users');
    usersList.innerHTML = users.map(user => `<li><i class="fas fa-user"></i> ${user.username}</li>`).join('');
}));

//Getting the message from the back-end
socket.on('message', message => {
    outputMessages(message);
});

function dataURLtoFile(dataurl, filename) {

    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);

    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, {type:mime});
}


chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const fileReader = new FileReader();
    const messageInput = e.target.elements[0];
    const form = e.target.elements[1];

    const msg = messageInput.value
    const file = form.files[0];

    if ((!!file) === true) {
        fileReader.onload = function () {
            socket.emit('chatMessage', { msg, file: { filename: file.name, result: this.result } });
        };
        fileReader.readAsDataURL(file)
    }
    else {
        socket.emit('chatMessage', msg);
        messageInput.value = '';
        messageInput.focus();
    }

});

function outputMessages (message) {
    const messageContainer = document.querySelector('.chat-messages');

    let html = '';
    html += '<div class="message">';
    html += `<p class="meta">${message.username}<span>${message.time}</span></p>`;
    
    if (typeof message !== 'object' || (typeof message === 'object' && (!!message?.text?.file) === false)) {
        const text = message?.text ?? message;
        html += `<p class="text">${text}</p>`;
        html += '</div>';

        messageContainer.insertAdjacentHTML('beforeend', html);
        document.querySelector('.message:last-child').scrollIntoView({
            behavior: 'smooth'
        });
    }
    else {
        const { msg, file } = message.text;
        const reader = new FileReader();

        reader.onload = () => {
            html += `<p class="text">${msg}</p>`;
            html += `<a href="${reader.result}" download>${file.filename}</a>`;
            html += '</div>';
            
            messageContainer.insertAdjacentHTML('beforeend', html);
            document.querySelector('.message:last-child').scrollIntoView({
                behavior: 'smooth'
            });
        };
    
        const test = dataURLtoFile(file.result, file.filename ?? 'undefine');
        reader.readAsDataURL(test);
    }
}