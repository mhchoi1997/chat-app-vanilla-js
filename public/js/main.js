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

function dataURLtoFile(dataurl, filename = 'undefine') {

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

    const reader = new FileReader();
    const input = e.target.elements[0];
    const form = e.target.elements[1];

    const msg = input.value
    const file = form.files[0];

    if ((!!file) === true) {
        reader.onload = function () {
            socket.emit('chatMessage', { msg, file: { filename: file.name, result: this.result } });
            input.value = '';
            input.focus();
        };
        reader.readAsDataURL(file)
    }
    else {
        socket.emit('chatMessage', msg);
        input.value = '';
        input.focus();
    }

});

function outputMessages (message) {
    const messageContainer = document.querySelector('.chat-messages');

    let html = '<div class="message">';
    html += `<p class="meta">${message.username}<span>${message.time}</span></p>`;
    
    const isObject = typeof message === 'object';
    const includeFile = (!!message?.text?.file) === true;

    if (!isObject || (isObject && !includeFile)) {
        const text = message?.text ?? message;
        html += `<p class="text">${text}</p>`;
        html += '</div>';

        messageContainer.insertAdjacentHTML('beforeend', html);
        // 메시지가 추가될때, 스크롤을 스무스하게 이동한다.
        document.querySelector('.message:last-child').scrollIntoView({
            behavior: 'smooth'
        });
    }
    else {
        const { msg, file } = message.text;
        const reader = new FileReader();

        reader.onload = () => {
            // base64형태로 받은 다음에 href속성 또는 src속성에 지정한다.
            html += `<p class="text">${msg}</p>`;
            if (!reader.result.includes('data:image')) {
                // 이미지 파일이 아닌 나머지 파일 포맷일 때...
                html += `Download to <a href="${reader.result}" download="${file.filename}">${file.filename}</a>`;
            }
            else {
                // 이미지로 올라오면 img태그로 표시하고 img를 클릭하면 다운로드가 가능하도록한다.
                html += `<a href="${reader.result}" download>
                    <img src="${reader.result}" alt="${file.filename}" width="200" height="200">
                </a>`;
            }
            html += '</div>';
            
            messageContainer.insertAdjacentHTML('beforeend', html);
            
            // 메시지가 추가될때, 스크롤을 스무스하게 이동한다.
            document.querySelector('.message:last-child').scrollIntoView({
                behavior: 'smooth'
            });
        };
    
        const test = dataURLtoFile(file.result, file.filename);
        reader.readAsDataURL(test);
    }
}