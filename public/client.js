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
const errorCodeDiv = document.getElementById('errorCodeDiv');
let selectedAvatar = null;
let maitreCode = null;
let joueurPseudo = null;
let joueurAvatar = null;
let isQuizzStarted = false;

let btnRetour, btnCreerPartie, parametresPage, btnRetourJoueur, btnDemarrer;

window.onload = () => {
  homePage.style.display = "flex";
  maitrePage.style.display = "none";
  joueurPage.style.display = "none";
  pseudoInput.value = "";
  codeInput.value = "";
  errorCodeDiv.innerText = "";
  qrCodeDiv.innerHTML = "";
  showQRCode(qrCodeDiv);

  // Ajout dynamique si pas déjà présents
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

    // Page paramètres
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

    btnDemarrer = parametresPage.querySelector('#btnDemarrer');
    btnDemarrer.onclick = () => {
      alert('Le quiz va démarrer (fonction à définir)');
    };
    const btnRetourParam = parametresPage.querySelector('#btnRetourParam');
    btnRetourParam.onclick = () => {
      parametresPage.style.display = "none";
      // Correction: le maitre revient sur sa page maitre, joueurs sur sélection avatar
      socket.emit('param_retour', { code: maitreCode });
      // Pour le maitre : on affiche la page maitre (code inchangé, joueurs, boutons)
      maitrePage.style.display = "flex";
      homePage.style.display = "none";
    };
  }

  // Ajout du bouton retour sur page joueur si pas déjà présent
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

btnMaitre.onclick = () => {
  socket.emit('maitre_create');
  homePage.style.display = "none";
  maitrePage.style.display = "flex";
};

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

// Page joueur : sélection avatar ou affichage avatar+nom si quizz démarré
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
    document.querySelector("h3").style.display = "";
  } else { alert("Entrez un pseudo avant de jouer !"); return; }
};

socket.on('normalAvatars', (avatarFiles) => {
  // Sélection avatar ou affichage avatar+nom selon état quizz
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
    // Affiche champs code, label et bouton retour
    codeInput.style.display = "";
    errorCodeDiv.style.display = "";
    document.querySelector("h3").style.display = "";
    btnRetourJoueur.style.display = "inline-block";
  } else {
    // Affichage avatar+pseudo sur une même ligne (après début quizz)
    avatarsContainer.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; gap:18px; margin-top:24px;">
        <img src="${joueurAvatar || ''}" class="avatar-maitre" alt="" />
        <span class="player-name">${joueurPseudo || ''}</span>
      </div>
    `;
    // Cache le champ code, label, bouton retour
    codeInput.style.display = "none";
    errorCodeDiv.style.display = "none";
    document.getElementById('labelSelectionnetonavatar').style.display = "none";
    btnRetourJoueur.style.display = "none";
  }
});

socket.on('errorCode', (msg) => {
  errorCodeDiv.innerText = msg;
});

// Quand le maitre lance la partie, tous les joueurs doivent passer à l'affichage avatar+nom
socket.on('quizz_started', () => {
  isQuizzStarted = true;
  avatarsContainer.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center; gap:18px; margin-top:24px;">
      <img src="${joueurAvatar || ''}" class="avatar-maitre" alt="" />
      <span class="player-name">${joueurPseudo || ''}</span>
    </div>
  `;
  // Cache le champ code, label, bouton retour
  codeInput.style.display = "none";
  errorCodeDiv.style.display = "none";
  document.getElementById('labelSelectionnetonavatar').style.display = "none";
  btnRetourJoueur.style.display = "none";
});

// Déconnexion joueur
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

// Lorsque le maitre clique sur RETOUR dans la page paramètres, tous les joueurs reviennent à la page de sélection d'avatar
socket.on('param_retour_joueurs', () => {
  isQuizzStarted = false;
  joueurPage.style.display = "flex";
  homePage.style.display = "none";
  avatarsContainer.innerHTML = "";
  btnRetourJoueur.style.display = "inline-block";
  codeInput.style.display = "";
  errorCodeDiv.style.display = "";
  document.querySelector("h3").style.display = "";
  socket.emit('requestNormalAvatars');
});

// Nouvel event côté maitre pour RETOUR depuis paramètres
socket.on('param_retour_maitre', () => {
  parametresPage.style.display = "none";
  maitrePage.style.display = "flex";
  // On ne touche pas au code ni à la liste des joueurs ni aux boutons
  homePage.style.display = "none";
});

// Déconnexion joueur côté serveur
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