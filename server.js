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
  const result = {};
  files.forEach(file => {
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
    const questions = JSON.parse(raw);

    // Vérifier que la racine du fichier est un tableau.
    if (!Array.isArray(questions)) {
      throw new Error(
        'Le fichier doit contenir un tableau JSON de questions.'
      );
    }

    const ids = new Set();

    // Vérifier chaque question avant de la rendre disponible.
    questions.forEach((q, index) => {
      const numero = index + 1;

      if (q === null || typeof q !== 'object' || Array.isArray(q)) {
        throw new Error(
          `La question ${numero} doit être un objet JSON.`
        );
      }

      if (q.id === undefined || q.id === null ||
          String(q.id).trim() === '') {
        throw new Error(
          `La question ${numero} n'a pas d'identifiant.`
        );
      }

      const id = String(q.id).trim();

      if (ids.has(id)) {
        throw new Error(
          `L'identifiant "${id}" est présent plusieurs fois.`
        );
      }

      ids.add(id);

      if (typeof q.theme !== 'string' || q.theme.trim() === '') {
        throw new Error(
          `La question ${numero} n'a pas de thème valide.`
        );
      }

      if (typeof q.question !== 'string' || q.question.trim() === '') {
        throw new Error(
          `Le texte de la question ${numero} est absent ou invalide.`
        );
      }

      if (typeof q.reponse !== 'number' ||
          !Number.isFinite(q.reponse)) {
        throw new Error(
          `La réponse de la question ${numero} doit être numérique.`
        );
      }

      if (typeof q.complement !== 'string') {
        throw new Error(
          `Le complément de la question ${numero} doit être du texte.`
        );
      }
    });

    // Normaliser les identifiants et les thèmes.
    return questions.map(q => ({
      ...q,
      id: String(q.id).trim(),
      theme: q.theme.trim()
    }));

  } catch (e) {
    console.error(
      'Erreur lors du chargement de la base de questions :',
      e.message
    );

    return [];
  }
}


function joueurEstValide(reponse) {
  if (typeof reponse !== 'string' && typeof reponse !== 'number') {
    return false;
  }

  const valeur = String(reponse).trim().replace(',', '.');

  return valeur !== '' && Number.isFinite(Number(valeur));
}


function convertirEnNombre(valeur) {
  if (typeof valeur !== 'string' && typeof valeur !== 'number') {
    return null;
  }

  const texte = String(valeur).trim().replace(',', '.');

  if (texte === '') return null;

  const nombre = Number(texte);
  return Number.isFinite(nombre) ? nombre : null;
}

function scorePourRang(nbJoueurs, rangIndex) {
  if (nbJoueurs <= 1) return 0;

  // Cas particulier du barème à 2 joueurs : +1, 0.
  if (nbJoueurs === 2) {
    return rangIndex === 0 ? 1 : 0;
  }

  // Effectif impair : un seul zéro au milieu.
  if (nbJoueurs % 2 === 1) {
    return Math.floor(nbJoueurs / 2) - rangIndex;
  }

  // Effectif pair : deux zéros au milieu.
  const milieu = nbJoueurs / 2;

  return rangIndex < milieu
    ? milieu - 1 - rangIndex
    : milieu - rangIndex;
}

function calculerScoresManche(lobby, reponseCorrecte) {
  const scores = {};
  const joueurs = lobby.joueurs;
  const nbJoueurs = joueurs.length;

  if (nbJoueurs === 0) return scores;

  const valeurCorrecte = convertirEnNombre(reponseCorrecte);

  if (valeurCorrecte === null) {
    console.error(
      'Réponse correcte non numérique pour le calcul des scores.'
    );
    return scores;
  }

  const valides = [];
  const invalides = [];

  joueurs.forEach(joueur => {
    const saisie = lobby.manche.reponses[joueur.socketId];

    const valeur = saisie && saisie.valide
      ? convertirEnNombre(saisie.reponse)
      : null;

    if (valeur === null) {
      invalides.push(joueur);
    } else {
      valides.push({
        joueur,
        ecart: Math.abs(valeur - valeurCorrecte)
      });
    }
  });

  // Aucun joueur n'a donné de réponse valide :
  // tous reçoivent le score maximal.
  if (valides.length === 0) {
    const scoreMaximal = scorePourRang(nbJoueurs, 0);

    joueurs.forEach(joueur => {
      scores[joueur.socketId] = scoreMaximal;
    });

    return scores;
  }

  // Classement de la réponse la plus proche à la plus éloignée.
  valides.sort((a, b) => a.ecart - b.ecart);

  let debutGroupe = 0;

  while (debutGroupe < valides.length) {
    let finGroupe = debutGroupe;

    // Regrouper les réponses ayant le même écart.
    while (
      finGroupe + 1 < valides.length &&
      Math.abs(
        valides[finGroupe + 1].ecart -
        valides[debutGroupe].ecart
      ) < 1e-9
    ) {
      finGroupe++;
    }

    // Le groupe reçoit le score correspondant à sa première position.
    const score = scorePourRang(nbJoueurs, debutGroupe);

    for (let i = debutGroupe; i <= finGroupe; i++) {
      scores[valides[i].joueur.socketId] = score;
    }

    debutGroupe = finGroupe + 1;
  }

  // Les réponses invalides ou absentes reçoivent le score
  // après le dernier groupe ayant fourni une réponse valide.
  const scoreSansReponse = scorePourRang(
    nbJoueurs,
    valides.length
  );

  invalides.forEach(joueur => {
    scores[joueur.socketId] = scoreSansReponse;
  });

  return scores;
}


function tousLesJoueursOntRepondu(lobby) {
  return lobby.joueurs.length > 0 &&
    lobby.joueurs.every(j => {
      const reponse = lobby.manche.reponses[j.socketId];
      return reponse && reponse.valide;
    });
}

function arreterSaisie(code, raison) {
  const lobby = lobbies[code];

  if (!lobby || lobby.manche.phase !== 'saisie') {
    return;
  }

  if (lobby.manche.timer) {
    clearTimeout(lobby.manche.timer);
    lobby.manche.timer = null;
  }

  lobby.manche.phase = 'comparaison';

  io.to(lobby.maitreId).emit('fin_saisie', {
    raison,
    reponses: lobby.joueurs.map(j => ({
      pseudo: j.pseudo,
      reponse: lobby.manche.reponses[j.socketId]?.reponse ?? null,
      valide: lobby.manche.reponses[j.socketId]?.valide ?? false
    }))
  });

  lobby.joueurs.forEach(j => {
    io.to(j.socketId).emit('fin_saisie_joueur');
  });
}

let lobbies = {}; // { code: { maitreId, joueurs: [{pseudo, avatar, socketId}] } }
let socketToLobby = {}; // socketId -> code

function creerEtatManche() {
  return {
    phase: 'attente',
    reponses: {},
    timer: null,
    debutSaisie: null
  };
}

io.on('connection', (socket) => {
  socket.on('maitre_create', () => {
    let code;
    do {
      code = generateCode();
    } while (lobbies[code]);
    lobbies[code] = {
      maitreId: socket.id,
      joueurs: [],
      questions: [],
      historiqueQuestions: [],
      questionIndex: 0,
      scoresTotaux: {},
      scoresManche: {},
      scoresTotauxAvantManche: null,
      ordreJoueursAvantManche: null,
      scoresCategories: {},
      manche: creerEtatManche()
    };
    socketToLobby[socket.id] = code;
    socket.emit('maitre_code', code);
    io.to(socket.id).emit('players', []);
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
  
  socket.on('demarrer_quizz', ({ code, nbQuestions, themes, historiqueIds }) => {
    const lobby = lobbies[code];

    // Vérifier que la demande vient du maître de cette partie.
    if (!lobby || lobby.maitreId !== socket.id) return;

    const allQuestions = loadQuestions();
    const themesSelectionnes = Array.isArray(themes) ? themes : [];

    // Refuser de démarrer sans thème sélectionné.
    if (themesSelectionnes.length === 0) {
      socket.emit(
        'erreur_demarrage_quizz',
        'Sélectionne au moins un thème avant de démarrer.'
      );
      return;
    }

    // Ne conserver que les questions des thèmes sélectionnés.
    const filtered = allQuestions.filter(q =>
      themesSelectionnes.includes(q.theme)
    );

    // Refuser un démarrage si aucun thème ne correspond à la base.
    if (filtered.length === 0) {
      socket.emit(
        'erreur_demarrage_quizz',
        'Aucune question ne correspond aux thèmes sélectionnés.'
      );
      return;
    }

    // Nettoyer et dédoublonner les identifiants de l'historique importé.
    // Conserver l'historique déjà accumulé et y ajouter les identifiants importés.
    const historiqueExistant = Array.isArray(lobby.historiqueQuestions)
      ? lobby.historiqueQuestions
      : [];

    const historiqueNettoye = Array.isArray(historiqueIds)
      ? historiqueIds
          .filter(id => typeof id === 'string' || typeof id === 'number')
          .map(id => String(id).trim())
          .filter(id => id !== '')
      : [];

    lobby.historiqueQuestions = [
      ...new Set([...historiqueExistant, ...historiqueNettoye])
    ];

    console.log(
      `Historique disponible pour le lobby ${code} : ` +
      `${lobby.historiqueQuestions.length} identifiant(s)`
    );

    // Mélange aléatoire de toutes les questions des thèmes choisis.
    function melangerQuestions(questions) {
      const resultat = [...questions];

      for (let i = resultat.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [resultat[i], resultat[j]] = [resultat[j], resultat[i]];
      }

      return resultat;
    }

    const questionsMelangees = melangerQuestions(filtered);
    const historiqueSet = new Set(lobby.historiqueQuestions);

    // Séparer les questions inédites des questions déjà présentes
    // dans l'historique, en respectant toujours les thèmes sélectionnés.
    const questionsInedites = questionsMelangees.filter(
      q => !historiqueSet.has(String(q.id))
    );

    const questionsDejaVues = questionsMelangees.filter(
      q => historiqueSet.has(String(q.id))
    );

    const nombreDemande = Number.isFinite(Number(nbQuestions))
      ? Math.max(1, Math.min(99, Math.floor(Number(nbQuestions))))
      : 10;

    let poolPrioritaire;

    // Si toutes les questions sont dans l'historique, on l'ignore
    // pour cette partie, mais on conserve les thèmes sélectionnés.
    if (questionsInedites.length === 0) {
      poolPrioritaire = questionsMelangees;
      console.log(
        `Historique ignoré pour le lobby ${code} : ` +
        `aucune question inédite dans les thèmes sélectionnés.`
      );
    } else {
      poolPrioritaire = questionsInedites;
    }

    // Commencer par les questions inédites (ou toutes les questions
    // si l'historique a dû être ignoré).
    const selected = poolPrioritaire.slice(0, nombreDemande);

    // Si nécessaire, compléter avec les questions déjà vues.
    if (
      selected.length < nombreDemande &&
      questionsInedites.length > 0
    ) {
      const dejaSelectionnees = new Set(selected.map(q => String(q.id)));

      for (const question of melangerQuestions(questionsDejaVues)) {
        if (selected.length >= nombreDemande) break;

        if (!dejaSelectionnees.has(String(question.id))) {
          selected.push(question);
          dejaSelectionnees.add(String(question.id));
        }
      }
    }

    // Si la base ne suffit toujours pas, répéter des questions
    // appartenant aux thèmes sélectionnés jusqu'au nombre demandé.
    while (selected.length < nombreDemande) {
      const questionAleatoire =
        questionsMelangees[
          Math.floor(Math.random() * questionsMelangees.length)
        ];

      selected.push(questionAleatoire);
    }

    // Réinitialiser les scores au lancement d'une nouvelle partie.
    lobby.scoresTotaux = {};
    lobby.scoresManche = {};

    lobby.joueurs.forEach(joueur => {
      lobby.scoresTotaux[joueur.socketId] = 0;
    });

    lobby.questions = selected;
    lobby.questionIndex = 0;

    console.log(
      `Quiz ${code} démarré : ${selected.length} question(s), ` +
      `${questionsInedites.length} inédite(s) disponible(s).`
    );

    io.to(lobby.maitreId).emit('afficher_question', {
      question: selected[0],
      index: 0,
      total: selected.length,
      joueurs: lobby.joueurs.map(joueur => ({
        ...joueur,
        scoreTotal: lobby.scoresTotaux[joueur.socketId] ?? 0
      })),
      themeImages: getThemeImages()
    });
  });


  // --- Ajout pour la saisie et envoi des réponses joueurs ---
  socket.on('demande_saisie_joueur', ({ code }) => {
    const lobby = lobbies[code];

    if (!lobby || lobby.maitreId !== socket.id) return;
    if (lobby.manche.phase !== 'attente') return;

    lobby.manche = creerEtatManche();
    lobby.manche.phase = 'saisie';
    lobby.manche.debutSaisie = Date.now();

    lobby.joueurs.forEach(j => {
      io.to(j.socketId).emit('afficher_saisie_joueur', { code });
    });

    io.to(lobby.maitreId).emit('debut_saisie', {
      duree: 30,
      joueurs: lobby.joueurs.map(j => ({
        pseudo: j.pseudo,
        avatar: j.avatar
      }))
    });

    lobby.manche.timer = setTimeout(() => {
      arreterSaisie(code, 'chrono');
    }, 30000);
  });

  socket.on('envoi_reponse_joueur', ({ code, reponse }) => {
    const lobby = lobbies[code];

    if (!lobby || lobby.manche.phase !== 'saisie') return;

    const joueur = lobby.joueurs.find(j => j.socketId === socket.id);
    if (!joueur) return;

    const valide = joueurEstValide(reponse);

    lobby.manche.reponses[socket.id] = {
      reponse: String(reponse).trim(),
      valide
    };

    io.to(lobby.maitreId).emit('statut_reponse', {
      pseudo: joueur.pseudo,
      valide
    });

    if (tousLesJoueursOntRepondu(lobby)) {
      arreterSaisie(code, 'tous_repondus');
    }
  });

  socket.on('reveler_reponse', ({ code }) => {
    const lobby = lobbies[code];

    if (!lobby || lobby.maitreId !== socket.id) return;
    if (lobby.manche.phase !== 'comparaison') return;

    const question = lobby.questions[lobby.questionIndex];
    if (!question) return;

    // Mémoriser le classement avant l'ajout des nouveaux scores.
    const anciensRangs = new Map(
      lobby.joueurs.map((joueur, index) => [
        joueur.socketId,
        index
      ])
    );

    // Conserver les scores et l'ordre avant cette manche
    // pour pouvoir annuler proprement la question.
    lobby.scoresTotauxAvantManche = {
      ...lobby.scoresTotaux
    };

    lobby.ordreJoueursAvantManche = lobby.joueurs.map(joueur => joueur.socketId);

    // Calculer les scores de la manche.
    lobby.scoresManche = calculerScoresManche(
      lobby,
      question.reponse
    );

    // Ajouter les scores de manche aux scores totaux.
    lobby.joueurs.forEach(joueur => {
      const scoreManche =
        lobby.scoresManche[joueur.socketId] ?? 0;

      lobby.scoresTotaux[joueur.socketId] =
        (lobby.scoresTotaux[joueur.socketId] ?? 0)
        + scoreManche;
    });

    // Trier les joueurs du score total le plus élevé au plus faible.
    lobby.joueurs.sort((a, b) => {
      const scoreA = lobby.scoresTotaux[a.socketId] ?? 0;
      const scoreB = lobby.scoresTotaux[b.socketId] ?? 0;
      return scoreB - scoreA;
    });

    // Préparer les scores et les flèches à afficher.
    const classement = lobby.joueurs.map((joueur, nouvelIndex) => {
      const ancienIndex = anciensRangs.get(joueur.socketId);

      let evolution = '→';

      if (ancienIndex !== undefined) {
        if (nouvelIndex < ancienIndex) {
          evolution = '↑';
        } else if (nouvelIndex > ancienIndex) {
          evolution = '↓';
        }
      }

      return {
        pseudo: joueur.pseudo,
        scoreManche: lobby.scoresManche[joueur.socketId] ?? 0,
        scoreTotal: lobby.scoresTotaux[joueur.socketId] ?? 0,
        evolution
      };
    });

    // Changer la phase empêche un second clic de compter les points
    // une deuxième fois pour cette même manche.
    lobby.manche.phase = 'revelation';

    io.to(lobby.maitreId).emit('afficher_revelation', {
      reponse: question.reponse,
      complement: question.complement,
      classement
    });
  });

  socket.on('question_suivante', ({ code }) => {
    const lobby = lobbies[code];

    // Seul le maître peut passer à la question suivante.
    if (!lobby || lobby.maitreId !== socket.id) return;

    // Autoriser le passage uniquement après révélation ou annulation.
    if (
      lobby.manche.phase !== 'revelation' &&
      lobby.manche.phase !== 'annulee'
    ) {
      return;
    }

    // Enregistrer la question parcourue au clic sur Suivant.
    // Cette étape s'applique après une révélation ou une annulation.
    const questionActuelle = lobby.questions[lobby.questionIndex];

    if (questionActuelle && questionActuelle.id !== undefined &&
        questionActuelle.id !== null) {
      const idQuestion = String(questionActuelle.id).trim();

      if (
        idQuestion !== '' &&
        !lobby.historiqueQuestions.includes(idQuestion)
      ) {
        lobby.historiqueQuestions.push(idQuestion);

        console.log(
          `Historique : question ${idQuestion} enregistrée pour le lobby ${code}`
        );
      }
    }

    const prochainIndex = lobby.questionIndex + 1;


    // Toutes les questions ont été jouées.
    if (prochainIndex >= lobby.questions.length) {
      lobby.manche.phase = 'termine';
      io.to(lobby.maitreId).emit('quizz_termine', {
        historiqueIds: lobby.historiqueQuestions
      });
      return;
    }

    // Préparer la prochaine question sans toucher aux scores totaux.
    lobby.questionIndex = prochainIndex;
    lobby.scoresManche = {};
    lobby.manche = creerEtatManche();

    const joueurs = lobby.joueurs.map(joueur => ({
      ...joueur,
      scoreTotal: lobby.scoresTotaux[joueur.socketId] ?? 0
    }));

    io.to(lobby.maitreId).emit('afficher_question', {
      question: lobby.questions[lobby.questionIndex],
      index: lobby.questionIndex,
      total: lobby.questions.length,
      joueurs,
      themeImages: getThemeImages()
    });
  });

  socket.on('annuler_question', ({ code }) => {
    const lobby = lobbies[code];

    // Seul le maître peut annuler une question révélée.
    if (!lobby || lobby.maitreId !== socket.id) return;
    if (lobby.manche.phase !== 'revelation') return;
    if (!lobby.scoresTotauxAvantManche) return;
    if (!lobby.ordreJoueursAvantManche) return;

    // Restaurer les scores d'avant la question.
    lobby.scoresTotaux = {
      ...lobby.scoresTotauxAvantManche
    };

    // Restaurer l'ordre exact d'avant la révélation.
    const ordreAvant = new Map(
      lobby.ordreJoueursAvantManche.map(
        (socketId, index) => [socketId, index]
      )
    );

    lobby.joueurs.sort((a, b) =>
      (ordreAvant.get(a.socketId) ?? Infinity) -
      (ordreAvant.get(b.socketId) ?? Infinity)
    );

    // Annuler les scores de cette manche.
    lobby.joueurs.forEach(joueur => {
      lobby.scoresManche[joueur.socketId] = 0;
    });

    // Empêcher une seconde révélation de cette manche.
    lobby.manche.phase = 'annulee';

    const classement = lobby.joueurs.map(joueur => ({
      pseudo: joueur.pseudo,
      scoreManche: 0,
      scoreTotal: lobby.scoresTotaux[joueur.socketId] ?? 0
    }));

    io.to(lobby.maitreId).emit('question_annulee', {
      classement
    });
  });

  socket.on('reset_affichage_joueur', ({ code }) => {
    if (lobbies[code]) {
      lobbies[code].joueurs.forEach(j => {
        io.to(j.socketId).emit('reset_affichage_joueur');
      });
    }
  });

});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});