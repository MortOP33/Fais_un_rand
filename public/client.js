const socket = io();
const homePage = document.getElementById('homePage');
const lobbyPage = document.getElementById('lobbyPage');
const pseudoInput = document.getElementById('pseudoInput');
const btnJouer = document.getElementById('btnJouer');
const qrCodeDiv = document.getElementById('qrCode');
const playersList = document.getElementById('playersList');

btnJouer.onclick = () => {
  const pseudo = pseudoInput.value.trim();
  if (pseudo.length > 0) {
    socket.emit('join', pseudo);
    homePage.style.display = "none";
    lobbyPage.style.display = "block";
    qrCodeDiv.innerHTML = "";
    new QRCode(qrCodeDiv, window.location.href);
  }
};

socket.on('players', (players) => {
  playersList.innerHTML = players.map(p => `<li>${p.pseudo}</li>`).join('');
});

window.onload = () => {
  homePage.style.display = "block";
  lobbyPage.style.display = "none";
  pseudoInput.value = "";
  qrCodeDiv.innerHTML = "";
};