# Gravatar Quick Editor example

Bare React Native app that opens the native Quick Editor and prints success, cancellation, or an error.

## Gravatar application setup

The Quick Editor edits the user's Gravatar profile, so it needs OAuth. Create an application in the [Gravatar developer dashboard](https://gravatar.com/developers):

1. Create an application and copy the client id.
2. Add an **https** redirect URL. The Android and iOS SDKs use the implicit OAuth flow (`response_type=token`). The server rejects custom URL schemes.
3. Create an API key if you want the optional `apiKey` field. The editor itself authorizes with OAuth or an access token, not the API key. The developer docs still mention `Gravatar.initialize`; Android SDK 2.5.1 exposes `Gravatar.apiKey` and `Gravatar.context` instead, and this example passes the key through to that API.

This example is wired for:

`https://gravatar-quick-editor.example/redirect-url`

Replace that host with a domain you control before a real login can finish.

### Android

`example/android/app/src/main/AndroidManifest.xml` merges `GravatarOAuthActivity` with an App Link intent filter for that host and path. Host `assetlinks.json` for the host, as described in [Android App Links](https://developer.android.com/training/app-links).

The app also resolves the official SDK from:

- `https://a8c-libs.s3.amazonaws.com/android`
- `https://jitpack.io` (only `com.github.yalantis:ucrop`, required by `gravatar-ui`)

### iOS

`SceneDelegate` forwards universal links to `OAuthSession.shared.handleCallback`, which is what GravatarUI 3.4.0 documents. The sample entitlements file contains:

`applinks:gravatar-quick-editor.example`

Host an Apple App Site Association file for that domain and enable the Associated Domains capability on your signing team. The Podfile sets `USE_FRAMEWORKS=static` because `GravatarUI` is a Swift pod.

Photo library and camera usage strings are in `Info.plist` because the avatar picker can take or choose a photo.

## Run

From the repository root:

```sh
npm install
npm run example -- start
npm run example -- android
```

iOS (on macOS):

```sh
cd example/ios && bundle exec pod install && cd ../..
npm run example -- ios
```

Enter the email, client id, and the same https redirect URL, then tap **Edit Gravatar**. The screen shows the session status. A bearer token in the access-token field skips the OAuth screen. Do not commit client secrets or tokens.
