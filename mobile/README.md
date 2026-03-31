# Mobile

## Prerequisites

- Node.js (v20+)
- pnpm (package manager)
- Android Studio (Android development)
- Xcode (iOS development)

## Installation

```bash
pnpm install
```

## Environment Variables

Environment variables are loaded from `.env.${APP_ENV}` (default: `development`).
Use `./.env.example` as the source of truth.

Minimal example:

```env
APP_ENV=development
NETWORK=testnet

# Google Sign-In (required)
GOOGLE_WEB_CLIENT_ID=
GOOGLE_IOS_CLIENT_ID=
GOOGLE_IOS_URL_SCHEME=

# Backend (required)
API_URL=https://your-api-url.example

# AdMob (required except IOS_ADMOB_APP_ID)
ANDROID_ADMOB_APP_ID=
IOS_ADMOB_APP_ID=
ANDROID_REWARDS_AD_MOBIN_KEY=

# Transak (required)
TRANSAK_STAGING_API_KEY=

# Build-time (required)
EAS_PROJECT_ID=

# sBTC bridge
SBTC_BRIDGE_MAINNET_EMILY_URL=
SBTC_BRIDGE_TESTNET_EMILY_URL=
SBTC_BRIDGE_MAINNET_CONTRACT_DEPLOYER=
SBTC_BRIDGE_TESTNET_CONTRACT_DEPLOYER=

# Optional sBTC overrides
SBTC_BRIDGE_RECLAIM_LOCK_TIME=
SBTC_BRIDGE_POLLING_INTERVAL=
SBTC_BRIDGE_WITHDRAWAL_FEE_MULTIPLIER=
SBTC_BRIDGE_WITHDRAW_MIN_AMOUNT_SATS=
```

`APP_ENV` also controls native plugin config at build time.

To use a different environment file, set `APP_ENV` when running commands:

```bash
APP_ENV=staging pnpm start
```

## Running the App

### Start Development Server

```bash
pnpm start
```

### Run on Device/Simulator

For iOS:
```bash
pnpm ios
```

For Android:
```bash
pnpm android
```

For explicit environments:

```bash
APP_ENV=development pnpm ios
APP_ENV=staging pnpm ios
pnpm android:development
pnpm android:staging
```

### Expo Go vs Dev Client

This app uses native modules (for example
`@react-native-google-signin/google-signin`), so it cannot run in Expo Go.
Use a development build (dev client) on a device or simulator to preview the
app.

## Linting & Formatting

```bash
pnpm lint
pnpm format
```
