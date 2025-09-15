const socket = io();

// Commun
const homePage = document.getElementById('homePage');
const pseudoInput = document.getElementById('pseudoInput');
const btnMaitre = document.getElementById('btnMaitre');
const btnJoueur = document.getElementById('btnJoueur');
const qrCodeDiv = document.getElementById('qrCode');

// MAITRE
const maitrePage = document.getElementById('maitrePage');
const codeLabel = document.getElementById('codeLabel');
const maitrePlayersList = document.getElementById('maitrePlayersList');

// JOUEUR
const joueurPage = document.getElementById('joueurPage');
const codeInput = document.getElementById('codeInput');
const avatarsContainer = document.getElementById('avatarsContainer');
const errorCodeDiv = document.getElementById('errorCodeDiv');
let selectedAvatar = null;
let joinedCode = null;

function showQRCode(element) {
  element.innerHTML = "";
  setTimeout(() => {
    new QRCode(element, {
      text: window.location.origin + "?code=" + code,
      width: 140,
      height: 140,
      colorDark: "#222",
      colorLight: "#fff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }, 10);
}

// Affichage page Maitre
btnMaitre.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  if (pseudo.length > 0) {
    socket.emit('createLobby', pseudo);
  }
};

socket.on('lobbyCreated', (code) => {
  homePage.style.display = "none";
  maitrePage.style.display = "flex";
  codeLabel.innerText = "CODE : " + code;
  showQRCode(qrCodeDivMaitre, code);
});

socket.on('lobbyUpdate', ({code, joueurs, maitrePseudo}) => {
  maitrePlayersList.innerHTML = joueurs.map(p =>
    `<li class="player-item">
      <img src="${p.avatar || ''}" class="avatar-maitre" alt="" />
      <span class="player-name">${p.pseudo}</span>
    </li>`
  ).join('');
});

// Affichage page Joueur et sélection avatar
btnJoueur.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  if (pseudo.length > 0) {
    homePage.style.display = "none";
    joueurPage.style.display = "flex";
    socket.emit('requestNormalAvatars');
  } else { alert("Entrez un pseudo avant de jouer !"); return; }
};

// Avatars, sélection & surbrillance
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
      if (code.length === 6 && pseudo.length > 0) {
        socket.emit('joinLobby', {pseudo, code, avatar: selectedAvatar});
      }
    };
  });
});

socket.on('lobbyJoined', (code) => {
  joinedCode = code;
  errorCodeDiv.innerText = "";
  showQRCode(qrCodeDivJoueur, code);
});

socket.on('errorLobby', (msg) => {
  errorCodeDiv.innerText = msg;
});

socket.on('lobbyClosed', () => {
  joueurPage.style.display = "none";
  homePage.style.display = "flex";
  alert("La partie a été fermée par le maitre.");
});

window.onload = () => {
  homePage.style.display = "flex";
  maitrePage.style.display = "none";
  joueurPage.style.display = "none";
  pseudoInput.value = "";
  qrCodeDiv.innerHTML = "";
  showQRCode(qrCodeDiv);
};