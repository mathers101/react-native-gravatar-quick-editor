import { ExpoConfig } from 'expo/config';

module.exports = ({ config }: { config: ExpoConfig }) => {
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      [
        'react-native-gravatar-quick-editor',
        { redirectUri: process.env.EXPO_PUBLIC_GRAVATAR_REDIRECT_URI },
      ],
    ],
  };
};
