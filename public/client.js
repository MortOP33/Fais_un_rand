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
let isQuizzStarted = false; // pour page joueur

// Ajout des boutons et page paramètres dynamiquement
let btnRetour, btnCreerPartie, parametresPage, btnRetourJoueur;

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
    // Actions
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
      socket.emit('joueur_logout'); // au cas où maitre est aussi joueur
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
      <button style="margin-top:32px;" onclick="document.getElementById('parametresPage').style.display='none'; document.getElementById('maitrePage').style.display='flex';">Retour</button>
    `;
    document.body.appendChild(parametresPage);
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

// Affiche QR code sur le home
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
  // Colonne unique, format avatar + pseudo
  playersList.innerHTML = joueurs.map(p =>
    `<li class="player-item">
      <img src="${p.avatar || ''}" class="avatar-maitre" alt="" />
      <span class="player-name">${p.pseudo}</span>
    </li>`
  ).join('');
  // Activer bouton "Créer partie" si ≥2 joueurs
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
  } else {
    // Affichage avatar+pseudo (après début quizz)
    avatarsContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:24px; margin-top:24px;">
        <img src="${joueurAvatar || ''}" class="avatar-maitre" style="margin-bottom:10px;" alt="" />
        <span class="player-name">${joueurPseudo || ''}</span>
      </div>
    `;
    btnRetourJoueur.style.display = "none";
  }
});

socket.on('errorCode', (msg) => {
  errorCodeDiv.innerText = msg;
});

// Quand le maitre lance la partie, tous les joueurs doivent passer à l'affichage avatar+nom
socket.on('quizz_started', () => {
  isQuizzStarted = true;
  // On force l'affichage avatar+pseudo
  avatarsContainer.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:24px; margin-top:24px;">
      <img src="${joueurAvatar || ''}" class="avatar-maitre" style="margin-bottom:10px;" alt="" />
      <span class="player-name">${joueurPseudo || ''}</span>
    </div>
  `;
  btnRetourJoueur.style.display = "none";
});

// Déconnexion joueur
socket.on('disconnect', () => {
  // On peut forcer retour à l'accueil si besoin
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

// Pour la page paramètres : chargement dynamique des thèmes
function loadThemes() {
  fetch('/Themes')
    .then(async res => {
      // Récupère la liste des fichiers du dossier Themes
      if (res.ok) {
        // On doit parser le HTML, car ce n'est pas une API
        const parser = new DOMParser();
        const doc = parser.parseFromString(await res.text(), 'text/html');
        const files = Array.from(doc.querySelectorAll('a'))
          .map(a => a.getAttribute('href'))
          .filter(f => f && (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp')));
        const themesList = document.getElementById('themesList');
        themesList.innerHTML = files.map((file, idx) => `
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <input type="checkbox" checked id="themeCheck${idx}" style="width:22px;height:22px;">
            <img src="/Themes/${file.replace(/^.*\//, '')}" style="width:64px; height:64px; object-fit:cover; border-radius:8px; border:1.5px solid #3855d6;">
          </div>
        `).join('');
      }
    })
    .catch(() => {});
}

// Chargement des thèmes à chaque affichage page paramètres
if (parametresPage) {
  parametresPage.addEventListener('show', loadThemes);
}
const oldShow = parametresPage ? parametresPage.style.display : null;
Object.defineProperty(parametresPage, 'style', {
  set: function(val) {
    if (val === 'flex') { loadThemes(); }
    if (oldShow) oldShow = val;
    this.setAttribute('display', val);
  }
});

// Pour compatibilité, on recharge les thèmes à chaque ouverture
document.addEventListener('click', function(e) {
  if (parametresPage && parametresPage.style.display === 'flex') {
    loadThemes();
  }
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

// Event reçu quand le quizz démarre côté joueur
socket.on('quizz_started', () => {
  isQuizzStarted = true;
  avatarsContainer.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:24px; margin-top:24px;">
      <img src="${joueurAvatar || ''}" class="avatar-maitre" style="margin-bottom:10px;" alt="" />
      <span class="player-name">${joueurPseudo || ''}</span>
    </div>
  `;
  btnRetourJoueur.style.display = "none";
});