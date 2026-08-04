export function withDeadline<T>(promise: Promise<T>, ms: number, fallback: () => T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback());
      }
    }, ms);

    promise.then(
      (value) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(value);
        }
      },
      () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallback());
        }
      }
    );
  });
}

/**
 * Build a fallback result array for `Promise.allSettled`-style destructuring.
 * The array length MUST match the number of promises being awaited, otherwise
 * destructured members become `undefined` and accessing `.status` crashes.
 */
export function rejectedResults(count: number): PromiseSettledResult<any>[] {
  return Array.from({ length: count }, () => ({ status: 'rejected' as const, reason: 'deadline' }));
}
