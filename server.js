const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));

function generateCode() {
  // Lettres majuscules uniquement
  return Array.from({length: 6}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
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

let lobbies = {}; // { code: { maitreId, joueurs: [{pseudo, avatar, socketId}], maitrePseudo } }

io.on('connection', (socket) => {
  // Créer une partie (Maitre)
  socket.on('createLobby', (maitrePseudo) => {
    let code;
    do {
      code = generateCode();
    } while (lobbies[code]);
    lobbies[code] = {
      maitreId: socket.id,
      joueurs: [],
      maitrePseudo
    };
    socket.join(code);
    socket.emit('lobbyCreated', code);
    io.to(code).emit('lobbyUpdate', {
      code,
      joueurs: lobbies[code].joueurs,
      maitrePseudo
    });
  });

  // Rejoindre une partie (Joueur)
  socket.on('joinLobby', ({pseudo, code, avatar}) => {
    code = code.toUpperCase();
    if (lobbies[code]) {
      // Empêcher doubles pseudos dans le lobby
      if (!lobbies[code].joueurs.some(j => j.pseudo === pseudo)) {
        lobbies[code].joueurs.push({pseudo, avatar, socketId: socket.id});
        socket.join(code);
        io.to(code).emit('lobbyUpdate', {
          code,
          joueurs: lobbies[code].joueurs,
          maitrePseudo: lobbies[code].maitrePseudo
        });
        socket.emit('lobbyJoined', code);
      } else {
        socket.emit('errorLobby', 'Pseudo déjà utilisé dans cette partie.');
      }
    } else {
      socket.emit('errorLobby', 'Code de partie invalide.');
    }
  });

  // Liste des avatars
  socket.on('requestNormalAvatars', () => {
    socket.emit('normalAvatars', getNormalAvatars());
  });

  // Déconnexion
  socket.on('disconnect', () => {
    // Retirer le joueur ou le maitre du lobby concerné
    for (const code in lobbies) {
      if (lobbies[code].maitreId === socket.id) {
        // Suppression du lobby si le maitre quitte
        io.to(code).emit('lobbyClosed');
        delete lobbies[code];
      } else {
        const idx = lobbies[code].joueurs.findIndex(j => j.socketId === socket.id);
        if (idx !== -1) {
          lobbies[code].joueurs.splice(idx, 1);
          io.to(code).emit('lobbyUpdate', {
            code,
            joueurs: lobbies[code].joueurs,
            maitrePseudo: lobbies[code].maitrePseudo
          });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});