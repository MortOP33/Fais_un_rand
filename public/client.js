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
let selectedAvatar = null;

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

// Affichage page Maitre
btnMaitre.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  if (pseudo.length > 0) {
    socket.emit('join', {pseudo, role: "maitre"});
    homePage.style.display = "none";
    maitrePage.style.display = "flex";
  }
};

socket.on('players', (players) => {
  // Liste des joueurs (role "joueur" uniquement)
  const joueurs = players.filter(p => p.role === "joueur");
  playersList.innerHTML = joueurs.map(p =>
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
  }
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
      socket.emit('join', {pseudo, role:"joueur", avatar: selectedAvatar });
    };
  });
});

window.onload = () => {
  homePage.style.display = "flex";
  maitrePage.style.display = "none";
  joueurPage.style.display = "none";
  pseudoInput.value = "";
  qrCodeDiv.innerHTML = "";
  showQRCode(qrCodeDiv);
};