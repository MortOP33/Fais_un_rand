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
  maitreCode = code;
  codeLabel.innerText = "CODE : " + code;
});

socket.on('players', (joueurs) => {
  playersList.innerHTML = joueurs.map(p =>
    `<li class="player-item">
      <img src="${p.avatar || ''}" class="avatar-maitre" alt="" />
      <span class="player-name">${p.pseudo}</span>
    </li>`
  ).join('');
});

btnJoueur.onclick = () => {
  homePage.style.display = "none";
  joueurPage.style.display = "flex";
  socket.emit('requestNormalAvatars');
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

window.onload = () => {
  homePage.style.display = "flex";
  maitrePage.style.display = "none";
  joueurPage.style.display = "none";
  pseudoInput.value = "";
  codeInput.value = "";
  errorCodeDiv.innerText = "";
  qrCodeDiv.innerHTML = "";
  showQRCode(qrCodeDiv);
};