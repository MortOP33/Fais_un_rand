const socket = io();
let role = null;
let partieCommencee = false;

const homePage = document.getElementById('homePage');
const maitrePage = document.getElementById('maitrePage');
const joueurPage = document.getElementById('joueurPage');
const btnMaitre = document.getElementById('btnMaitre');
const btnJouer = document.getElementById('btnJouer');
const playersList = document.getElementById('playersList');
const btnStart = document.getElementById('btnStart');
const btnReset = document.getElementById('btnReset');

btnMaitre.onclick = function() {
  role = 'maitre';
  showPage('maitre');
  socket.emit('setRole', { role: 'maitre' });
};

btnJouer.onclick = function() {
  const pseudo = document.getElementById('pseudoInput').value.trim();
  if (!pseudo) { alert("Entrez un pseudo avant de jouer !"); return; }
  role = 'joueur';
  showPage('joueur');
  socket.emit('setRole', { role: 'joueur', pseudo });
}

btnStart.onclick = function() {
  socket.emit('start');
};
btnReset.onclick = function() {
  socket.emit('reset');
};

let joueursState = [];
socket.on('state', (state) => {
  partieCommencee = state.started;
  joueursState = state.joueurs || [];
  const btnMaitre = document.getElementById('btnMaitre');
  if (btnMaitre) {
    btnMaitre.disabled = !!state.maitrePris;
  }
});

socket.on('players', (players) => {
  playersList.innerHTML = players.map(p => `<li>${p.pseudo}</li>`).join('');
});

socket.on('reset', function() {
  if (role === "maitre") {
    showPage('home');
    role = null;
  }
});

function showPage(page) {
  rolePage.classList.toggle('hidden', page !== 'home');
  if (page === 'home') {
    socket.emit('leaveRole');
  }
  maitrePage.classList.toggle('hidden', page !== 'maitre');
  joueurPage.classList.toggle('hidden', page !== 'joueur');
}
showPage('home');

// Génération du QR code avec l'URL actuelle
const currentURL = window.location.href;
new QRCode(document.getElementById("qrcode"), {
  text: currentURL,
  width: 128,
  height: 128,
  colorDark: "#000000",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H,
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log("SW enregistré"))
      .catch(err => console.error("SW erreur", err));
  });
}