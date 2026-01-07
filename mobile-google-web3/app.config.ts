import type { ConfigContext, ExpoConfig } from '@expo/config';

import { ClientEnv, Env } from './env';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: Env.NAME,
  description: `${Env.NAME} Mobile App`,
  owner: Env.EXPO_ACCOUNT_OWNER,
  scheme: Env.SCHEME,
  slug: 'mobile-google-web3',
  version: Env.VERSION.toString(),
  orientation: 'portrait',
  icon: './src/assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: Env.BUNDLE_ID,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './src/assets/images/android-icon-foreground.png',
      backgroundImage: './src/assets/images/android-icon-background.png',
      monochromeImage: './src/assets/images/android-icon-monochrome.png',
      backgroundColor: '#E6F4FE',
    },
    package: Env.PACKAGE,
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    bundler: 'metro',
    favicon: './src/assets/images/favicon.png',
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        backgroundColor: '#ffffff',
        image: './src/assets/images/stacks-mobile-logo.png',
        imageWidth: 200,
        resizeMode: 'contain',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
    [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: `${Env.GOOGLE_IOS_URL_SCHEME}`,
        },
      ],
    'react-native-edge-to-edge',
    [
      "react-native-google-mobile-ads",
      {
        "androidAppId": Env.ANDROID_ADMOB_APP_ID,
        "iosAppId": Env.IOS_ADMOB_APP_ID
      }
    ],
    'expo-router',
    ],
  extra: {
    ...ClientEnv,
    eas: {
      projectId: Env.EAS_PROJECT_ID,
    },
  },
});

