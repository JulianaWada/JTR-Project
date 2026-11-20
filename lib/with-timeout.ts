/** Rejects after `ms` if the promise hasn't settled, so a stuck database call can't keep a page loading forever. */
export function withTimeout<T>(promise: Promise<T>, ms: number, what = "The database"): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(`${what} did not answer within ${ms / 1000} seconds.`), { code: "CONNECT_TIMEOUT" })), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
