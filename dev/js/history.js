
// Utilities
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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

// Render history table with optional filter
function renderHistory(filter = 'all') {
  const historyList = document.getElementById('historyList');
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
      </tr>
    `;
  });

  html += '</tbody></table>';
  historyList.innerHTML = html;
}

// History panel controls
document.getElementById('historyBtn').addEventListener('click', () => {
  renderHistory('all');
  document.getElementById('historyPanel').classList.remove('hidden');
  const settingsPanel = document.getElementById('settingsPanel');
  if (settingsPanel) settingsPanel.classList.remove('open');
});

document.getElementById('closeHistoryBtn').addEventListener('click', () => {
  document.getElementById('historyPanel').classList.add('hidden');
});

document.getElementById('historyFilterSelect').addEventListener('change', (e) => {
  renderHistory(e.target.value);
});
