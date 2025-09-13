const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));

let players = {};

function getNormalAvatars() {
  const avatarDir = path.join(__dirname, 'public', 'Avatars');
  try {
    return fs.readdirSync(avatarDir)
      .filter(file => file.includes('normal'))
      .map(file => `/Avatars/${file}`);
  } catch (e) {
    return [];
  }
}

io.on('connection', (socket) => {
  socket.on('join', ({pseudo, role, avatar}) => {
    players[socket.id] = { pseudo, role, avatar };
    io.emit('players', Object.values(players));
  });

  socket.on('requestNormalAvatars', () => {
    socket.emit('normalAvatars', getNormalAvatars());
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('players', Object.values(players));
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});