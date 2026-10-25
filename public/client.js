const socket = io();

const homePage = document.getElementById('homePage');
const pseudoInput = document.getElementById('pseudoInput');
const btnMaitre = document.getElementById('btnMaitre');
const btnJoueur = document.getElementById('btnJoueur');
const qrCodeDiv = document.getElementById('qrCode');
const maitrePage = document.getElementById('maitrePage');
const joueurPage = document.getElementById('joueurPage');
const playersList = document.getElementById('playersList');
const avatarsContainer = document.getElementById('avatarsContainer');
const codeLabel = document.getElementById('codeLabel');
const codeInput = document.getElementById('codeInput');
const labelInput = document.getElementById('labelSelectionnetonavatar');
const errorCodeDiv = document.getElementById('errorCodeDiv');
let selectedAvatar = null;
let maitreCode = null;
let joueurPseudo = null;
let joueurAvatar = null;
let isQuizzStarted = false;

let btnRetour, btnCreerPartie, parametresPage, btnRetourJoueur, btnDemarrer, pageJeuMaitre;
let themeImages = {};
let roundAnswer = "";
let roundComplement = "";
let currentLobbyCode = null; // Pour page joueur
let joueurResponseSent = "";
let timerInterval = null;
let historiqueImporte = [];
let derniereQuestionAffichee = false;

function avatarAvecEtat(avatarNormal, etat) {
  if (!avatarNormal) return avatarNormal;

  return avatarNormal.replace(
    /_(normal|content|decu)(?=\.[^.]+$)/,
    `_${etat}`
  );
}

window.onload = () => {
  homePage.style.display = "flex";
  maitrePage.style.display = "none";
  joueurPage.style.display = "none";
  pseudoInput.value = "";
  codeInput.value = "";
  errorCodeDiv.innerText = "";
  qrCodeDiv.innerHTML = "";
  showQRCode(qrCodeDiv);

  if (!document.getElementById('maitreActions')) {
    const actionsDiv = document.createElement('div');
    actionsDiv.id = 'maitreActions';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.justifyContent = 'center';
    actionsDiv.style.gap = '24px';
    actionsDiv.style.marginTop = '24px';

    btnRetour = document.createElement('button');
    btnRetour.innerText = "Retour";
    btnRetour.style.flex = "1";
    btnRetour.onclick = () => {
      socket.emit('maitre_delete');
      maitrePage.style.display = "none";
      homePage.style.display = "flex";
      codeLabel.innerText = "";
      playersList.innerHTML = "";
      maitreCode = null;
      isQuizzStarted = false;
      socket.emit('joueur_logout');
    };

    btnCreerPartie = document.createElement('button');
    btnCreerPartie.innerText = "Créer partie";
    btnCreerPartie.style.flex = "1";
    btnCreerPartie.disabled = true;
    btnCreerPartie.classList.add('disabled-btn');
    btnCreerPartie.onclick = () => {
      maitrePage.style.display = "none";
      parametresPage.style.display = "flex";
      isQuizzStarted = true;
      socket.emit('quizz_started', { code: maitreCode });
    };

    actionsDiv.appendChild(btnRetour);
    actionsDiv.appendChild(btnCreerPartie);
    maitrePage.appendChild(actionsDiv);

    parametresPage = document.createElement('div');
    parametresPage.className = "center-vertical";
    parametresPage.id = "parametresPage";
    parametresPage.style.display = "none";
    parametresPage.innerHTML = `
      <h2 style="text-align:center; margin-bottom:18px;">Paramètres de partie</h2>
      <div style="margin-bottom:22px; display:flex; align-items:center; gap:10px;">
        <label for="nbQuestions" style="font-size:1.2em; font-weight:bold;">Nombre de questions&nbsp;:</label>
        <input type="number" id="nbQuestions" min="1" max="99" value="10" style="width:60px; font-size:1.15em; text-align:center;">
      </div>
      <div style="border:2px solid #3855d6; border-radius:12px; padding:18px 16px; max-width:340px; background:#191b1f;">
        <div style="font-size:1.15em; font-weight:bold; margin-bottom:12px;">Choix des thèmes</div>
        <div id="themesList"></div>
      </div>
      <div id="zoneHistorique" style="border:2px dashed #6478d8; border-radius:12px; padding:16px; max-width:340px; margin-top:20px; text-align:center;">
        <div style="font-size:1.1em; font-weight:bold; margin-bottom:8px;">
          Historique des questions
        </div>
        <p style="margin:8px 0 14px;">
          Facultatif : importe un historique existant.
        </p>
        <input
          type="file"
          id="fichierHistorique"
          accept=".txt,.csv,text/plain,text/csv"
          style="max-width:100%;"
        >
        <p style="margin:10px 0 0; font-size:0.9em;">
          Ou dépose ton fichier dans cette zone.
        </p>
        <div id="statutHistorique" style="margin-top:10px; font-size:0.95em;">
          Aucun historique importé.
        </div>
      </div>
      <div style="display:flex; gap:24px; justify-content:center; margin-top:32px;">
        <button id="btnRetourParam" style="flex:1;">Retour</button>
        <button id="btnDemarrer" style="flex:1;">Démarrer</button>
      </div>

    `;
    document.body.appendChild(parametresPage);

    const themes = [
      "Dates", "Géographie", "Monde vivant", "Economie", "Sciences",
      "Divertissement", "Sondages", "Records", "Improbable"
    ];
    const themesList = parametresPage.querySelector('#themesList');
    themesList.innerHTML = themes.map((nom, idx) => `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <input type="checkbox" checked id="themeCheck${idx}" style="width:22px;height:22px;">
        <span style="font-size:1.13em; font-weight:500;">${nom}</span>
      </div>
    `).join('');

    const zoneHistorique = parametresPage.querySelector('#zoneHistorique');
    const fichierHistorique = parametresPage.querySelector('#fichierHistorique');
    const statutHistorique = parametresPage.querySelector('#statutHistorique');

    // Lire et interpréter un fichier d'identifiants séparés par des points-virgules.
    function lireFichierHistorique(fichier) {
      if (!fichier) return;

      const lecteur = new FileReader();

      lecteur.onload = () => {
        const contenu = String(lecteur.result || '');

        historiqueImporte = [
          ...new Set(
            contenu
              .split(';')
              .map(id => id.trim())
              .filter(id => id !== '')
          )
        ];

        statutHistorique.textContent = historiqueImporte.length > 0
          ? `${historiqueImporte.length} identifiant(s) importé(s).`
          : 'Fichier lu, mais aucun identifiant trouvé.';

        statutHistorique.style.color = historiqueImporte.length > 0
          ? '#45d483'
          : '#ffb84d';
      };

      lecteur.onerror = () => {
        historiqueImporte = [];
        statutHistorique.textContent = 'Impossible de lire ce fichier.';
        statutHistorique.style.color = '#ff5c5c';
      };

      lecteur.readAsText(fichier);
    }

    fichierHistorique.addEventListener('change', () => {
      const fichier = fichierHistorique.files[0];
      lireFichierHistorique(fichier);
    });

    // Autoriser le glisser-déposer du fichier.
    zoneHistorique.addEventListener('dragover', evenement => {
      evenement.preventDefault();
      zoneHistorique.style.background = '#292e45';
    });

    zoneHistorique.addEventListener('dragleave', () => {
      zoneHistorique.style.background = '';
    });

    zoneHistorique.addEventListener('drop', evenement => {
      evenement.preventDefault();
      zoneHistorique.style.background = '';

      const fichier = evenement.dataTransfer.files[0];

      if (!fichier) return;

      fichierHistorique.value = '';
      lireFichierHistorique(fichier);
    });
    
    btnDemarrer = parametresPage.querySelector('#btnDemarrer');
    btnDemarrer.onclick = () => {
      const nbQuestions = parseInt(document.getElementById('nbQuestions').value) || 10;
      const themesCodes = [
        "DATES",
        "GEOGRAPHIE",
        "MONDE VIVANT",
        "ECONOMIE",
        "SCIENCES",
        "DIVERTISSEMENT",
        "SONDAGES",
        "RECORDS",
        "IMPROBABLE"
      ];
      const themesChecked = Array.from(
        document.querySelectorAll('#themesList input[type="checkbox"]:checked')
      ).map(input => {
        const index = Number(input.id.replace('themeCheck', ''));
        return themesCodes[index];
      });
      socket.emit('demarrer_quizz', {
        code: maitreCode,
        nbQuestions,
        themes: themesChecked,
        historiqueIds: historiqueImporte
      });
      parametresPage.style.display = "none";
      createPageJeuMaitre();
      pageJeuMaitre.style.display = "flex";
    };
    const btnRetourParam = parametresPage.querySelector('#btnRetourParam');
    btnRetourParam.onclick = () => {
      parametresPage.style.display = "none";
      socket.emit('param_retour', { code: maitreCode });
      maitrePage.style.display = "flex";
      homePage.style.display = "none";
    };
  }

  if (!document.getElementById('btnRetourJoueur')) {
    btnRetourJoueur = document.createElement('button');
    btnRetourJoueur.id = "btnRetourJoueur";
    btnRetourJoueur.innerText = "Retour";
    btnRetourJoueur.style.marginTop = "38px";
    btnRetourJoueur.onclick = () => {
      socket.emit('joueur_logout');
      joueurPage.style.display = "none";
      homePage.style.display = "flex";
      codeInput.value = "";
      errorCodeDiv.innerText = "";
      selectedAvatar = null;
      joueurPseudo = null;
      joueurAvatar = null;
      isQuizzStarted = false;
      avatarsContainer.innerHTML = "";
    };
    joueurPage.appendChild(btnRetourJoueur);
  }
};

function showQRCode(element) {
  element.innerHTML = "";
  setTimeout(() => {
    new QRCode(element, {
      text: window.location.href,
      width: 140,
      height: 140,
      colorDark: "#222",
      colorLight: "#fff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }, 10);
}

function createPageJeuMaitre() {
  if (!pageJeuMaitre) {
    pageJeuMaitre = document.createElement('div');
    pageJeuMaitre.className = "center-vertical";
    pageJeuMaitre.id = "pageJeuMaitre";
    pageJeuMaitre.style.display = "none";
    document.body.appendChild(pageJeuMaitre);
  }
  pageJeuMaitre.innerHTML = `
    <div id="jeuThemeImg" style="text-align:center; margin-bottom:24px;"></div>
    <div id="jeuQuestionLabel" style="font-size:1.5em; font-weight:700; text-align:center; margin-bottom:18px;"></div>
    <div id="jeuCadres" style="display:flex; width:100%; max-width:1000px; box-sizing:border-box; gap:0; align-items:center; justify-content:center; margin:0 auto 24px; padding:0 12px;">
      <div id="jeuReponseCadre" style="display:none; flex:0 0 20%; width:20%; min-width:0; box-sizing:border-box; padding-right:12px;"></div>
      <div id="jeuComplementCadre" style="display:none; flex:1; min-width:0; box-sizing:border-box; padding-left:12px;"></div>
      <div id="jeuTimerCadre" style="width:100px; height:100px; position:relative; display:flex; align-items:center; justify-content:center;"></div>
    </div>
    <table id="jeuJoueursTable" style="width:100%; max-width:700px; margin-bottom:22px;">
      <thead>
        <tr>
          <th id="enteteJoueur" colspan="2"
              style="text-align:center; padding-bottom:18px;
                    border-right:1px solid #454750;">
            Joueur
          </th>
          <th id="enteteReponse"
              style="text-align:center; padding-bottom:18px;
                    border-right:1px solid #454750;">
            Réponse
          </th>
          <th style="text-align:center; padding-bottom:18px;">
            Score question
          </th>
          <th style="text-align:center; padding-bottom:18px;">
            Score total
          </th>
        </tr>
      </thead>
      <tbody id="jeuJoueursTbody"></tbody>
    </table>
    <div style="display:flex; gap:24px; justify-content:center;">
      <button id="btnAfficher" disabled style="flex:1;">Afficher</button>
      <button id="btnAnnulerQuestion" style="flex:1;display:none;">Annuler question</button>
      <button id="btnSuivant" disabled style="flex:1;">Suivant</button>
    </div>
  `;
}

btnMaitre.onclick = () => {
  socket.emit('maitre_create');
  homePage.style.display = "none";
  maitrePage.style.display = "flex";
  socket.emit('request_theme_images');
};

socket.on('theme_images', (mapping) => {
  themeImages = mapping || {};
});

socket.on('maitre_code', (code) => {
  maitreCode = code;
  if (code) {
    codeLabel.innerText = "CODE : " + code;
  } else {
    codeLabel.innerText = "";
  }
});

socket.on('players', (joueurs) => {
  playersList.innerHTML = joueurs.map(p =>
    `<li class="player-item">
      <img src="${p.avatar || ''}" class="avatar-maitre" alt="" />
      <span class="player-name">${p.pseudo}</span>
    </li>`
  ).join('');
  if (btnCreerPartie) {
    btnCreerPartie.disabled = joueurs.length < 2;
    btnCreerPartie.classList.toggle('disabled-btn', btnCreerPartie.disabled);
  }
});

btnJoueur.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  if (pseudo.length > 0) {
    homePage.style.display = "none";
    joueurPage.style.display = "flex";
    socket.emit('requestNormalAvatars');
    isQuizzStarted = false;
    btnRetourJoueur.style.display = "inline-block";
    codeInput.style.display = "";
    errorCodeDiv.style.display = "";
    labelInput.style.display = "";
  } else { alert("Entrez un pseudo avant de jouer !"); return; }
};

socket.on('normalAvatars', (avatarFiles) => {
  if (!isQuizzStarted) {
    avatarsContainer.innerHTML = avatarFiles.map(file =>
      `<img src="${file}" class="avatar-item" style="margin:12px;" />`
    ).join('');
    document.querySelectorAll('.avatar-item').forEach(img => {
      img.onclick = () => {
        selectedAvatar = img.src;
        document.querySelectorAll('.avatar-item').forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
        const pseudo = pseudoInput.value.trim();
        const code = codeInput.value.trim().toUpperCase();
        if (pseudo.length === 0) {
          errorCodeDiv.innerText = "Entrez un pseudo avant de jouer !";
          return;
        }
        if (code.length !== 6) {
          errorCodeDiv.innerText = "Entrez un code de 6 lettres.";
          return;
        }
        joueurPseudo = pseudo;
        joueurAvatar = selectedAvatar;
        socket.emit('joueur_join', {pseudo, code, avatar: selectedAvatar});
        errorCodeDiv.innerText = "";
      };
    });
    codeInput.style.display = "";
    errorCodeDiv.style.display = "";
    labelInput.style.display = "";
    btnRetourJoueur.style.display = "inline-block";
  } else {
    avatarsContainer.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center;
            gap:28px; width:max-content; max-width:100%;
            box-sizing:border-box; margin:24px auto 0;">
        <img src="${joueurAvatar || ''}" class="avatar-maitre" alt="" />
        <span class="player-name">${joueurPseudo || ''}</span>
      </div>
    `;
    codeInput.style.display = "none";
    errorCodeDiv.style.display = "none";
    labelInput.style.display = "none";
    btnRetourJoueur.style.display = "none";
  }
});

socket.on('errorCode', (msg) => {
  errorCodeDiv.innerText = msg;
});

socket.on('quizz_started', () => {
  isQuizzStarted = true;
  avatarsContainer.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center;
            gap:28px; width:max-content; max-width:100%;
            box-sizing:border-box; margin:24px auto 0;">
      <img src="${joueurAvatar || ''}" class="avatar-maitre" alt="" />
      <span class="player-name">${joueurPseudo || ''}</span>
    </div>
  `;
  codeInput.style.display = "none";
  errorCodeDiv.style.display = "none";
  labelInput.style.display = "none";
  btnRetourJoueur.style.display = "none";
});

socket.on('disconnect', () => {
  joueurPage.style.display = "none";
  homePage.style.display = "flex";
  avatarsContainer.innerHTML = "";
  selectedAvatar = null;
  joueurPseudo = null;
  joueurAvatar = null;
  isQuizzStarted = false;
  codeInput.value = "";
  errorCodeDiv.innerText = "";
});

socket.on('param_retour_joueurs', () => {
  isQuizzStarted = false;
  joueurPage.style.display = "flex";
  homePage.style.display = "none";
  avatarsContainer.innerHTML = "";
  btnRetourJoueur.style.display = "inline-block";
  codeInput.style.display = "";
  errorCodeDiv.style.display = "";
  labelInput.style.display = "";
  socket.emit('requestNormalAvatars');
});

socket.on('nouvelle_partie_attente_joueur', () => {
  // Le joueur reste connecté au lobby et conserve son identité.
  isQuizzStarted = false;

  joueurPage.style.display = 'flex';
  homePage.style.display = 'none';

  // Afficher uniquement l'avatar et le pseudo.
  avatarsContainer.innerHTML = `
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      gap:28px;
      width:max-content;
      max-width:100%;
      box-sizing:border-box;
      margin:24px auto 0;
    ">
      <img src="${joueurAvatar || ''}" class="avatar-maitre" alt="" />
      <span class="player-name">${joueurPseudo || ''}</span>
    </div>
  `;

  // Masquer les contrôles de connexion et de sélection.
  codeInput.style.display = 'none';
  errorCodeDiv.style.display = 'none';
  labelInput.style.display = 'none';
  btnRetourJoueur.style.display = 'none';
});

socket.on('param_retour_maitre', () => {
  parametresPage.style.display = "none";
  maitrePage.style.display = "flex";
  homePage.style.display = "none";
});
socket.on('erreur_demarrage_quizz', (message) => {
  if (pageJeuMaitre) {
    pageJeuMaitre.style.display = 'none';
  }
  if (parametresPage) {
    parametresPage.style.display = 'flex';
  }
  alert(message);
});

// ----------- TABLEAU + CADRES MODIFIÉS ET GESTION ENVOI DE REPONSE JOUEUR ----------
socket.on('afficher_question', ({ question, index, total, joueurs, themeImages }) => {

  // Déterminer si la question affichée est la dernière.
  derniereQuestionAffichee = index === total - 1;

  const enteteJoueur = document.getElementById('enteteJoueur');

  if (enteteJoueur) {
    enteteJoueur.style.display = '';
    enteteJoueur.colSpan = 2;
    enteteJoueur.textContent = 'Joueur';
  }

  document.querySelectorAll('#jeuJoueursTbody .col-statut')
    .forEach(cellule => {
      cellule.style.display = '';
    });

  pageJeuMaitre.style.display = "flex";
  roundAnswer = question.reponse;
  roundComplement = question.complement;

  // Cadre de réponse et complément sont cachés par défaut
  document.getElementById('jeuReponseCadre').style.display = "none";
  document.getElementById('jeuComplementCadre').style.display = "none";

  // Le contenu est prêt, mais invisible
  document.getElementById('jeuReponseCadre').innerHTML = `<div style="background:#2b2c32;border-radius:16px;padding:18px 38px;font-size:2.2em;font-weight:bold;min-width:120px;text-align:center;box-shadow:0 2px 13px #0005;border:4px solid #3855d6;color:#fff;">${roundAnswer}</div>`;
  document.getElementById('jeuComplementCadre').innerHTML = `<div style="font-size:1.18em;font-weight:500;text-align:center;color:#ececec; margin-top:20px;">${roundComplement}</div>`;

  document.getElementById('jeuThemeImg').innerHTML = "";
  if (themeImages && question.theme && themeImages[question.theme.toUpperCase()]) {
    document.getElementById('jeuThemeImg').innerHTML = `<img src="${themeImages[question.theme.toUpperCase()]}" style="width:350px; height:140px; object-fit:cover; border-radius:18px;">`;
  }
  document.getElementById('jeuQuestionLabel').innerText = `Question ${index+1}/${total} : ${question.question}`;

  // Génération du tableau joueurs
  const tbody = document.getElementById('jeuJoueursTbody');
  tbody.innerHTML = joueurs.map((j, idx) =>
    `<tr>    
      <td class="col-statut"
          style="text-align:center; font-size:2em; font-weight:900;
                line-height:1; padding:10px 8px;
                color:#ff5c5c; border-top:1px solid #353740;">
        ✕
      </td>
      <td class="col-joueur"
          style="text-align:left; padding:10px 12px 10px 8px;
                border-top:1px solid #353740;
                border-right:1px solid #454750;">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="${j.avatar}" class="avatar-maitre" style="width:54px;height:54px;margin:0;">
          <span class="player-name">${j.pseudo}</span>
        </div>
      </td>
      <td class="col-reponse"
          style="text-align:center; padding:10px 8px;
                border-top:1px solid #353740;
                border-right:1px solid #454750;">
        <span id="reponse${idx}">-</span>
      </td>
      <td class="col-score-manche"
          style="text-align:center; padding:10px 8px;
                border-top:1px solid #353740;">
        0
      </td>
      <td class="col-score-total"
          style="text-align:center; padding:10px 8px;
                border-top:1px solid #353740;">
        ${j.scoreTotal ?? 0}
      </td>
    </tr>`
  ).join('');

  const btnAfficher = document.getElementById('btnAfficher');
  const btnAnnuler = document.getElementById('btnAnnulerQuestion');
  const btnSuivant = document.getElementById('btnSuivant');

  btnAfficher.textContent = 'Réponse';
  btnAfficher.style.display = 'none';
  btnAfficher.disabled = true;

  btnAnnuler.style.display = 'none';
  btnAnnuler.disabled = true;

  btnSuivant.textContent = derniereQuestionAffichee
    ? 'Résultats de partie'
    : 'Suivant';
  btnSuivant.style.display = 'none';
  btnSuivant.disabled = true;

  // Demander aux joueurs de ce lobby d'afficher le champ de saisie
  currentLobbyCode = maitreCode;
  socket.emit('demande_saisie_joueur', { code: maitreCode, joueurs: joueurs.map(j => j.pseudo) });
});

socket.on('debut_saisie', ({ duree }) => {
  const btnAfficher = document.getElementById('btnAfficher');
  const btnAnnuler = document.getElementById('btnAnnulerQuestion');
  const btnSuivant = document.getElementById('btnSuivant');

  btnAfficher.style.display = 'none';
  btnAnnuler.style.display = 'none';
  btnSuivant.style.display = 'none';

  btnAfficher.disabled = true;
  btnAnnuler.disabled = true;
  btnSuivant.disabled = true;

  displayTimer(duree, () => {
    // Le serveur gère la clôture effective.
    // Ce callback ne doit plus révéler les réponses.
  });
});

// --- Partie joueur : affichage du champ de saisie pendant le timer ---
socket.on('afficher_saisie_joueur', ({ code }) => {
  if (codeInput.value.trim().toUpperCase() === code && joueurAvatar && joueurPseudo) {
    avatarsContainer.innerHTML = `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:stretch;
        width:max-content;
        max-width:100%;
        box-sizing:border-box;
        margin:24px auto 0;
        gap:24px;
      ">
        <div style="
          display:flex;
          align-items:center;
          justify-content:center;
          gap:28px;
          width:max-content;
          max-width:100%;
          box-sizing:border-box;
        ">
          <img src="${joueurAvatar}" class="avatar-maitre" alt="" />
          <span class="player-name">${joueurPseudo}</span>
        </div>

        <div id="reponseForm" style="
          width:100%;
          box-sizing:border-box;
          margin:0;
          display:flex;
          flex-direction:column;
          align-items:stretch;
          gap:8px;
        ">
          <input
            id="champReponseJoueur"
            type="text"
            style="
              width:100%;
              box-sizing:border-box;
              padding:10px 14px;
              font-size:1.25em;
              text-align:center;
              border-radius:8px;
              border:2px solid #3855d6;
            "
            placeholder="Votre réponse"
            autocomplete="off"
          >

          <button
            id="btnEnvoyerReponse"
            style="
              width:100%;
              box-sizing:border-box;
              margin:0;
              padding:8px 18px;
              font-size:1.1em;
              border-radius:8px;
              background:#3855d6;
              color:#fff;
              border:none;
              cursor:pointer;
            "
          >ENVOYER</button>
        </div>
      </div>
    `;
    document.getElementById('btnEnvoyerReponse').onclick = function() {
      const champReponse = document.getElementById('champReponseJoueur');
      let val = champReponse.value.trim().replace(',', '.');

      if (!/^[-+]?\d*\.?\d+$/.test(val)) {
        alert("Réponse numérique attendue.");
        return;
      }

      joueurResponseSent = val;
      socket.emit('envoi_reponse_joueur', {
        code: code,
        pseudo: joueurPseudo,
        reponse: val
      });

      // Effacer le champ pour confirmer visuellement l'envoi
      // et permettre immédiatement une nouvelle saisie.
      champReponse.value = '';
      champReponse.focus();
    };
  }
});

socket.on('changer_etat_avatar_joueur', ({ etat }) => {
  if (!joueurAvatar) return;

  joueurAvatar = avatarAvecEtat(joueurAvatar, etat);

  const avatarAffiche =
    avatarsContainer.querySelector('img:not(.avatar-item)');

  if (avatarAffiche) {
    avatarAffiche.src = joueurAvatar;
  }
});

// --- Retour à l'affichage initial à la fin du timer sur la page joueur ---
socket.on('reset_affichage_joueur', () => {
  if (joueurAvatar && joueurPseudo) {
    avatarsContainer.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center;
            gap:28px; width:max-content; max-width:100%;
            box-sizing:border-box; margin:24px auto 0;">
        <img src="${joueurAvatar}" class="avatar-maitre" alt="" />
        <span class="player-name">${joueurPseudo}</span>
      </div>
    `;
    joueurResponseSent = "";
  }
});

socket.on('fin_saisie_joueur', () => {
  const formulaire = document.getElementById('reponseForm');

  if (formulaire) {
    formulaire.remove();
  }

  joueurResponseSent = "";
});

// --- Réception de la réponse côté maître : mise à jour du tableau ---
socket.on('statut_reponse', ({ pseudo, valide }) => {
  const lignes = Array.from(
    document.querySelectorAll('#jeuJoueursTbody tr')
  );

  const ligne = lignes.find(tr =>
    tr.querySelector('.player-name')?.textContent === pseudo
  );

  if (!ligne) return;

  const statut = ligne.querySelector('.col-statut');
  if (!statut) return;


  statut.textContent = valide ? '✓' : '✕';
  statut.setAttribute(
    'aria-label',
    valide ? 'Réponse valide' : 'Réponse invalide'
  );

  statut.style.color = valide ? '#45d483' : '#ff5c5c';
  statut.style.fontSize = '2em';
  statut.style.fontWeight = '900';
  statut.style.lineHeight = '1';
  statut.style.textAlign = 'center';
  statut.style.padding = '4px 8px';

});

socket.on('fin_saisie', ({ reponses }) => {

  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  document.getElementById('jeuTimerCadre').style.display = 'none';

  const btnAfficher = document.getElementById('btnAfficher');
  const btnAnnuler = document.getElementById('btnAnnulerQuestion');
  const btnSuivant = document.getElementById('btnSuivant');

  // Les valeurs deviennent visibles, mais pas la réponse de référence.
  reponses.forEach(item => {
    const ligne = Array.from(
      document.querySelectorAll('#jeuJoueursTbody tr')
    ).find(tr =>
      tr.querySelector('.player-name')?.textContent === item.pseudo
    );

    if (!ligne) return;

    const reponseCell = ligne.querySelector('.col-reponse');
    if (reponseCell) {
      reponseCell.textContent =
        item.reponse === null ? '—' : item.reponse;
    }

    const statut = ligne.querySelector('.col-statut');
    if (statut) statut.textContent = '';
  });

  btnAfficher.textContent = 'Réponse';
  btnAfficher.style.display = '';
  btnAfficher.disabled = false;

  btnAnnuler.style.display = 'none';
  btnAnnuler.disabled = true;

  btnSuivant.style.display = 'none';
  btnSuivant.disabled = true;
});

socket.on('afficher_revelation', ({ reponse, complement, classement }) => {
  const btnAfficher = document.getElementById('btnAfficher');
  const btnAnnuler = document.getElementById('btnAnnulerQuestion');
  const btnSuivant = document.getElementById('btnSuivant');

  const cadreTimer = document.getElementById('jeuTimerCadre');
  cadreTimer.style.display = 'none';

  btnAfficher.style.display = 'none';
  btnAnnuler.style.display = '';
  btnAnnuler.disabled = false;

  btnSuivant.style.display = '';
  btnSuivant.disabled = false;

    // Mettre à jour les scores et réordonner les lignes.
  const tbody = document.getElementById('jeuJoueursTbody');

  classement.forEach(joueurClassement => {
    const ligne = Array.from(tbody.querySelectorAll('tr')).find(tr =>
      tr.querySelector('.player-name')?.textContent
        === joueurClassement.pseudo
    );

    if (!ligne) return;

    const statut = ligne.querySelector('.col-statut');
    const scoreManche = ligne.querySelector('.col-score-manche');
    const scoreTotal = ligne.querySelector('.col-score-total');

    if (statut) {
      statut.textContent = joueurClassement.evolution;
      statut.style.fontSize = '2em';
      statut.style.fontWeight = '900';
      statut.style.lineHeight = '1';
      statut.style.textAlign = 'center';
      statut.style.padding = '4px 8px';

      if (joueurClassement.evolution === '↑') {
        statut.style.color = '#45d483';
      } else if (joueurClassement.evolution === '↓') {
        statut.style.color = '#ff5c5c';
      } else {
        statut.style.color = '#dfd111';
      }
    }

    if (scoreManche) {
      const score = Number(joueurClassement.scoreManche);

      scoreManche.textContent = joueurClassement.scoreManche;

      if (score > 0) {
        scoreManche.style.color = '#45d483';
      } else if (score < 0) {
        scoreManche.style.color = '#ff5c5c';
      } else {
        scoreManche.style.color = '';
      }

      const avatar = ligne.querySelector('.avatar-maitre');

      if (avatar) {
        if (score > 0) {
          avatar.src = avatarAvecEtat(avatar.src, 'content');
        } else if (score < 0) {
          avatar.src = avatarAvecEtat(avatar.src, 'decu');
        } else {
          avatar.src = avatarAvecEtat(avatar.src, 'normal');
        }
      }
    }

    if (scoreTotal) {
      scoreTotal.textContent = joueurClassement.scoreTotal;
    }

    // Déplacer la ligne à sa nouvelle position dans le classement.
    tbody.appendChild(ligne);
  });

  // Masquer le chronomètre et afficher la réponse sur la même ligne que le complément.
  const cadreReponse = document.getElementById('jeuReponseCadre');
  const cadreComplement = document.getElementById('jeuComplementCadre');

  cadreTimer.style.display = 'none';

  cadreReponse.style.display = 'flex';
  cadreReponse.style.alignItems = 'center';

  cadreComplement.style.display = 'flex';
  cadreComplement.style.alignItems = 'center';

  cadreReponse.innerHTML = `
    <div style="
      width:100%;
      box-sizing:border-box;
      background:#2b2c32;
      border-radius:16px;
      padding:18px 8px;
      font-size:2.2em;
      font-weight:bold;
      text-align:center;
      overflow-wrap:anywhere;
      border:4px solid #3855d6;
      color:#fff;
      box-shadow:0 2px 13px #0005;
    ">
      ${reponse}
    </div>
  `;

  cadreComplement.innerHTML = `
    <div style="
      width:100%;
      box-sizing:border-box;
      font-size:1.18em;
      font-weight:500;
      text-align:left;
      overflow-wrap:anywhere;
      color:#ececec;
    ">
      ${complement}
    </div>
  `;
});

socket.on('question_annulee', ({ classement }) => {
  const tbody = document.getElementById('jeuJoueursTbody');
  const btnAfficher = document.getElementById('btnAfficher');
  const btnAnnuler = document.getElementById('btnAnnulerQuestion');
  const btnSuivant = document.getElementById('btnSuivant');

  // Masquer la colonne du statut tout en conservant l'en-tête Joueur.
  const enteteJoueur = document.getElementById('enteteJoueur');

  if (enteteJoueur) {
    enteteJoueur.style.display = '';
    enteteJoueur.colSpan = 1;
    enteteJoueur.textContent = 'Joueur';
  }

  tbody.querySelectorAll('.col-statut').forEach(cellule => {
    cellule.style.display = 'none';
    cellule.textContent = '';
  });

  tbody.querySelectorAll('.col-statut').forEach(cellule => {
    cellule.style.display = 'none';
    cellule.textContent = '';
  });

  // Restaurer les scores affichés et l'ordre des joueurs.
  classement.forEach(joueurClassement => {
    const ligne = Array.from(tbody.querySelectorAll('tr')).find(tr =>
      tr.querySelector('.player-name')?.textContent
        === joueurClassement.pseudo
    );

    if (!ligne) return;

    const scoreManche = ligne.querySelector('.col-score-manche');
    const scoreTotal = ligne.querySelector('.col-score-total');

    if (scoreManche) {
      scoreManche.textContent = '0';
      scoreManche.style.color = '';
    }

    const avatar = ligne.querySelector('.avatar-maitre');

    if (avatar) {
      avatar.src = avatarAvecEtat(avatar.src, 'normal');
    }
    if (scoreTotal) {
      scoreTotal.textContent = joueurClassement.scoreTotal;
    }

    tbody.appendChild(ligne);
  });

  // Masquer Réponse et Annuler ; permettre de continuer.
  btnAfficher.style.display = 'none';
  btnAfficher.disabled = true;

  btnAnnuler.style.display = 'none';
  btnAnnuler.disabled = true;

  btnSuivant.style.display = '';
  btnSuivant.disabled = false;
});

function displayTimer(seconds, onFinish) {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  const timerDiv = document.getElementById('jeuTimerCadre');
  timerDiv.style.display = 'flex';
  let time = seconds;
  timerDiv.innerHTML = `<svg width="100" height="100">
      <circle id="timerCircle" r="45" cx="50" cy="50" fill="none" stroke="#3855d6" stroke-width="7"
        stroke-dasharray="282" stroke-dashoffset="0"
        style="transform: rotate(-90deg); transform-origin: 50% 50%;" />
    </svg>
    <div id="timerText" style="position:absolute;left:0;top:0;width:100px;height:100px;display:flex;align-items:center;justify-content:center;font-size:2em;font-weight:bold;color:#fff;">${time}</div>`;
  const circle = timerDiv.querySelector('#timerCircle');
  const timerText = timerDiv.querySelector('#timerText');
  timerInterval = setInterval(() => {
    time--;
    timerText.innerText = time;
    let offset = (time/seconds)*282;
    circle.setAttribute('stroke-dashoffset', `${282-offset}`);
    if (time <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (onFinish) onFinish();
    }
  }, 1000);
  circle.setAttribute('stroke-dashoffset', `0`);
}

document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'btnAfficher') {
    socket.emit('reveler_reponse', {
      code: maitreCode
    });
  }
});

document.addEventListener('click', function(e) {
  if (e.target && e.target.id === "btnAnnulerQuestion") {
    socket.emit('annuler_question', {
      code: maitreCode
    });
  }
});

document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'btnSuivant') {
    // Éviter plusieurs clics pendant le traitement.
    const btnSuivant = document.getElementById('btnSuivant');
    btnSuivant.disabled = true;

    socket.emit('question_suivante', {
      code: maitreCode
    });
  }
});


socket.on('quizz_termine', ({
  historiqueIds = [],
  resultatsPartie = { gagnants: [], themes: [], joueurs: [] }
} = {}) => {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const gagnants = resultatsPartie.gagnants || [];
  const themes = resultatsPartie.themes || [];
  const joueurs = resultatsPartie.joueurs || [];

  const nomsThemes = {
    'DATES': 'Dates',
    'GEOGRAPHIE': 'Géographie',
    'MONDE VIVANT': 'Monde vivant',
    'ECONOMIE': 'Economie',
    'SCIENCES': 'Sciences',
    'DIVERTISSEMENT': 'Divertissement',
    'SONDAGES': 'Sondages',
    'RECORDS': 'Records',
    'IMPROBABLE': 'Improbable'
  };

  const echapperHTML = valeur => String(valeur ?? '').replace(
    /[&<>"']/g,
    caractere => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[caractere]
  );

  const formatScore = valeur => Number(valeur || 0).toFixed(1);

  const libelleRang = rang => {
    if (rang === 1) return '1er';
    return `${rang}ème`;
  };

  const medaille = rang => {
    if (rang === 1) return '🥇';
    if (rang === 2) return '🥈';
    if (rang === 3) return '🥉';
    return '';
  };

  const themesAvecQuestions = themes.filter(
    theme => Number(theme.nombreQuestions) > 0
  );

  const entetesThemesHTML = themesAvecQuestions.map(theme => `
    <th style="
      padding:12px 10px;
      border-bottom:1px solid #454750;
      border-right:1px solid #707482;
      text-align:center;
      min-width:85px;
      white-space:normal;
    ">
      ${echapperHTML(nomsThemes[theme.theme] || theme.theme)}
      <div style="font-size:0.85em;font-weight:400;margin-top:4px;">
        (${echapperHTML(theme.nombreQuestions)})
      </div>
    </th>
  `).join('');

  const lignesScoresHTML = joueurs.map(joueur => {
    const rang = Number(joueur.rang) || 0;
    const marque = medaille(rang);

    const etatAvatar = rang === 1
      ? 'content'
      : rang === 2 || rang === 3
        ? 'normal'
        : 'decu';

    const avatarFinal = avatarAvecEtat(
      joueur.avatar || '',
      etatAvatar
    );

    const cellulesThemesHTML = themesAvecQuestions.map(theme => {
      const moyenne = Number(
        joueur.moyennesThemes?.[theme.theme] ?? 0
      );

      const moyennes = joueurs.map(j =>
        Number(j.moyennesThemes?.[theme.theme] ?? 0)
      );

      const meilleure = Math.max(...moyennes);
      const plusFaible = Math.min(...moyennes);

      let couleurFond = 'transparent';

      if (meilleure !== plusFaible) {
        if (moyenne === meilleure) {
          couleurFond = '#174d35';
        } else if (moyenne === plusFaible) {
          couleurFond = '#612d35';
        }
      }

      return `
        <td style="
          padding:12px 10px;
          text-align:center;
          background:${couleurFond};
          border-bottom:1px solid #353740;
          border-right:1px solid #707482;
          font-variant-numeric:tabular-nums;
        ">
          ${echapperHTML(formatScore(moyenne))}
        </td>
      `;
    }).join('');

    return `
      <tr>
        <td style="
          width:42px;
          padding:10px 4px;
          text-align:center;
          border-bottom:1px solid #353740;
          font-weight:800;
          white-space:nowrap;
          font-size:${marque ? '2em' : '1em'};
        ">
          ${marque || echapperHTML(libelleRang(rang))}
        </td>

        <td style="
          padding:10px 6px;
          border-bottom:1px solid #353740;
          width:210px;
          max-width:210px;
        ">
          <div style="
            display:flex;
            align-items:center;
            gap:8px;
            min-width:0;
          ">
            <img
              src="${echapperHTML(avatarFinal)}"
              alt=""
              style="
                width:48px;
                height:48px;
                object-fit:cover;
                border-radius:50%;
                flex-shrink:0;
              "
            >
            <span
              title="${echapperHTML(joueur.pseudo)}"
              style="
                display:block;
                min-width:0;
                max-width:140px;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap;
                font-weight:600;
                font-size:1.4em;
              "
            >${echapperHTML(joueur.pseudo)}</span>
          </div>
        </td>

        <td style="
          padding:12px 10px;
          text-align:center;
          font-weight:800;
          font-size:1.4em;
          border-bottom:1px solid #353740;
          border-right:2px solid #707482;
          white-space:nowrap;
        ">
          ${echapperHTML(joueur.scoreTotal)}
        </td>

        ${cellulesThemesHTML}
      </tr>
    `;
  }).join('');

  const titreGagnants = gagnants.length === 0
    ? 'Partie terminée !'
    : gagnants.length === 1
      ? `${gagnants[0]} remporte la partie !`
      : `${gagnants.slice(0, -1).join(', ')} et ${gagnants[gagnants.length - 1]} remportent la partie !`;

  pageJeuMaitre.innerHTML = `
    <div style="
      width:100%;
      max-width:1400px;
      box-sizing:border-box;
      margin:0 auto;
      padding:12px;
    ">
      <h1 style="
        text-align:center;
        font-size:clamp(1.5em, 3vw, 2.4em);
        margin:10px 0 30px;
        overflow-wrap:anywhere;
      ">
        ${echapperHTML(titreGagnants)}
      </h1>

      <div style="
        width:100%;
        min-width:0;
        border:1px solid #454750;
        border-radius:14px;
        padding:12px;
        box-sizing:border-box;
      ">
        <div style="overflow-x:auto;width:100%;">
          <table style="
            width:100%;
            border-collapse:collapse;
            text-align:left;
          ">
            <thead>
              <tr>
                <th
                  colspan="3"
                  style="
                    padding:12px 10px;
                    text-align:center;
                    border-bottom:1px solid #454750;
                    border-right:2px solid #707482;
                  "
                >
                  Classement final
                </th>
                <th
                  colspan="${themesAvecQuestions.length}"
                  style="
                    padding:12px 10px;
                    text-align:center;
                    border-bottom:1px solid #454750;
                  "
                >
                  Détail des scores
                </th>
              </tr>
              <tr>
                <th style="padding:8px 4px;border-bottom:1px solid #454750;"></th>
                <th style="padding:8px 6px;border-bottom:1px solid #454750;"></th>
                <th style="
                  padding:8px 10px;
                  text-align:center;
                  border-bottom:1px solid #454750;
                  border-right:2px solid #707482;
                ">
                  Total
                </th>
                ${entetesThemesHTML}
              </tr>
            </thead>
            <tbody>
              ${lignesScoresHTML || `
                <tr>
                  <td colspan="${3 + themesAvecQuestions.length}"
                      style="padding:12px;">
                    Aucun joueur à afficher.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <div style="
        display:flex;
        flex-wrap:wrap;
        gap:12px;
        justify-content:center;
        margin-top:28px;
      ">
        <button id="btnNouvellePartie">
          Nouvelle partie
        </button>

        <button id="btnTelechargerHistorique">
          Télécharger l'historique
        </button>
      </div>

    </div>
  `;

  document.getElementById('btnNouvellePartie').onclick = () => {
    pageJeuMaitre.style.display = 'none';
    parametresPage.style.display = 'flex';

    socket.emit('nouvelle_partie_configuration', {
      code: maitreCode
    });
  };

  document.getElementById('btnTelechargerHistorique').onclick = () => {
    const ids = [
      ...new Set(
        historiqueIds
          .map(id => String(id).trim())
          .filter(id => id !== '')
      )
    ];

    const contenu = ids.join(';');
    const fichier = new Blob(
      [contenu],
      { type: 'text/plain;charset=utf-8' }
    );

    const url = URL.createObjectURL(fichier);
    const lien = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    lien.href = url;
    lien.download = `historique-questions-${date}.txt`;

    document.body.appendChild(lien);
    lien.click();
    lien.remove();

    URL.revokeObjectURL(url);
  };
});

socket.on('joueur_logout', () => {
  joueurPage.style.display = "none";
  homePage.style.display = "flex";
  avatarsContainer.innerHTML = "";
  selectedAvatar = null;
  joueurPseudo = null;
  joueurAvatar = null;
  isQuizzStarted = false;
  codeInput.value = "";
  errorCodeDiv.innerText = "";
});