import { getApiBase, isOnline as navigatorOnline } from './platform';

const HEALTH_CHECK_INTERVAL_MS = 15000;
const HEALTH_CHECK_TIMEOUT_MS = 5000;

let lastKnownOnline = navigatorOnline();
let probeInFlight: Promise<boolean> | null = null;

export async function probeServerConnectivity(): Promise<boolean> {
  if (!navigatorOnline()) {
    lastKnownOnline = false;
    return false;
  }

  if (probeInFlight) return probeInFlight;

  probeInFlight = (async () => {
    try {
      const base = getApiBase().replace(/\/api$/, '');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

      const response = await fetch(`${base}/api/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);

      lastKnownOnline = response.ok;
      return lastKnownOnline;
    } catch {
      lastKnownOnline = false;
      return false;
    } finally {
      probeInFlight = null;
    }
  })();

  return probeInFlight;
}

export function isOnline(): boolean {
  if (!navigatorOnline()) return false;
  return lastKnownOnline;
}

export function getLastKnownOnline(): boolean {
  return lastKnownOnline;
}

export function startConnectivityMonitor(onChange: (online: boolean) => void): () => void {
  const check = async () => {
    const wasOnline = lastKnownOnline;
    const nowOnline = await probeServerConnectivity();
    if (wasOnline !== nowOnline) {
      onChange(nowOnline);
    }
  };

  void check();

  const handleOnline = () => void check();
  const handleOffline = () => {
    lastKnownOnline = false;
    onChange(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  const interval = setInterval(() => void check(), HEALTH_CHECK_INTERVAL_MS);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    clearInterval(interval);
  };
}

export async function waitForConnectivity(maxWaitMs = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await probeServerConnectivity()) return true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}
