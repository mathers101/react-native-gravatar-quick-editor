import { ExpoConfig } from 'expo/config';

const REDIRECT_URI = process.env.EXPO_PUBLIC_GRAVATAR_REDIRECT_URI;

module.exports = ({ config }: { config: ExpoConfig }) => {
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      ['react-native-gravatar-quick-editor', { redirectUri: REDIRECT_URI }],
    ],
  };
};
