const casterStats = 'https://morcast.caster.fm:14790/admin/publicstats.json';
const casterMount = '/KLL9t';
const casterWidget = 'https://widgets.cloud.caster.fm/player/a34c04ef-ad3b-4d0f-9de7-10ec986dc153/?token=acc0a215-d612-4095-8f12-152238459a60';

async function casterStatus() {
  try {
    const response = await fetch(casterStats, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const [format, stats] = await response.json();
      if (format?.name === 'icestats' && typeof stats?.server_id === 'string') {
        const sources = stats.source;
        if (sources == null) return 'offline';
        if (typeof sources === 'object' && !Array.isArray(sources)) {
          return Object.hasOwn(sources, casterMount) ? 'live' : 'offline';
        }
      }
    }
  } catch {
    // The streaming server also refuses connections when it is switched off.
  }

  try {
    const response = await fetch(casterWidget, {
      headers: { 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const html = await response.text();
      // The public player includes the provider's server readiness flag in its bootstrap data.
      const account = html.match(/window\.casterfmCloud\.account\s*=\s*JSON\.parse\('([^\r\n]+?)'\)/)?.[1];
      if (account && /\\u0022streaming_server_ready\\u0022\s*:\s*0\s*[,}]/.test(account)) {
        return 'offline';
      }
    }
  } catch {
    // No confirmed broadcast state.
  }
  return 'unknown';
}

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
  if (!audio) return status(await casterStatus());
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
