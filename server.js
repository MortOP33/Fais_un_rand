const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let players = {}; // { socketId: { pseudo } }

io.on('connection', (socket) => {
  socket.on('join', (pseudo) => {
    players[socket.id] = { pseudo };
    io.emit('players', Object.values(players));
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