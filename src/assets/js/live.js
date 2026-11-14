const badge = document.querySelector('[data-live-status]');
const player = document.querySelector('[data-live-audio]');
const help = document.querySelector('[data-live-help]');
const labels = { live: 'On air', offline: 'Off air', unknown: 'Live status unavailable' };

function showHelp(message) {
  help.textContent = message;
  help.hidden = !message;
}

player.addEventListener('playing', () => showHelp(''));
player.addEventListener('error', () => {
  if (!player.hidden) showHelp('The audio signal is unavailable. Refresh the page to try again.');
});

async function refresh() {
  try {
    const response = await fetch('/api/live', { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error('Status unavailable');
    const { state, audioUrl } = await response.json();
    const label = labels[state] || labels.unknown;
    if (badge.textContent !== label) badge.textContent = label;
    badge.dataset.state = state;

    if (audioUrl) {
      if (player.getAttribute('src') !== audioUrl) {
        player.src = audioUrl;
        showHelp('');
      }
      player.hidden = false;
    } else {
      player.hidden = true;
      if (player.hasAttribute('src')) {
        player.removeAttribute('src');
        player.load();
      }
      showHelp('');
    }
  } catch {
    if (badge.textContent !== labels.unknown) badge.textContent = labels.unknown;
    badge.dataset.state = 'unknown';
  } finally {
    setTimeout(refresh, 20_000);
  }
}

refresh();
