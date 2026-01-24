module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/src/index.js',
      instances: 1,
      interpreter: 'node',
      exec_mode: 'fork',
    },
    {
      name: 'streaks-worker',
      script: 'dist/src/infra/workers/streaks/index.js',
      instances: 1,
      interpreter: 'node',
      exec_mode: 'fork',
    },
    {
      name: 'rewards-worker',
      script: 'dist/src/infra/workers/rewards/index.js',
      instances: 1,
      interpreter: 'node',
      exec_mode: 'fork',
    },
    {
      name: 'transaction-worker',
      script: 'dist/src/infra/workers/transactions/index.js',
      instances: 1,
      interpreter: 'node',
      exec_mode: 'fork',
    },
    {
      name: 'submissions-cleanup-worker',
      script: 'dist/src/infra/workers/submissions/index.js',
      instances: 1,
      interpreter: 'node',
      exec_mode: 'fork',
    },
    {
      name: 'stacking-worker',
      script: 'dist/src/infra/workers/stacking/index.js',
      instances: 1,
      interpreter: 'node',
      exec_mode: 'fork',
    },
  ],
};
