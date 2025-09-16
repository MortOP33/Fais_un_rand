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

function getThemeImages() {
  const themeDir = path.join(__dirname, 'public', 'Themes');
  const files = fs.existsSync(themeDir) ? fs.readdirSync(themeDir) : [];
  // Map: {THEME: url}
  const result = {};
  files.forEach(file => {
    // Ex : "economie.png" => THEME: "ECONOMIE"
    const m = /^([^.]+)\.(png|jpg|jpeg|webp)$/i.exec(file);
    if (m) {
      result[m[1].toUpperCase()] = `/Themes/${file}`;
    }
  });
  return result;
}

const QUESTIONS_PATH = path.join(__dirname, 'public', 'Questions', 'questions.json');

function loadQuestions() {
  try {
    const raw = fs.readFileSync(QUESTIONS_PATH, 'utf8');
    const arr = JSON.parse(raw);
    return arr.map(line => {
      const parts = line.split('#');
      if (parts.length !== 5) return null;
      return {
        id: parts[0],
        theme: parts[1],
        question: parts[2],
        reponse: parts[3],
        complement: parts[4]
      };
    }).filter(Boolean);
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
    // Envoi du mapping des thèmes images
    socket.emit('theme_images', getThemeImages());
  });

  socket.on('request_theme_images', () => {
    socket.emit('theme_images', getThemeImages());
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
        lobbies[code].joueurs.forEach(j => {
          io.to(j.socketId).emit('errorCode', 'Code non valide');
          io.to(j.socketId).emit('joueur_logout');
        });
        delete lobbies[code];
      } else {
        lobbies[code].joueurs = lobbies[code].joueurs.filter(j => j.socketId !== socket.id);
        io.to(lobbies[code].maitreId).emit('players', lobbies[code].joueurs);
      }
      delete socketToLobby[socket.id];
    }
  });

  socket.on('quizz_started', ({ code }) => {
    if (lobbies[code]) {
      lobbies[code].joueurs.forEach(j => {
        io.to(j.socketId).emit('quizz_started');
      });
    }
  });

  socket.on('param_retour', ({ code }) => {
    if (lobbies[code]) {
      io.to(lobbies[code].maitreId).emit('param_retour_maitre');
      lobbies[code].joueurs.forEach(j => {
        io.to(j.socketId).emit('param_retour_joueurs');
      });
    }
  });

  socket.on('demarrer_quizz', ({ code, nbQuestions, themes }) => {
    const allQuestions = loadQuestions();
    const filtered = allQuestions.filter(q => themes.includes(q.theme));
    const selected = filtered.sort(() => 0.5 - Math.random()).slice(0, nbQuestions);
    if (lobbies[code]) {
      lobbies[code].questions = selected;
      lobbies[code].questionIndex = 0;
      if (selected.length > 0) {
        io.to(lobbies[code].maitreId).emit('afficher_question', {
          question: selected[0],
          index: 0,
          total: selected.length,
          joueurs: lobbies[code].joueurs,
          themeImages: getThemeImages()
        });
      }
    }
  });

});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

});