import client, { Counter, Gauge } from 'prom-client';

client.collectDefaultMetrics({
  prefix: 'stacks_app',
});

export const numberOfUsers = new Gauge({
  name: 'number_of_users',
  help: 'Number of users',
});

export const numberOfDailyTransactions = new Gauge({
  name: 'number_of_transactions',
  help: 'Number of transactions',
});

export const numberOfValidSessions = new Counter({
  name: 'game_session_validated',
  help: 'Number of valid sessions',
});

export const numberOfFraudAttemptsDetected = new Counter({
  name: 'number_of_fraud_attempts',
  help: 'Number of fraud attempts detected',
});

export const numberOfReferralsUserd = new Gauge({
  name: 'number_of_referrals_used',
  help: 'Number of referrals used',
});
