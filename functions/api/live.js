function httpsUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password) return url;
  } catch {
    // Missing or invalid configuration.
  }
}

export async function onRequestGet({ env }) {
  const audio = httpsUrl(env.LIVE_AUDIO_URL);
  if (!audio) return status('unknown');
  const endpoint = httpsUrl(env.LIVE_STATUS_URL);
  if (!endpoint) return status('unknown', audio);

  try {
    const res = await fetch(endpoint, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return status('unknown', audio);
    const { icestats } = await res.json();
    if (!icestats) return status('unknown', audio);
    const sources = [icestats.source].flat();
    // Hosts may report an internal origin or use a different public listener path.
    const mount = env.LIVE_MOUNT_PATH || audio.pathname;
    const live = sources.some((source) => {
      try {
        return new URL(source.listenurl, endpoint).pathname === mount;
      } catch {
        return false;
      }
    });
    return live ? status('live', audio) : status('offline');
  } catch {
    return status('unknown', audio);
  }
}

function status(state, audio) {
  return Response.json({ state, audioUrl: audio?.href }, {
    headers: { 'cache-control': 'no-store' },
  });
}
