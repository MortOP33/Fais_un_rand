const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));

function generateCode() {
  return Array.from({length: 6}, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
}

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

function getThemes() {
  const themesDir = path.join(__dirname, 'public', 'Themes');
  try {
    return fs.readdirSync(themesDir)
      .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
      .map(file => `/Themes/${file}`);
  } catch (e) {
    return [];
  }
}

let lobbies = {}; // { code: { maitreId, joueurs: [{pseudo, avatar, socketId}] } }
let socketToLobby = {}; // socketId -> code

io.on('connection', (socket) => {
  socket.on('maitre_create', () => {
    let code;
    do {
      code = generateCode();
    } while (lobbies[code]);
    lobbies[code] = { maitreId: socket.id, joueurs: [] };
    socketToLobby[socket.id] = code;
    socket.emit('maitre_code', code);
    io.to(socket.id).emit('players', []);
  });

  socket.on('maitre_delete', () => {
    const code = socketToLobby[socket.id];
    if (code && lobbies[code] && lobbies[code].maitreId === socket.id) {
      lobbies[code].joueurs.forEach(j => {
        io.to(j.socketId).emit('errorCode', 'Code non valide');
        io.to(j.socketId).emit('joueur_logout');
      });
      delete lobbies[code];
    }
    delete socketToLobby[socket.id];
    socket.emit('maitre_code', null);
  });

  socket.on('requestNormalAvatars', () => {
    socket.emit('normalAvatars', getNormalAvatars());
  });

  socket.on('joueur_join', ({pseudo, code, avatar}) => {
    code = code.toUpperCase();
    if (!lobbies[code]) {
      socket.emit('errorCode', 'Code non valide');
      return;
    }
    let joueurs = lobbies[code].joueurs;
    let joueur = joueurs.find(j => j.pseudo === pseudo);
    if (joueur) {
      joueur.avatar = avatar;
      joueur.socketId = socket.id;
    } else {
      joueurs.push({pseudo, avatar, socketId: socket.id});
    }
    socketToLobby[socket.id] = code;
    io.to(lobbies[code].maitreId).emit('players', joueurs);
  });

  socket.on('joueur_logout', () => {
    const code = socketToLobby[socket.id];
    if (code && lobbies[code]) {
      // Suppression du joueur
      lobbies[code].joueurs = lobbies[code].joueurs.filter(j => j.socketId !== socket.id);
      io.to(lobbies[code].maitreId).emit('players', lobbies[code].joueurs);
    }
    delete socketToLobby[socket.id];
    socket.emit('joueur_logout');
  });

  socket.on('disconnect', () => {
    const code = socketToLobby[socket.id];
    if (code && lobbies[code]) {
      if (lobbies[code].maitreId === socket.id) {
        // Si le maitre quitte, supprime le lobby
        lobbies[code].joueurs.forEach(j => {
          io.to(j.socketId).emit('errorCode', 'Code non valide');
          io.to(j.socketId).emit('joueur_logout');
        });
        delete lobbies[code];
      } else {
        // Sinon, supprime le joueur
        lobbies[code].joueurs = lobbies[code].joueurs.filter(j => j.socketId !== socket.id);
        io.to(lobbies[code].maitreId).emit('players', lobbies[code].joueurs);
      }
      delete socketToLobby[socket.id];
    }
  });

  // Quand le maitre lance la partie
  socket.on('quizz_started', ({ code }) => {
    if (lobbies[code]) {
      lobbies[code].joueurs.forEach(j => {
        io.to(j.socketId).emit('quizz_started');
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

});