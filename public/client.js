const socket = io();

const homePage = document.getElementById('homePage');
const pseudoInput = document.getElementById('pseudoInput');
const labelPseudo = document.getElementById('labelPseudo');
const btnMaitre = document.getElementById('btnMaitre');
const btnJoueur = document.getElementById('btnJoueur');
const qrCodeDiv = document.getElementById('qrCode');
const maitrePage = document.getElementById('maitrePage');
const joueurPage = document.getElementById('joueurPage');
const playersList = document.getElementById('playersList');
const avatarsContainer = document.getElementById('avatarsContainer');
let selectedAvatar = null;

// QR code de la page en cours
function showQRCode() {
  qrCodeDiv.innerHTML = "";
  new QRCode(qrCodeDiv, window.location.href);
}

// Affichage page Maitre
btnMaitre.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  if (pseudo.length > 0) {
    socket.emit('join', {pseudo, role: "maitre"});
    homePage.style.display = "none";
    maitrePage.style.display = "block";
    showQRCode();
  }
};

socket.on('players', (players) => {
  // Liste des joueurs (role "joueur" uniquement)
  const joueurs = players.filter(p => p.role === "joueur");
  playersList.innerHTML = joueurs.map(p =>
    `<li>${p.pseudo} ${p.avatar ? `<img src="${p.avatar}" style="height:24px;">` : ""}</li>`
  ).join('');
});

// Affichage page Joueur et sélection avatar
btnJoueur.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  if (pseudo.length > 0) {
    homePage.style.display = "none";
    joueurPage.style.display = "block";
    showQRCode();
    socket.emit('requestNormalAvatars');
  }
};

socket.on('normalAvatars', (avatarFiles) => {
  avatarsContainer.innerHTML = avatarFiles.map(file =>
    `<img src="${file}" class="avatar-item" style="width:64px;height:64px;margin:4px;border-radius:8px;cursor:pointer;border:2px solid #fff;">`
  ).join('');
  document.querySelectorAll('.avatar-item').forEach(img => {
    img.onclick = () => {
      selectedAvatar = img.src;
      document.querySelectorAll('.avatar-item').forEach(i => i.style.border = "2px solid #fff");
      img.style.border = "4px solid #3855d6";
      const pseudo = pseudoInput.value.trim();
      socket.emit('join', {pseudo, role:"joueur", avatar: selectedAvatar });
    };
  });
});

window.onload = () => {
  homePage.style.display = "block";
  maitrePage.style.display = "none";
  joueurPage.style.display = "none";
  pseudoInput.value = "";
  qrCodeDiv.innerHTML = "";
};