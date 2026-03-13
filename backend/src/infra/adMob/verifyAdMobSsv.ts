import { createVerify } from 'crypto';
import { InvalidAdMobSignatureError } from '../../application/errors/transactionErrors';

const ADMOB_VERIFIER_KEYS_URL =
  'https://www.gstatic.com/admob/reward/verifier-keys.json';
const MAX_ADMOB_KEY_CACHE_MS = 24 * 60 * 60 * 1000;

type AdMobVerifierKey = {
  keyId: number | string;
  base64: string;
};

type AdMobVerifierKeyResponse = {
  keys?: AdMobVerifierKey[];
};

type AdMobVerifierKeyCache = {
  expiresAt: number;
  keys: AdMobVerifierKey[];
};

let verifierKeyCache: AdMobVerifierKeyCache | null = null;
let verifierKeyFetchPromise: Promise<AdMobVerifierKeyCache> | null = null;

function getVerifierKeyCacheTtlMs(cacheControlHeader: string | null): number {
  const maxAgeMatch = cacheControlHeader?.match(/max-age=(\d+)/i);
  if (!maxAgeMatch) {
    return MAX_ADMOB_KEY_CACHE_MS;
  }

  const maxAgeSeconds = Number(maxAgeMatch[1]);
  if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds <= 0) {
    return MAX_ADMOB_KEY_CACHE_MS;
  }

  return Math.min(maxAgeSeconds * 1000, MAX_ADMOB_KEY_CACHE_MS);
}

async function fetchVerifierKeys(): Promise<AdMobVerifierKeyCache> {
  const response = await fetch(ADMOB_VERIFIER_KEYS_URL);
  if (!response.ok) {
    throw new InvalidAdMobSignatureError('Failed to fetch AdMob public keys');
  }

  const data = (await response.json()) as AdMobVerifierKeyResponse;
  const keys = data.keys ?? [];
  if (keys.length === 0) {
    throw new InvalidAdMobSignatureError('AdMob public keys are unavailable');
  }

  const ttlMs = getVerifierKeyCacheTtlMs(response.headers.get('cache-control'));
  return {
    keys,
    expiresAt: Date.now() + ttlMs,
  };
}

async function getVerifierKeys(): Promise<AdMobVerifierKey[]> {
  if (verifierKeyCache && verifierKeyCache.expiresAt > Date.now()) {
    return verifierKeyCache.keys;
  }

  if (!verifierKeyFetchPromise) {
    verifierKeyFetchPromise = fetchVerifierKeys();
  }

  try {
    verifierKeyCache = await verifierKeyFetchPromise;
    return verifierKeyCache.keys;
  } finally {
    verifierKeyFetchPromise = null;
  }
}

export async function verifyAdMobSsv(
  keyId: string,
  signature: string,
  rawQueryString: string,
): Promise<void> {
  const signedPayload = rawQueryString
    .split('&')
    .filter((param) => !param.startsWith('signature='))
    .join('&');

  const keys = await getVerifierKeys();
  const keyEntry = keys.find((key) => String(key.keyId) === keyId);
  if (!keyEntry?.base64) {
    throw new InvalidAdMobSignatureError('AdMob public key not found');
  }

  const publicKey = `-----BEGIN PUBLIC KEY-----\n${keyEntry.base64}\n-----END PUBLIC KEY-----`;
  const normalized = signature.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);

  const verifier = createVerify('SHA256');
  verifier.update(signedPayload);
  verifier.end();

  if (!verifier.verify(publicKey, normalized + padding, 'base64')) {
    throw new InvalidAdMobSignatureError('Invalid AdMob SSV signature');
  }
}
