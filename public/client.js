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
const labelInput = document.getElementById('labelSelectionnetonavatar');
const errorCodeDiv = document.getElementById('errorCodeDiv');
let selectedAvatar = null;
let maitreCode = null;
let joueurPseudo = null;
let joueurAvatar = null;
let isQuizzStarted = false;

let btnRetour, btnCreerPartie, parametresPage, btnRetourJoueur, btnDemarrer, pageJeuMaitre;

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
      const nbQuestions = parseInt(document.getElementById('nbQuestions').value) || 10;
      const themesChecked = Array.from(document.querySelectorAll('#themesList input[type="checkbox"]:checked')).map((input, i) =>
        ["DATES","GEOGRAPHIE","MONDE VIVANT","ECONOMIE","SCIENCES","DIVERTISSEMENT","SONDAGES","RECORDS","IMPROBABLE"][i]
      );
      socket.emit('demarrer_quizz', { code: maitreCode, nbQuestions, themes: themesChecked });
      parametresPage.style.display = "none";
      createPageJeuMaitre();
      pageJeuMaitre.style.display = "flex";
    };
    const btnRetourParam = parametresPage.querySelector('#btnRetourParam');
    btnRetourParam.onclick = () => {
      parametresPage.style.display = "none";
      socket.emit('param_retour', { code: maitreCode });
      maitrePage.style.display = "flex";
      homePage.style.display = "none";
    };
  }

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

function createPageJeuMaitre() {
  if (!pageJeuMaitre) {
    pageJeuMaitre = document.createElement('div');
    pageJeuMaitre.className = "center-vertical";
    pageJeuMaitre.id = "pageJeuMaitre";
    pageJeuMaitre.style.display = "none";
    document.body.appendChild(pageJeuMaitre);
  }
  pageJeuMaitre.innerHTML = `
    <div id="jeuThemeImg" style="text-align:center; margin-bottom:24px;"></div>
    <div id="jeuQuestionLabel" style="font-size:1.3em; font-weight:700; text-align:center; margin-bottom:18px;"></div>
    <div id="jeuCadres" style="display:flex; gap:24px; justify-content:center; margin-bottom:24px;">
      <div id="jeuReponseCadre" style="background:#222; border-radius:10px; padding:12px 22px; min-width:90px; font-size:1.2em; text-align:center; display:none;"></div>
      <div id="jeuComplementCadre" style="background:#191b1f; border-radius:10px; padding:12px 22px; min-width:260px; font-size:1.1em; text-align:left; display:none;"></div>
      <div id="jeuTimerCadre" style="width:100px; height:100px; position:relative; display:flex; align-items:center; justify-content:center;"></div>
    </div>
    <table id="jeuJoueursTable" style="width:100%; max-width:700px; margin-bottom:22px;">
      <thead>
        <tr>
          <th style="text-align:left;">Joueur</th>
          <th>Réponse</th>
          <th>Score question</th>
          <th>Score total</th>
        </tr>
      </thead>
      <tbody id="jeuJoueursTbody"></tbody>
    </table>
    <div style="display:flex; gap:24px; justify-content:center;">
      <button id="btnAfficher" disabled style="flex:1;">Afficher</button>
      <button id="btnSuivant" disabled style="flex:1;">Suivant</button>
    </div>
  `;
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
    labelInput.style.display = "";
  } else { alert("Entrez un pseudo avant de jouer !"); return; }
};

socket.on('normalAvatars', (avatarFiles) => {
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
    codeInput.style.display = "";
    errorCodeDiv.style.display = "";
    labelInput.style.display = "";
    btnRetourJoueur.style.display = "inline-block";
  } else {
    avatarsContainer.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; gap:18px; margin-top:24px;">
        <img src="${joueurAvatar || ''}" class="avatar-maitre" alt="" />
        <span class="player-name">${joueurPseudo || ''}</span>
      </div>
    `;
    codeInput.style.display = "none";
    errorCodeDiv.style.display = "none";
    labelInput.style.display = "none";
    btnRetourJoueur.style.display = "none";
  }
});

socket.on('errorCode', (msg) => {
  errorCodeDiv.innerText = msg;
});

socket.on('quizz_started', () => {
  isQuizzStarted = true;
  avatarsContainer.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center; gap:18px; margin-top:24px;">
      <img src="${joueurAvatar || ''}" class="avatar-maitre" alt="" />
      <span class="player-name">${joueurPseudo || ''}</span>
    </div>
  `;
  codeInput.style.display = "none";
  errorCodeDiv.style.display = "none";
  labelInput.style.display = "none";
  btnRetourJoueur.style.display = "none";
});

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

socket.on('param_retour_joueurs', () => {
  isQuizzStarted = false;
  joueurPage.style.display = "flex";
  homePage.style.display = "none";
  avatarsContainer.innerHTML = "";
  btnRetourJoueur.style.display = "inline-block";
  codeInput.style.display = "";
  errorCodeDiv.style.display = "";
  labelInput.style.display = "";
  socket.emit('requestNormalAvatars');
});

socket.on('param_retour_maitre', () => {
  parametresPage.style.display = "none";
  maitrePage.style.display = "flex";
  homePage.style.display = "none";
});

socket.on('afficher_question', ({ question, index, total, joueurs }) => {
  pageJeuMaitre.style.display = "flex";
  document.getElementById('jeuThemeImg').innerHTML = `<img src="public/Themes/${question.theme.toLowerCase()}.jpg" style="width:350px; height:140px; object-fit:cover; border-radius:18px;">`;
  document.getElementById('jeuQuestionLabel').innerText = `Question ${index+1}/${total} : ${question.question}`;
  document.getElementById('jeuReponseCadre').style.display = 'none';
  document.getElementById('jeuComplementCadre').style.display = 'none';
  displayTimer(30, () => {
    document.getElementById('jeuTimerCadre').innerHTML = '';
    document.getElementById('btnAfficher').disabled = false;
  });
  document.getElementById('btnAfficher').disabled = true;
  document.getElementById('btnSuivant').disabled = true;

  const tbody = document.getElementById('jeuJoueursTbody');
  tbody.innerHTML = joueurs.map(j =>
    `<tr>
      <td style="display:flex;align-items:center;gap:12px;">
        <img src="${j.avatar}" class="avatar-maitre" style="width:40px;height:40px;margin:0;">
        <span>${j.pseudo}</span>
      </td>
      <td><input type="text" style="width:60px;text-align:center;" disabled></td>
      <td>0</td>
      <td>0</td>
    </tr>`
  ).join('');
});

function displayTimer(seconds, onFinish) {
  const timerDiv = document.getElementById('jeuTimerCadre');
  let time = seconds;
  timerDiv.innerHTML = `<svg width="100" height="100"><circle id="timerCircle" r="45" cx="50" cy="50" fill="none" stroke="#3855d6" stroke-width="7" stroke-dasharray="282" stroke-dashoffset="0"/></svg>
    <div id="timerText" style="position:absolute;left:0;top:0;width:100px;height:100px;display:flex;align-items:center;justify-content:center;font-size:2em;font-weight:bold;color:#fff;">${time}</div>`;
  const circle = timerDiv.querySelector('#timerCircle');
  const timerText = timerDiv.querySelector('#timerText');
  let interval = setInterval(() => {
    time--;
    timerText.innerText = time;
    let offset = (seconds-time)*282/seconds; // offset s'inverse
    circle.setAttribute('stroke-dashoffset', `${offset}`);
    if (time <= 0) {
      clearInterval(interval);
      if (onFinish) onFinish();
    }
  }, 1000);
  circle.setAttribute('stroke-dashoffset', `0`);
}

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