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

    // Ajout de la page paramètres
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
  // Affichage esthétique sur 2 colonnes alignées
  let html = `<div style="display:table;width:100%;margin:0 auto;">`;
  const total = joueurs.length;
  for (let i = 0; i < total; i += 2) {
    html += `<div style="display:table-row;">`;

    // Colonne gauche
    if (joueurs[i]) {
      html += `<div style="display:table-cell;vertical-align:middle;padding-bottom:10px;width:50%;text-align:right;">
        <div style="display:inline-flex;align-items:center;gap:18px;">
          <img src="${joueurs[i].avatar || ''}" class="avatar-maitre" alt="" />
          <span class="player-name">${joueurs[i].pseudo}</span>
        </div>
      </div>`;
    } else {
      html += `<div style="display:table-cell;width:50%;"></div>`;
    }

    // Colonne droite
    if (joueurs[i+1]) {
      html += `<div style="display:table-cell;vertical-align:middle;padding-bottom:10px;width:50%;text-align:left;">
        <div style="display:inline-flex;align-items:center;gap:18px;">
          <img src="${joueurs[i+1].avatar || ''}" class="avatar-maitre" alt="" />
          <span class="player-name">${joueurs[i+1].pseudo}</span>
        </div>
      </div>`;
    }
    // Si dernier joueur impair, colonne droite vide et centré
    else if (!joueurs[i+1]) {
      html += `<div style="display:table-cell;width:50%;text-align:center;">
        <div style="display:inline-flex;align-items:center;gap:18px;justify-content:center;">
          <!-- rien ici, colonne vide -->
        </div>
      </div>`;
    }
    html += `</div>`;
    // Centrage du dernier joueur impair sur toute la ligne
    if (!joueurs[i+1] && total % 2 === 1 && i === total - 1) {
      html = html.replace(
        `<div style="display:table-cell;vertical-align:middle;padding-bottom:10px;width:50%;text-align:right;">`,
        `<div style="display:table-cell;vertical-align:middle;padding-bottom:10px;width:100%;text-align:center;" colspan="2">`
      );
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