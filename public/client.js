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

// Actions et page paramètres inchangés
let btnRetour, btnParametres, parametresPage;

window.onload = () => {
  homePage.style.display = "flex";
  maitrePage.style.display = "none";
  joueurPage.style.display = "none";
  pseudoInput.value = "";
  codeInput.value = "";
  errorCodeDiv.innerText = "";
  qrCodeDiv.innerHTML = "";
  showQRCode(qrCodeDiv);

  // Ajout des boutons si pas déjà présents
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
      maitrePage.style.display = "none";
      homePage.style.display = "flex";
      codeLabel.innerText = "";
      playersList.innerHTML = "";
    };

    btnParametres = document.createElement('button');
    btnParametres.innerText = "Créer partie";
    btnParametres.style.flex = "1";
    btnParametres.onclick = () => {
      maitrePage.style.display = "none";
      parametresPage.style.display = "flex";
    };

    actionsDiv.appendChild(btnRetour);
    actionsDiv.appendChild(btnParametres);

    maitrePage.appendChild(actionsDiv);

    parametresPage = document.createElement('div');
    parametresPage.className = "center-vertical";
    parametresPage.id = "parametresPage";
    parametresPage.style.display = "none";
    parametresPage.innerHTML = `
      <h2 style="text-align:center; margin-bottom:0;">Paramètres de partie</h2>
      <button style="margin-top:32px;" onclick="document.getElementById('parametresPage').style.display='none'; document.getElementById('maitrePage').style.display='flex';">Retour</button>
    `;
    document.body.appendChild(parametresPage);
  }
};

// Affiche le QR code sur le home
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
  codeLabel.innerText = "CODE : " + code;
});

socket.on('players', (joueurs) => {
  // 1. Séparation en deux colonnes
  let colG = [], colD = [];
  for (let i = 0; i < joueurs.length; i += 2) {
    colG.push(joueurs[i]);
    if (joueurs[i+1]) colD.push(joueurs[i+1]);
  }

  // 2. Calcul de la largeur max pseudo gauche (on utilise canvas pour mesurer en police .player-name)
  let maxPseudo = "";
  colG.forEach(j => { if (j && j.pseudo.length > maxPseudo.length) maxPseudo = j.pseudo; });
  let pseudoWidth = 0;
  if (maxPseudo) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    ctx.font = "700 1.3em Arial";
    pseudoWidth = ctx.measureText(maxPseudo).width;
  }
  // 3. Espacement horizontal
  const avatarSize = 64, avatarMargin = 18; // comme dans .avatar-maitre
  const gapBetween = avatarMargin * 2; // espace entre nom le + long et avatar de droite

  // 4. Génération du HTML
  let html = `<div style="display:flex; flex-direction:column; width:100%; align-items:center;">`;
  for (let row = 0; row < colG.length; row++) {
    // Si dernier impair
    if (!colD[row]) {
      html += `<div style="width:100%; display:flex; justify-content:center; margin-bottom:10px;">
        <div style="display:inline-flex; align-items:center;">
          <img src="${colG[row]?.avatar || ''}" class="avatar-maitre" alt="" />
          <span class="player-name" style="font-size:1.3em; font-weight:700; letter-spacing:1px; margin-left:18px;">${colG[row]?.pseudo}</span>
        </div>
      </div>`;
    } else {
      html += `<div style="width:100%; display:flex; justify-content:center; margin-bottom:10px;">
        <div style="display:flex; flex-direction:row;">
          <!-- Colonne gauche -->
          <div style="display:inline-flex; align-items:center; min-width:${avatarSize+pseudoWidth+avatarMargin}px;">
            <img src="${colG[row]?.avatar || ''}" class="avatar-maitre" alt="" />
            <span class="player-name" style="font-size:1.3em; font-weight:700; letter-spacing:1px; margin-left:18px;">${colG[row]?.pseudo}</span>
          </div>
          <!-- Espace entre colonnes -->
          <div style="width:${gapBetween}px;"></div>
          <!-- Colonne droite -->
          <div style="display:inline-flex; align-items:center;">
            <img src="${colD[row]?.avatar || ''}" class="avatar-maitre" alt="" />
            <span class="player-name" style="font-size:1.3em; font-weight:700; letter-spacing:1px; margin-left:18px;">${colD[row]?.pseudo}</span>
          </div>
        </div>
      </div>`;
    }
  }
  html += `</div>`;
  playersList.innerHTML = html;
});

btnJoueur.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  if (pseudo.length > 0) {
    homePage.style.display = "none";
    joueurPage.style.display = "flex";
    socket.emit('requestNormalAvatars');
  } else { alert("Entrez un pseudo avant de jouer !"); return; }
};

socket.on('normalAvatars', (avatarFiles) => {
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
      socket.emit('joueur_join', {pseudo, code, avatar: selectedAvatar});
      errorCodeDiv.innerText = "";
    };
  });
});

socket.on('errorCode', (msg) => {
  errorCodeDiv.innerText = msg;
});