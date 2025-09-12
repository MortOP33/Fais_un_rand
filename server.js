const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let game = {};
let players = {};

function resetGame() {
  game = {
    started: false,
  };
  players = {};
}
resetGame();

function emitState() {
  const maitrePris = Object.values(players).some(player => player.role === 'maitre');
  const joueurs = Object.entries(players).map(([id, data]) => ({
    id,
    pseudo: data.pseudo || '',
    role: data.role || '',
  }));
  io.emit('state', {
    maitrePris: maitrePris,
    joueurs: joueurs,
    started: game.started,
  });
}

io.on('connection', (socket) => {
  socket.on('setRole', ({role, pseudo}) => {
    if (['maitre', 'joueur'].includes(role)) {
      players[socket.id] = {role, pseudo: (pseudo||'') };
      emitState();
    }
  });

  socket.on('leaveRole', () => {
    if (players[socket.id]) {
      players[socket.id].role = undefined;
      emitState();
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    emitState();
  });

  socket.on('start', () => {
    game.started = true;
    emitState();
  });

  socket.on('reset', () => {
    io.emit('end', {winner: 'none'});
    for (const [socketId, player] of Object.entries(players)) {
      if(player.role === 'maitre') io.to(socketId).emit('reset');
    }
    resetGame();
    emitState();
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});