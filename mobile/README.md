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

Environment variables are loaded from `.env.${APP_ENV}`, which defaults to
`development`. Create the file you need in the project root, for example `.env.development`:

```env
# Optional (defaults to development)
APP_ENV=development

# Optional (mainnet | testnet)
NETWORK=testnet

# Required: Google Sign-In configuration
GOOGLE_WEB_CLIENT_ID=
GOOGLE_IOS_CLIENT_ID=
GOOGLE_IOS_URL_SCHEME=

# Required: Backend API URL
API_URL=https://your-api-url.example

# Required: AdMob configuration
ANDROID_ADMOB_APP_ID=
IOS_ADMOB_APP_ID=  # Optional
ANDROID_REWARDS_AD_MOBIN_KEY=
```

**Note:** All variables marked as "Required" must have non-empty values. The app will fail to start if any required variables are missing.

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
