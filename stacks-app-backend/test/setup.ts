// Suppress dotenv console logs during tests
const originalLog: typeof console.log = console.log;
console.log = (...args: unknown[]) => {
  const message = args[0]?.toString() || '';
  // Filter out dotenv info messages
  if (message.includes('[dotenv@') || message.includes('dotenvx.com')) {
    return;
  }
  originalLog(...args);
};
