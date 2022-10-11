export function runAsync(fn: () => Promise<unknown>): () => void {
  return () => fn();
}

export const sleep = async (ms = 500) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};
