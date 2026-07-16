const BASE = "https://v3.football.api-sports.io";

const CACHE_TIME = 30 * 60 * 1000;
const REQUEST_INTERVAL = 7000;

const cache = new Map<string, { expires: number; data: any }>();
let requestQueue: Promise<void> = Promise.resolve();
let lastRequestTime = 0;

async function waitForTurn() {
  const wait = Math.max(0, REQUEST_INTERVAL - (Date.now() - lastRequestTime));
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestTime = Date.now();
}

export async function apiFootball(path: string) {
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now()) return cached.data;

  let result: any;
  let failure: unknown;

  requestQueue = requestQueue.then(async () => {
    try {
      const cachedAgain = cache.get(path);
      if (cachedAgain && cachedAgain.expires > Date.now()) {
        result = cachedAgain.data;
        return;
      }

      await waitForTurn();

      const key = process.env.API_FOOTBALL_KEY;
      if (!key) throw new Error("API_FOOTBALL_KEY não configurada.");

      const response = await fetch(`${BASE}${path}`, {
        headers: { "x-apisports-key": key },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`API-Football respondeu ${response.status}.`);
      }

      if (data.errors && Object.keys(data.errors).length) {
        throw new Error(Object.values(data.errors).join(" | "));
      }

      cache.set(path, {
        data,
        expires: Date.now() + CACHE_TIME,
      });

      result = data;
    } catch (error) {
      failure = error;
    }
  });

  await requestQueue;

  if (failure) throw failure;
  return result;
}

export function stat(stats: any[] | undefined, type: string): number {
  const item = (stats || []).find((x) => x.type === type);
  if (!item) return 0;
  if (typeof item.value === "number") return item.value;

  const value = Number(String(item.value ?? "").replace("%", ""));
  return Number.isFinite(value) ? value : 0;
}

export function average<T>(rows: T[], pick: (row: T) => number): number {
  return rows.length
    ? rows.reduce((sum, row) => sum + pick(row), 0) / rows.length
    : 0;
}
