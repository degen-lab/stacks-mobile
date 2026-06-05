/* eslint-env node */

/*
 * Env file to load and validate env variables
 * Be cautious; this file should not be imported into your source folder.
 * We split the env variables into two parts:
 * 1. Client variables: These variables are used in the client-side code (src folder).
 * 2. Build-time variables: These variables are used in the build process (app.config.ts file).
 * Import this file into the `app.config.ts` file to use environment variables during the build process. The client variables can then be passed to the client-side using the extra field in the `app.config.ts` file.
 * To access the client environment variables in your `src` folder, you can import them from `@env`. For example: `import Env from '@env'`.
 */

/**
 * 1st part: Import packages and Load your env variables
 * - Local / CI without EAS: load `.env.${APP_ENV}` via dotenv (override: true for deterministic file wins).
 * - EAS Build workers: skip dotenv — variables come from Project → Environment variables for the profile’s
 *   `environment` in eas.json (`preview` / `production` / `development`). See:
 *   https://docs.expo.dev/eas/environment-variables/
 * APP_ENV is set by eas.json `env` per profile or via shell, e.g. APP_ENV=staging pnpm start
 */

const z = require('zod');
const packageJSON = require('./package.json');
const path = require('path');
const appJson = require('./app.json');

/** Public Expo project id — needed for `eas env:pull` before `.env.*` exists (EAS reads config → GraphQL). */
const EAS_PROJECT_ID_FALLBACK =
  appJson.expo?.extra?.eas?.projectId ?? undefined;

const APP_ENV = process.env.APP_ENV ?? 'development';

/**
 * `eas env:pull` resolves app.config.ts before it writes `.env.*`, so strict validation would fail
 * (chicken-and-egg). CI sets this only for the pull step; real values load on the next command.
 */
const skipEnvValidateForEasPull =
  process.env.STACKS_SKIP_ENV_VALIDATE === '1';

// eslint-disable-next-line no-undef
const envPath = path.resolve(__dirname, `.env.${APP_ENV}`);

const isEasBuild = process.env.EAS_BUILD === 'true';

if (!isEasBuild) {
  require('dotenv').config({
    path: envPath,
    // Expo CLI may preload a default .env file before app.config.ts runs.
    // Always prefer the env file selected by APP_ENV for deterministic builds.
    override: true,
  });
}

/**
 * 2nd part: Define some static variables for the app
 * Such as: bundle id, package name, app name.
 *
 * You can add them to the .env file but we think it's better to keep them here as as we use prefix to generate this values based on the APP_ENV
 * for example: if the APP_ENV is staging, the bundle id will be com.enterstacks.staging
 */

// TODO: Replace these values with your own
const BUNDLE_ID = 'com.enterstacks'; // ios bundle id
const PACKAGE = 'com.enterstacks'; // android package name
const NAME = 'Enter Stacks'; // app name
const EXPO_ACCOUNT_OWNER = 'degenlab'; // expo account owner
const SCHEME = 'enterstacks'; // app scheme

/**
 * We declare a function withEnvSuffix that will add a suffix to the variable name based on the APP_ENV
 * Add a suffix to variable env based on APP_ENV
 * @param {string} name
 * @returns  {string}
 */
const withEnvSuffix = (name) => {
  return APP_ENV === 'production' ? name : `${name}.${APP_ENV}`;
};

/**
 * 2nd part: Define your env variables schema
 * we use zod to define our env variables schema
 *
 * we split the env variables into two parts:
 *    1. client: These variables are used in the client-side code (`src` folder).
 *    2. buildTime: These variables are used in the build process (app.config.ts file). You can think of them as server-side variables.
 *
 * Main rules:
 *    1. If you need your variable on the client-side, you should add it to the client schema; otherwise, you should add it to the buildTime schema.
 *    2. Whenever you want to add a new variable, you should add it to the correct schema based on the previous rule, then you should add it to the corresponding object (_clientEnv or _buildTimeEnv).
 *
 * Note: `z.string()` means that the variable exists and can be an empty string, but not `undefined`.
 * If you want to make the variable required, you should use `z.string().min(1)` instead.
 * Read more about zod here: https://zod.dev/?id=strings
 *
 */

const client = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']),
  NETWORK: z.enum(['mainnet', 'testnet']).optional(),
  NAME: z.string(),
  SCHEME: z.string(),
  BUNDLE_ID: z.string(),
  PACKAGE: z.string(),
  VERSION: z.string(),
  // ADD YOUR CLIENT ENV VARS HERE
  GOOGLE_WEB_CLIENT_ID: z.string().min(1),
  GOOGLE_IOS_CLIENT_ID: z.string().min(1),
  GOOGLE_IOS_URL_SCHEME: z.string().min(1),
  API_URL: z.string().url(),
  ADS_ENABLED: z.enum(['true', 'false']).optional(),
  ANDROID_ADMOB_APP_ID: z.string().min(1),
  IOS_ADMOB_APP_ID: z.string().optional(),
  ANDROID_REWARDS_AD_MOBIN_KEY: z.string().min(1),
  IOS_REWARDS_AD_MOBIN_KEY:
    APP_ENV === 'production' ? z.string().min(1) : z.string().optional(),
  TRANSAK_API_KEY:
    APP_ENV === 'production' ? z.string().min(1) : z.string().optional(),
  TRANSAK_STAGING_API_KEY: z.string().min(1),
  SBTC_BRIDGE_MAINNET_EMILY_URL: z.string().url().optional(),
  SBTC_BRIDGE_TESTNET_EMILY_URL: z.string().url().optional(),
  SBTC_BRIDGE_MAINNET_CONTRACT_DEPLOYER: z.string().optional(),
  SBTC_BRIDGE_TESTNET_CONTRACT_DEPLOYER: z.string().optional(),
  SBTC_BRIDGE_RECLAIM_LOCK_TIME: z.string().optional(),
  SBTC_BRIDGE_POLLING_INTERVAL: z.string().optional(),
  SBTC_BRIDGE_WITHDRAWAL_FEE_MULTIPLIER: z.string().optional(),
  SBTC_BRIDGE_WITHDRAW_MIN_AMOUNT_SATS: z.string().optional(),
});

const buildTime = z.object({
  EXPO_ACCOUNT_OWNER: z.string(),
  EAS_PROJECT_ID: z.string(),
  // ADD YOUR BUILD TIME ENV VARS HERE
});

/**
 * @type {Record<keyof z.infer<typeof client> , unknown>}
 */
const _clientEnv = {
  APP_ENV,
  NETWORK: process.env.NETWORK,
  NAME: NAME,
  SCHEME: SCHEME,
  BUNDLE_ID: withEnvSuffix(BUNDLE_ID),
  PACKAGE: withEnvSuffix(PACKAGE),
  VERSION: packageJSON.version,
  // ADD YOUR ENV VARS HERE TOO
  GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID: process.env.GOOGLE_IOS_CLIENT_ID,
  GOOGLE_IOS_URL_SCHEME: process.env.GOOGLE_IOS_URL_SCHEME,
  API_URL: process.env.API_URL,
  ADS_ENABLED: process.env.ADS_ENABLED,
  ANDROID_ADMOB_APP_ID: process.env.ANDROID_ADMOB_APP_ID,
  IOS_ADMOB_APP_ID: process.env.IOS_ADMOB_APP_ID,
  ANDROID_REWARDS_AD_MOBIN_KEY: process.env.ANDROID_REWARDS_AD_MOBIN_KEY,
  IOS_REWARDS_AD_MOBIN_KEY: process.env.IOS_REWARDS_AD_MOBIN_KEY,
  TRANSAK_API_KEY: process.env.TRANSAK_API_KEY,
  TRANSAK_STAGING_API_KEY: process.env.TRANSAK_STAGING_API_KEY,
  SBTC_BRIDGE_MAINNET_EMILY_URL: process.env.SBTC_BRIDGE_MAINNET_EMILY_URL,
  SBTC_BRIDGE_TESTNET_EMILY_URL: process.env.SBTC_BRIDGE_TESTNET_EMILY_URL,
  SBTC_BRIDGE_MAINNET_CONTRACT_DEPLOYER:
    process.env.SBTC_BRIDGE_MAINNET_CONTRACT_DEPLOYER,
  SBTC_BRIDGE_TESTNET_CONTRACT_DEPLOYER:
    process.env.SBTC_BRIDGE_TESTNET_CONTRACT_DEPLOYER,
  SBTC_BRIDGE_RECLAIM_LOCK_TIME: process.env.SBTC_BRIDGE_RECLAIM_LOCK_TIME,
  SBTC_BRIDGE_POLLING_INTERVAL: process.env.SBTC_BRIDGE_POLLING_INTERVAL,
  SBTC_BRIDGE_WITHDRAWAL_FEE_MULTIPLIER:
    process.env.SBTC_BRIDGE_WITHDRAWAL_FEE_MULTIPLIER,
  SBTC_BRIDGE_WITHDRAW_MIN_AMOUNT_SATS:
    process.env.SBTC_BRIDGE_WITHDRAW_MIN_AMOUNT_SATS,
};

/**
 * @type {Record<keyof z.infer<typeof buildTime> , unknown>}
 */
const _buildTimeEnv = {
  EXPO_ACCOUNT_OWNER,
  EAS_PROJECT_ID: process.env.EAS_PROJECT_ID ?? EAS_PROJECT_ID_FALLBACK,
  // ADD YOUR ENV VARS HERE TOO
};

/**
 * 3rd part: Merge and Validate your env variables
 * We use zod to validate our env variables based on the schema we defined above
 * If the validation fails we throw an error and log the error to the console with a detailed message about missed variables
 * If the validation passes we export the merged and parsed env variables to be used in the app.config.ts file as well as a ClientEnv object to be used in the client-side code
 **/

const _env = {
  ..._clientEnv,
  ..._buildTimeEnv,
};

const merged = buildTime.merge(client);
let parsed = merged.safeParse(_env);

/** Placeholders so app.config.ts can load during `eas env:pull` only (see STACKS_SKIP_ENV_VALIDATE). */
const EAS_ENV_PULL_STUBS = {
  GOOGLE_WEB_CLIENT_ID: 'eas-env-pull-pending',
  GOOGLE_IOS_CLIENT_ID: 'eas-env-pull-pending',
  // @react-native-google-signin/google-signin (no Firebase) requires this prefix for expo config.
  GOOGLE_IOS_URL_SCHEME: 'com.googleusercontent.apps.eas-env-pull-pending',
  API_URL: 'https://example.com',
  ANDROID_ADMOB_APP_ID: 'ca-app-pub-0000000000000000~0000000000',
  ANDROID_REWARDS_AD_MOBIN_KEY: 'eas-env-pull-pending',
  IOS_REWARDS_AD_MOBIN_KEY: 'eas-env-pull-pending',
  TRANSAK_API_KEY: 'eas-env-pull-pending',
  TRANSAK_STAGING_API_KEY: 'eas-env-pull-pending',
};

if (parsed.success === false) {
  if (skipEnvValidateForEasPull) {
    const patched = { ..._env };
    for (const [key, stub] of Object.entries(EAS_ENV_PULL_STUBS)) {
      if (patched[key] === undefined || patched[key] === '') {
        patched[key] = stub;
      }
    }
    parsed = merged.safeParse(patched);
  }

  if (parsed.success === false) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const localHint = `Local dev: add missing keys to mobile/.env.${APP_ENV} (see .env.example). Clear Metro with pnpm start -- -c if needed.`;
    const easWorkerHint =
      'EAS Build worker: add missing keys in Expo → Environment variables for this profile’s environment (see eas.json `environment`: staging → preview, production → production).';
    const ciRunnerHint =
      'GitHub Actions: `eas env:pull` uses **preview** for APP_ENV=staging and **production** for APP_ENV=production. On expo.dev, each variable must list that environment (checkbox under Environments), or pull will omit it. **Secret** visibility is never pulled — use **Sensitive** or plaintext for config-time keys.';

    let where;
    if (process.env.EAS_BUILD === 'true') {
      where = easWorkerHint;
    } else if (process.env.GITHUB_ACTIONS === 'true') {
      where = `${ciRunnerHint}\n${easWorkerHint}`;
    } else {
      where = localHint;
    }

    console.error('❌ Invalid environment variables:', fieldErrors, `\n${where}`);
    throw new Error(
      'Invalid environment variables — see message above for where to define them.'
    );
  }
}

const Env = parsed.data;

const clientEnvForParse = skipEnvValidateForEasPull
  ? (() => {
      const out = { ..._clientEnv };
      for (const [key, stub] of Object.entries(EAS_ENV_PULL_STUBS)) {
        if (key in out && (out[key] === undefined || out[key] === '')) {
          out[key] = stub;
        }
      }
      return out;
    })()
  : _clientEnv;

const ClientEnv = client.parse(clientEnvForParse);

module.exports = {
  Env,
  ClientEnv,
  withEnvSuffix,
};
