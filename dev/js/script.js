function toggleSettings() {
  document.getElementById('settingsPanel').classList.toggle('open');
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const button = document.getElementById('darkModeToggle');
  button.setAttribute('aria-pressed', document.body.classList.contains('dark-mode'));
}

function resetScores() {
  document.getElementById('score1').textContent = '0';
  document.getElementById('score2').textContent = '0';
}

function exitToHome() {
  document.getElementById('home').classList.remove('hidden');
  document.getElementById('game').classList.add('hidden');
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('settingsPanel').classList.remove('open');
}

function startGame(mode) {
  const game = document.getElementById('game');
  game.classList.remove('hidden', 'solo', 'duel');
  game.classList.add(mode);
  
  const name1 = document.getElementById('name1').value || 'Player A';
  const name2 = document.getElementById('name2').value || (mode === 'solo' ? 'Deck' : 'Player B');
  document.getElementById('nameDisplay1').textContent = name1;
  document.getElementById('nameDisplay2').textContent = name2;
  
  document.getElementById('home').classList.add('hidden');
  resetScores();
}

function addScore(playerId) {
  const increment = parseInt(document.getElementById('increment').value || 5);
  const scoreEl = document.getElementById(playerId === 'player1' ? 'score1' : 'score2');
  let score = parseInt(scoreEl.textContent) || 0;
  score += increment;
  scoreEl.textContent = score;
  checkForWinner();
}

function undo(playerId) {
  const increment = parseInt(document.getElementById('increment').value || 5);
  const scoreEl = document.getElementById(playerId === 'player1' ? 'score1' : 'score2');
  let score = parseInt(scoreEl.textContent) || 0;
  score = Math.max(0, score - increment);
  scoreEl.textContent = score;
}

function checkForWinner() {
  const score1 = parseInt(document.getElementById('score1').textContent);
  const score2 = parseInt(document.getElementById('score2').textContent);
  const target1 = parseInt(document.getElementById('target1').value) || 300;
  const target2 = parseInt(document.getElementById('target2').value) || 
    (document.getElementById('game').classList.contains('solo') ? 350 : 300);

  if (score1 >= target1 || score2 >= target2) {
    const name1 = document.getElementById('nameDisplay1').textContent;
    const name2 = document.getElementById('nameDisplay2').textContent;
    const winner = score1 >= target1 ? name1 : name2;
    const mode = document.getElementById('game').classList.contains('solo') ? 'solo' : 'duel';

    // ✅ Save game to history
    saveGameToHistory({
      mode,
      name1,
      score1,
      name2,
      score2,
      winner,
      timestamp: new Date().toISOString()
      
console.log("Saved game:", {
  mode, name1, score1, name2, score2, winner
});




    document.getElementById('modal').classList.remove('hidden');
  }
}


// Modal Buttons
document.getElementById('playAgainBtn').addEventListener('click', () => {
  resetScores();
  document.getElementById('modal').classList.add('hidden');
});

document.getElementById('closeModalBtn').addEventListener('click', exitToHome);

// History (placeholder, add logic later)
document.getElementById('historyBtn').addEventListener('click', () => {
  document.getElementById('historyPanel').classList.remove('hidden');
});
document.getElementById('closeHistoryBtn').addEventListener('click', () => {
  document.getElementById('historyPanel').classList.add('hidden');
});

// Stay Awake (Wake Lock) Feature
let wakeLock = null;
const fallbackVideo = document.getElementById('stayAwakeVideo');

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock was released');
      });
      console.log('Wake Lock is active');
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  } else {
    if (fallbackVideo) {
      fallbackVideo.play().catch(err => console.warn("Fallback video failed:", err));
      console.log("Using video fallback to stay awake.");
    }
  }
}

function releaseWakeLock() {
  if (wakeLock !== null) {
    wakeLock.release();
    wakeLock = null;
    console.log('Wake Lock manually released');
  }
  if (fallbackVideo) {
    fallbackVideo.pause();
    fallbackVideo.currentTime = 0;
    console.log("Fallback video stopped.");
  }
}

const wakeLockToggle = document.getElementById('toggle-wake-lock');
if (wakeLockToggle) {
  wakeLockToggle.addEventListener('change', async (event) => {
    if (event.target.checked) {
      await requestWakeLock();
    } else {
      releaseWakeLock();
    }
  });
}

document.addEventListener('visibilitychange', async () => {
  if (
    document.visibilityState === 'visible' &&
    wakeLockToggle?.checked
  ) {
    await requestWakeLock();
  }
});
