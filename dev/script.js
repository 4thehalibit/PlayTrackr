document.addEventListener('DOMContentLoaded', () => {
// Scores and game state
    let scores = { player1: 0, player2: 0 };
    let history = { player1: [], player2: [] };
    let targets = { player1: 300, player2: 300 };
    let increment = 5;
    let currentMode = null;
    let currentSettings = {};
    let darkModeEnabled = false;

    // Start game function
    function startGame(mode) {
      currentMode = mode;

      currentSettings = {
        name1: document.getElementById("name1").value.trim() || "Player A",
        name2: document.getElementById("name2").value.trim() || (mode === "solo" ? "Deck" : "Player B"),
        target1: parseInt(document.getElementById("target1").value, 10) || 300,
        target2: parseInt(document.getElementById("target2").value, 10) || (mode === "solo" ? 350 : 300),
        increment: parseInt(document.getElementById("increment").value, 10)
      };

      increment = currentSettings.increment;
      targets.player1 = currentSettings.target1;
      targets.player2 = currentSettings.target2;

      document.getElementById("nameDisplay1").textContent = currentSettings.name1;
      document.getElementById("nameDisplay2").textContent = currentSettings.name2;

      document.getElementById("home").classList.add("hidden");

      const gameDiv = document.getElementById("game");
      gameDiv.classList.remove("solo", "duel");
      gameDiv.classList.add(mode);
      gameDiv.classList.remove("hidden");

      // Reset scores and history arrays for undo
      scores = { player1: 0, player2: 0 };
      history = { player1: [], player2: [] };
      updateScores();

      // Sync increment selector in settings with chosen increment
      document.getElementById('scoreIncrementSelect').value = increment.toString();

      // Hide other panels
      hideHistoryPanel();
      hideSettings();
    }

    // Add score when player area tapped
    function addScore(player) {
      scores[player] += increment;
      history[player].push(increment);
      updateScores();
      checkWin();
      if (navigator.vibrate) navigator.vibrate(50);
    }

    // Undo last score increment for a player
    function undo(player) {
      if (history[player].length > 0) {
        const last = history[player].pop();
        scores[player] -= last;
        updateScores();
      }
    }

    // Update displayed scores
    function updateScores() {
      document.getElementById("score1").textContent = scores.player1;
      document.getElementById("score2").textContent = scores.player2;
    }

    // Check if someone reached target to win
    function checkWin() {
      if (scores.player1 >= targets.player1) {
        endGame(currentSettings.name1, scores.player1, currentSettings.name2, scores.player2, currentMode);
      } else if (scores.player2 >= targets.player2) {
        endGame(currentSettings.name2, scores.player2, currentSettings.name1, scores.player1, currentMode);
      }
    }

    // End game: show winner modal and save game history
    function endGame(winnerName, winnerScore, loserName, loserScore, mode) {
      saveGameToHistory({
        mode: mode,
        name1: currentSettings.name1,
        score1: scores.player1,
        name2: currentSettings.name2,
        score2: scores.player2,
        winner: winnerName
      });

      const modal = document.getElementById("modal");
      document.getElementById("modalTitle").textContent = `${winnerName} Wins!`;
      modal.classList.remove("hidden");
    }

    // Save completed game to localStorage history
    function saveGameToHistory(game) {
      let allHistory = JSON.parse(localStorage.getItem('dominoHistory')) || [];
      allHistory.push(game);
      if (allHistory.length > 20) {
        allHistory.shift(); // keep last 20
      }
      localStorage.setItem('dominoHistory', JSON.stringify(allHistory));
    }

    // Modal buttons handlers
    document.getElementById("playAgainBtn").addEventListener("click", () => {
      hideModal();
      startGame(currentMode);
    });

    document.getElementById("closeModalBtn").addEventListener("click", () => {
      hideModal();
      exitToHome();
    });

    function hideModal() {
      document.getElementById("modal").classList.add("hidden");
    }

    // Exit to home screen
    function exitToHome() {
      document.getElementById("game").classList.add("hidden");
      document.getElementById("home").classList.remove("hidden");
      hideHistoryPanel();
      hideSettings();
    }

    // History panel elements
    const historyBtn = document.getElementById('historyBtn');
    const historyPanel = document.getElementById('historyPanel');
    const historyList = document.getElementById('historyList');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const historyFilterSelect = document.getElementById('historyFilterSelect');

    historyBtn.addEventListener('click', () => {
      renderHistory('all');
      historyPanel.classList.remove('hidden');
      hideSettings();
    });

    closeHistoryBtn.addEventListener('click', () => {
      hideHistoryPanel();
    });

    historyFilterSelect.addEventListener('change', () => {
      renderHistory(historyFilterSelect.value);
    });

    function hideHistoryPanel() {
      historyPanel.classList.add('hidden');
    }

    // Render history table with optional filter
    function renderHistory(filter = 'all') {
      const allHistory = JSON.parse(localStorage.getItem('dominoHistory')) || [];
      let filteredHistory = allHistory;

      if (filter === 'solo' || filter === 'duel') {
        filteredHistory = allHistory.filter(h => h.mode === filter);
      }

      if (filteredHistory.length === 0) {
        historyList.innerHTML = '<p style="text-align:center; margin-top:10px;">No games played yet.</p>';
        return;
      }

      let html = '<table><thead><tr><th>Mode</th><th>Player A</th><th>Score</th><th>Player B / Deck</th><th>Score</th><th>Winner</th></tr></thead><tbody>';

      // Show last 20 games newest first
      filteredHistory.slice(-20).reverse().forEach(game => {
        const winnerA = game.score1 > game.score2;
        const winnerB = game.score2 > game.score1;
        const tie = !winnerA && !winnerB;

        let rowClass = '';
        if (winnerA) rowClass = 'winner';
        else if (winnerB) rowClass = 'loser';

        html += `
  <tr class="${rowClass}">
    <td>${capitalize(game.mode)}</td>
    <td>${escapeHtml(game.name1)}</td>
    <td>${game.score1}</td>
    <td>${escapeHtml(game.name2)}</td>
    <td>${game.score2}</td>
    <td style="font-weight: 700; color: ${winnerA ? '#155724' : winnerB ? '#721c24' : '#6c757d'};">
      ${tie ? 'Tie' : winnerA ? escapeHtml(game.name1) : escapeHtml(game.name2)}
    </td>
  </tr>`;
      });

      html += '</tbody></table>';
      historyList.innerHTML = html;
    }

    // Escape HTML to prevent XSS from user input in names
    function escapeHtml(text) {
      return text.replace(/[&<>"']/g, function(m) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[m];
      });
    }

    // Capitalize first letter helper
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Settings panel toggle
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsToggleBtn = document.querySelector('.settings-toggle');

    function toggleSettings() {
      if (settingsPanel.classList.contains('open')) {
        hideSettings();
      } else {
        showSettings();
      }
    }

    function showSettings() {
      settingsPanel.classList.add('open');
      historyPanel.classList.add('hidden');
    }

    function hideSettings() {
      settingsPanel.classList.remove('open');
    }

    // Dark mode toggle button
    const darkModeBtn = document.getElementById('darkModeToggle');

    function toggleDarkMode() {
      darkModeEnabled = !darkModeEnabled;
      if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        darkModeBtn.setAttribute('aria-pressed', 'true');
        darkModeBtn.textContent = '🌞';
      } else {
        document.body.classList.remove('dark-mode');
        darkModeBtn.setAttribute('aria-pressed', 'false');
        darkModeBtn.textContent = '🌙';
      }
      // Save preference
      localStorage.setItem('dominoDarkMode', darkModeEnabled ? '1' : '0');
    }

    // Load dark mode preference on startup
    window.addEventListener('load', () => {
      if (localStorage.getItem('dominoDarkMode') === '1') {
        darkModeEnabled = false; // so toggle flips it on
        toggleDarkMode();
      }

      // Load increment from settings into home screen
      const savedIncrement = localStorage.getItem('dominoScoreIncrement');
      if (savedIncrement) {
        document.getElementById('scoreIncrementSelect').value = savedIncrement;
        document.getElementById('increment').value = savedIncrement;
        increment = parseInt(savedIncrement, 10);
      }
    });

    // Sync increment selector in settings and home screen inputs
    const scoreIncrementSelect = document.getElementById('scoreIncrementSelect');
    const homeIncrementSelect = document.getElementById('increment');

    scoreIncrementSelect.addEventListener('change', () => {
      increment = parseInt(scoreIncrementSelect.value, 10);
      homeIncrementSelect.value = increment;
      localStorage.setItem('dominoScoreIncrement', increment.toString());
    });

    homeIncrementSelect.addEventListener('change', () => {
      increment = parseInt(homeIncrementSelect.value, 10);
      scoreIncrementSelect.value = increment;
      localStorage.setItem('dominoScoreIncrement', increment.toString());
    });

    // Reset scores action (doesn't exit game, just resets scores and undo history)
    function resetScores() {
      scores = { player1: 0, player2: 0 };
      history = { player1: [], player2: [] };
      updateScores();
      hideModal();
    }

    // Accessibility: keyboard support for player score buttons
    document.getElementById('player1').addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        addScore('player1');
      }
    });

    document.getElementById('player2').addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        addScore('player2');
      }
    });

    // Setup event listeners
    document.querySelector('.settings-toggle')?.addEventListener('click', toggleSettings);
    document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);
    document.getElementById('resetScoresBtn')?.addEventListener('click', resetScores);
    document.getElementById('exitToHomeBtn')?.addEventListener('click', exitToHome);
    document.getElementById('playAgainBtn')?.addEventListener('click', () => { hideModal(); startGame(currentMode); });
    document.getElementById('closeModalBtn')?.addEventListener('click', () => { hideModal(); exitToHome(); });

    document.querySelectorAll('[data-player]').forEach(el => {
      el.addEventListener('click', () => addScore(el.id));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          addScore(el.id);
        }
      });
    });
});
