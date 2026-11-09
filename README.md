# @mathers101/react-native-gravatar-quick-editor

React Native module that opens the native Gravatar Quick Editor on Android and iOS. The editor updates a user's avatar and About profile, then returns success, cancellation, or an error.

Android calls `GravatarQuickEditor` from `com.gravatar:gravatar-quickeditor`. iOS calls `QuickEditorPresenter` from `GravatarUI`. The library is a Turbo Module, so enable the React Native new architecture in the host app.

## Install

```sh
npm install @mathers101/react-native-gravatar-quick-editor
```

Peer dependencies: `react` >= 19 and `react-native` >= 0.81. `expo` is optional.

## Create a Gravatar application

Editing a profile uses OAuth. In the [Gravatar developer dashboard](https://gravatar.com/developers):

1. Create an application and copy the client id.
2. Register an **https** redirect URL. The Android and iOS SDKs use the implicit flow (`response_type=token`), and the server accepts only `https` URLs.

That redirect URL has to open your installed app after login. Android does this with an [App Link](https://developer.android.com/training/app-links), and iOS does it with an associated domain (a universal link). Host `assetlinks.json` for the Android host and an Apple App Site Association file for the iOS domain.

Pass the same client id and redirect URL into `openQuickEditor`. During `npx expo prebuild`, the config plugin registers that redirect URL with the native app: it adds the Android OAuth activity and the Maven repositories the Android SDK is published from, and it adds the iOS associated domain.

## Expo

Save the client id and redirect URL as public environment variables:

```sh
EXPO_PUBLIC_GRAVATAR_CLIENT_ID=your-client-id
EXPO_PUBLIC_GRAVATAR_REDIRECT_URI=https://yourhost.com/redirect-url
```

Put these in `.env` locally. Expo loads that file before it evaluates `app.config.ts`, and it inlines every `EXPO_PUBLIC_` variable into the JavaScript bundle. The config plugin and the editor call can then share one redirect URL. For EAS Build, set the same variables in the build environment.

Add the config plugin in `app.config.ts`. Autolinking has no way to know your redirect host, so the plugin needs it. Read `redirectUri` from the environment variable so the native project stays aligned with the URL the editor requests.

```ts
import { ExpoConfig } from 'expo/config';

module.exports = ({ config }: { config: ExpoConfig }) => {
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      [
        '@mathers101/react-native-gravatar-quick-editor',
        { redirectUri: process.env.EXPO_PUBLIC_GRAVATAR_REDIRECT_URI },
      ],
    ],
  };
};
```

Use `app.config.ts` (or `app.config.js`) so the plugin can read `process.env` while Expo evaluates the config.

`GravatarUI` is a Swift pod, so the iOS build needs static frameworks. Add [`expo-build-properties`](https://docs.expo.dev/versions/latest/sdk/build-properties/) next to the Quick Editor plugin:

```ts
[
  'expo-build-properties',
  { ios: { useFrameworks: 'static' } },
],
```

Generate the native projects, then build a development client (`npx expo run:android`, `npx expo run:ios`, or EAS Build):

```sh
npx expo prebuild
```

Prebuild is what applies the plugin. The redirect host and path are written into `AndroidManifest.xml` and the iOS entitlements at that moment. Run `npx expo prebuild` again whenever `EXPO_PUBLIC_GRAVATAR_REDIRECT_URI` changes, then rebuild the native app. The client id is read from JavaScript, so a new `EXPO_PUBLIC_GRAVATAR_CLIENT_ID` is picked up with the next bundle.

On iOS, forward the returning universal link to the Gravatar SDK. The plugin adds the associated domain; the callback itself belongs in the app. In the generated `SceneDelegate` (or in `application(_:continue:restorationHandler:)`, when that is the method that already receives the link):

```swift
import GravatarUI

func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
  if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
     let incomingURL = userActivity.webpageURL {
    Task { await OAuthSession.shared.handleCallback(incomingURL) }
  }
}
```

`npx expo prebuild --clean` regenerates `ios/` and removes this edit, so add it again after a clean prebuild.

## Open the editor

```ts
import { openQuickEditor } from '@mathers101/react-native-gravatar-quick-editor';

const result = await openQuickEditor({
  email: 'user@example.com',
  scope: ['avatars', 'about'],
  oauth: {
    clientId: process.env.EXPO_PUBLIC_GRAVATAR_CLIENT_ID ?? '',
    redirectUri: process.env.EXPO_PUBLIC_GRAVATAR_REDIRECT_URI ?? '',
  },
});
```

`oauth.redirectUri` must be the URL registered on the Gravatar application and the URL passed to the config plugin.

`result.status` is:

| Status      | Meaning                                                     |
| ----------- | ----------------------------------------------------------- |
| `success`   | The sheet closed after an avatar or About update            |
| `cancelled` | The sheet closed with no update                             |
| `error`     | Android reported a failed OAuth attempt or an invalid token |

`scope` accepts `avatars`, `about`, or both. Omitting it opens the avatar picker. Avatar updates are a signal to refresh the image. About updates include the profile returned by the SDK.

Pass `authToken` when the app already has a Gravatar access token. The SDK then uses that token and skips its own login screen. Call `logout(email)` when the user logs out of your app so the SDK deletes its stored session.

A failure before the sheet opens rejects with `QuickEditorError`. Common codes are `missing_email`, `missing_auth`, `invalid_redirect_uri`, and `already_open`.

## React Native without Expo

Android is the same path. Add the config plugin, point `redirectUri` at the registered https URL, and run `npx expo prebuild`. Prebuild writes the OAuth activity and the Maven repositories, so those are not edited by hand. Run prebuild again when that URL changes, then rebuild.

`EXPO_PUBLIC_` variables are an Expo convention. A bare app can pass the client id and redirect URL into `openQuickEditor` from its own configuration. The redirect URL passed there has to be the one given to the plugin.

On iOS, forward universal links to `OAuthSession.shared.handleCallback` with the `SceneDelegate` snippet above, and host an Apple App Site Association file for the domain. `GravatarUI` is a Swift pod. In the Podfile:

```ruby
ENV['USE_FRAMEWORKS'] ||= 'static'
```

Run `pod install` and rebuild. An Expo app sets the same linkage with `expo-build-properties`, as shown above.

## License

Mozilla Public License 2.0.
