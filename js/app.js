// DOM references
const game = document.getElementById('game');
const modal = document.getElementById('modal');
const score1El = document.getElementById('score1');
const score2El = document.getElementById('score2');
const nameDisplay1 = document.getElementById('nameDisplay1');
const nameDisplay2 = document.getElementById('nameDisplay2');
const darkModeBtn = document.getElementById('darkModeToggle');
const incrementSelects = document.querySelectorAll('#increment');
const historyBtn = document.getElementById('historyBtn');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const historyFilterSelect = document.getElementById('historyFilterSelect');

// Game state
let scores = { player1: 0, player2: 0 };
let history = { player1: [], player2: [] };
let targets = { player1: 300, player2: 300 };
let increment = 5;
let currentMode = null;
let currentSettings = {};
let darkModeEnabled = false;
let wakeLock = null;

// Helpers
function escapeHtml(text) {
  return text.replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Game logic
function startGame(mode) {
  currentMode = mode;
  currentSettings = {
    name1: document.getElementById("name1").value.trim() || "Player A",
    name2: document.getElementById("name2").value.trim() || (mode === "solo" ? "Deck" : "Player B"),
    target1: parseInt(document.getElementById("target1").value, 10) || 300,
    target2: parseInt(document.getElementById("target2").value, 10) || (mode === "solo" ? 350 : 300),
    increment: parseInt(document.querySelector("#home #increment").value, 10)
  };
  increment = currentSettings.increment;
  targets.player1 = currentSettings.target1;
  targets.player2 = currentSettings.target2;
  nameDisplay1.textContent = currentSettings.name1;
  nameDisplay2.textContent = currentSettings.name2;

  scores = { player1: 0, player2: 0 };
  history = { player1: [], player2: [] };
  updateScores();

  document.getElementById("home").classList.add("hidden");
  game.classList.remove("solo", "duel", "hidden");
  game.classList.add(mode);
  historyPanel.classList.add("hidden");
  document.getElementById("settingsPanel").classList.remove("open");
}

function addScore(player) {
  scores[player] += increment;
  history[player].push(increment);
  updateScores();
  checkWin();
}

function undo(player) {
  if (history[player].length > 0) {
    scores[player] -= history[player].pop();
    updateScores();
  }
}

function updateScores() {
  score1El.textContent = scores.player1;
  score2El.textContent = scores.player2;
}

function checkWin() {
  if (scores.player1 >= targets.player1 || scores.player2 >= targets.player2) {
    const winnerName = scores.player1 >= targets.player1 ? currentSettings.name1 : currentSettings.name2;
    endGame(winnerName);
  }
}

function endGame(winnerName) {
  const gameData = {
    mode: currentMode,
    name1: currentSettings.name1,
    score1: scores.player1,
    name2: currentSettings.name2,
    score2: scores.player2,
    winner: winnerName
  };
  const historyArray = JSON.parse(localStorage.getItem("dominoHistory")) || [];
  historyArray.push(gameData);
  if (historyArray.length > 20) historyArray.shift();
  localStorage.setItem("dominoHistory", JSON.stringify(historyArray));

  document.getElementById("modalTitle").textContent = `${winnerName} Wins!`;
  modal.classList.remove("hidden");
}

function exitToHome() {
  document.getElementById("home").classList.remove("hidden");
  game.classList.add("hidden");
  modal.classList.add("hidden");
  document.getElementById("settingsPanel").classList.remove("open");
  historyPanel.classList.add("hidden");
}

function resetScores() {
  scores = { player1: 0, player2: 0 };
  history = { player1: [], player2: [] };
  updateScores();
  modal.classList.add("hidden");
}

// Settings
function toggleSettings() {
  document.getElementById("settingsPanel").classList.toggle("open");
}

function toggleDarkMode() {
  darkModeEnabled = !darkModeEnabled;
  document.body.classList.toggle("dark-mode", darkModeEnabled);
  darkModeBtn.setAttribute("aria-pressed", darkModeEnabled);
  darkModeBtn.textContent = darkModeEnabled ? '🌞' : '🌙';
  localStorage.setItem("dominoDarkMode", darkModeEnabled ? '1' : '0');
}

incrementSelects.forEach(select => {
  select.addEventListener("change", e => {
    increment = parseInt(e.target.value, 10);
    incrementSelects.forEach(s => s.value = increment);
    localStorage.setItem("dominoScoreIncrement", increment);
  });
});

// History
historyBtn.addEventListener("click", () => {
  renderHistory();
  historyPanel.classList.remove("hidden");
});

historyFilterSelect.addEventListener("change", () => renderHistory());

document.getElementById("closeHistoryBtn").addEventListener("click", () => {
  historyPanel.classList.add("hidden");
});

function renderHistory() {
  const filter = historyFilterSelect.value;
  const historyArray = JSON.parse(localStorage.getItem("dominoHistory")) || [];
  const filtered = filter === 'all' ? historyArray : historyArray.filter(h => h.mode === filter);

  if (filtered.length === 0) {
    historyList.innerHTML = '<p style="text-align:center;">No games played yet.</p>';
    return;
  }

  let html = '<table><thead><tr><th>Mode</th><th>Player A</th><th>Score</th><th>Player B</th><th>Score</th><th>Winner</th></tr></thead><tbody>';
  filtered.slice(-20).reverse().forEach(g => {
    html += `<tr><td>${capitalize(g.mode)}</td><td>${escapeHtml(g.name1)}</td><td>${g.score1}</td><td>${escapeHtml(g.name2)}</td><td>${g.score2}</td><td><strong>${escapeHtml(g.winner)}</strong></td></tr>`;
  });
  html += '</tbody></table>';
  historyList.innerHTML = html;
}

// Wake Lock
const wakeLockToggle = document.getElementById("toggle-wake-lock");
const fallbackVideo = document.getElementById("stayAwakeVideo");

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock?.request("screen");
    wakeLock?.addEventListener("release", () => console.log("Wake lock released"));
  } catch (err) {
    console.warn("Wake lock error:", err);
    fallbackVideo?.play();
  }
}

function releaseWakeLock() {
  wakeLock?.release();
  wakeLock = null;
  fallbackVideo?.pause();
}

wakeLockToggle?.addEventListener("change", e => {
  if (e.target.checked) requestWakeLock();
  else releaseWakeLock();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && wakeLockToggle?.checked) requestWakeLock();
});

// Startup
window.addEventListener("load", () => {
  if (localStorage.getItem("dominoDarkMode") === '1') toggleDarkMode();
  const savedIncrement = localStorage.getItem("dominoScoreIncrement");
  if (savedIncrement) {
    increment = parseInt(savedIncrement);
    incrementSelects.forEach(s => s.value = increment);
  }
});

document.getElementById('playAgainBtn').addEventListener('click', () => {
  modal.classList.add("hidden");
  startGame(currentMode);
});

document.getElementById('closeModalBtn').addEventListener('click', exitToHome);

document.getElementById('player1').addEventListener('keydown', e => {
  if (['Enter', ' '].includes(e.key)) addScore('player1');
});

document.getElementById('player2').addEventListener('keydown', e => {
  if (['Enter', ' '].includes(e.key)) addScore('player2');
});
