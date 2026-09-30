import type { ConfigContext, ExpoConfig } from '@expo/config';

import { ClientEnv, Env } from './env';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: Env.NAME,
  description: `${Env.NAME} Mobile App`,
  owner: Env.EXPO_ACCOUNT_OWNER,
  scheme: Env.SCHEME,
  slug: 'stacks-mobile',
  version: Env.VERSION.toString(),
  orientation: 'portrait',
  icon: './src/assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  updates: {
    fallbackToCacheTimeout: 0,
    url: `https://u.expo.dev/${Env.EAS_PROJECT_ID}`,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    usesAppleSignIn: true,
    bundleIdentifier: Env.BUNDLE_ID,
    googleServicesFile: `./firebase/${Env.APP_ENV}/GoogleService-Info.plist`,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    privacyManifests: {
      NSPrivacyTracking: true,
      NSPrivacyTrackingDomains: [
        'app-measurement.com',
        'google-analytics.com',
        'googleadservices.com',
        'googlesyndication.com',
        'doubleclick.net',
      ],
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeUserID',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            'NSPrivacyCollectedDataTypePurposeAnalytics',
          ],
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeDeviceID',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: true,
          NSPrivacyCollectedDataTypePurposes: [
            'NSPrivacyCollectedDataTypePurposeAnalytics',
            'NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising',
            'NSPrivacyCollectedDataTypePurposeDevelopersAdvertising',
          ],
        },
        {
          NSPrivacyCollectedDataType:
            'NSPrivacyCollectedDataTypeProductInteraction',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            'NSPrivacyCollectedDataTypePurposeAnalytics',
          ],
        },
        {
          NSPrivacyCollectedDataType:
            'NSPrivacyCollectedDataTypeAdvertisingData',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: true,
          NSPrivacyCollectedDataTypePurposes: [
            'NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising',
            'NSPrivacyCollectedDataTypePurposeDevelopersAdvertising',
          ],
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeOtherUsageData',
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            'NSPrivacyCollectedDataTypePurposeAnalytics',
          ],
        },
      ],
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
    googleServicesFile: `./firebase/${Env.APP_ENV}/google-services.json`,
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
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          forceStaticLinking: ['RNFBApp', 'RNFBAnalytics'],
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#EBEBEB',
        dark: {
          backgroundColor: '#141414',
        },
        ios: {
          image: './src/assets/images/splash-light.png',
          imageWidth: 200,
          resizeMode: 'contain',
          dark: {
            image: './src/assets/images/splash-dark.png',
            backgroundColor: '#141414',
          },
        },
        android: {
          image: './src/assets/images/splash-light.png',
          imageWidth: 150,
          resizeMode: 'contain',
          dark: {
            image: './src/assets/images/splash-dark.png',
            backgroundColor: '#141414',
          },
        },
      },
    ],
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: `${Env.GOOGLE_IOS_URL_SCHEME}`,
      },
    ],
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission:
          'This identifier may be used to deliver relevant ads and measure ad performance.',
      },
    ],
    'react-native-edge-to-edge',
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: Env.ANDROID_ADMOB_APP_ID,
        iosAppId: Env.IOS_ADMOB_APP_ID,
        delayAppMeasurementInit: true,
      },
    ],
    '@react-native-firebase/app',
    '@degenlab/stacks-wallet-kit-mobile',
    'expo-apple-authentication',
    'expo-router',
  ],
  extra: {
    ...ClientEnv,
    eas: {
      projectId: Env.EAS_PROJECT_ID,
    },
  },
});
