import { Counter, Gauge, Histogram } from 'prom-client';

export const numberOfUsers = new Gauge({
  name: 'number_of_users',
  help: 'Number of users',
});

export const numberOfDailyTransactions = new Gauge({
  name: 'number_of_transactions',
  help: 'Number of transactions',
});

export const numberOfDefiOperations = new Gauge({
  name: 'number_of_defi_operations',
  help: 'Number of DeFi operations',
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

export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 5],
});
