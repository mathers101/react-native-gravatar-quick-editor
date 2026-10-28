# react-native-gravatar-quick-editor

React Native Turbo Module for the native Gravatar Quick Editor on Android and iOS. It opens the official editor for a user's avatar and About profile and returns an explicit success, cancellation, or error.

This is not a WebView. Android calls `GravatarQuickEditor.show` from `com.gravatar:gravatar-quickeditor`. iOS calls `QuickEditorPresenter` from `GravatarUI`.

## Install

```sh
npm install react-native-gravatar-quick-editor
```

Peer dependencies, developed against React 19.3.0 and React Native 0.88.0:

| Package | Range |
| --- | --- |
| `react` | `>=19.0.0` |
| `react-native` | `>=0.81.0` |

The library uses the React Native new architecture (Turbo Module codegen). Enable the new architecture in the host app.

## License

Mozilla Public License 2.0.

The Android SDK (`LICENSE.md` in Automattic/Gravatar-SDK-Android) and the iOS SDK (`LICENSE.md` in Automattic/Gravatar-SDK-iOS 3.4.0) are both MPL-2.0. MPL-2.0 section 3.3 allows a larger work under other terms, so MIT would also be compatible, but this package is MPL-2.0 so the editor integration is offered under the same terms as the native SDKs it calls. The web package `@gravatar-com/quick-editor` is GPL-2.0-or-later; this library does not vendor or link that package.

## Native dependencies

| Platform | Coordinate | Version |
| --- | --- | --- |
| Android | `com.gravatar:gravatar` | 2.5.1 |
| Android | `com.gravatar:gravatar-ui` | 2.5.1 |
| Android | `com.gravatar:gravatar-quickeditor` | 2.5.1 |
| iOS CocoaPods | `GravatarUI` (depends on `Gravatar`) | 3.4.0 |
| iOS Swift Package Manager | `https://github.com/Automattic/Gravatar-SDK-iOS.git`, product `GravatarUI` | from 3.4.0 |

2.5.1 is the current Maven release used here. 3.4.0 is the current tagged iOS release and the last version published to CocoaPods. In April 2026 the iOS repository removed CocoaPods from trunk without tagging a newer release, so a React Native podspec still depends on `GravatarUI` 3.4.0. SPM consumers can pin the same tag.

Add these Android repositories in the host app. `gravatar-ui` pulls uCrop from JitPack:

```gradle
maven { url "https://a8c-libs.s3.amazonaws.com/android" }
maven {
    url "https://jitpack.io"
    content { includeModule("com.github.yalantis", "ucrop") }
}
```

iOS autolinking uses `GravatarQuickEditor.podspec`, which depends on `pod 'GravatarUI', '3.4.0'`. Swift pods need static frameworks:

```ruby
ENV['USE_FRAMEWORKS'] ||= 'static'
```

## Gravatar application setup

Editing requires OAuth. Create an application in the [developer dashboard](https://gravatar.com/developers) and register an **https** redirect URL. Both SDKs use the implicit flow (`response_type=token`). Custom schemes are rejected.

Pass `oauth.clientId` and `oauth.redirectUri`, or pass an existing `authToken` (`AuthenticationMethod.Bearer` on Android, the `token` argument on iOS). `apiKey` is optional. On Android 2.5.1 it is applied with `Gravatar.apiKey` (the public docs still show `Gravatar.initialize`, which this version does not declare). On iOS it is passed to `Configuration.shared.configure(with:oauthSecrets:)`.

### Android beyond autolinking

Merge `GravatarOAuthActivity` into the app manifest and point the intent filter at the registered redirect:

```xml
<activity
  android:name="com.gravatar.quickeditor.ui.oauth.GravatarOAuthActivity"
  android:exported="true"
  tools:node="merge">
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
      android:scheme="https"
      android:host="yourhost.com"
      android:pathPrefix="/redirect-url" />
  </intent-filter>
</activity>
```

Complete [App Links](https://developer.android.com/training/app-links) verification for that host. The Quick Editor module also expects `INTERNET` and, on Android 9 and lower, `WRITE_EXTERNAL_STORAGE` so downloads can be saved. This library's manifest merges those permissions.

The SDK recommends excluding its encrypted DataStore files from backup. Copy the `data_extraction_rules` and `backup_rules` XML from the [Quick Editor guide](https://github.com/Automattic/Gravatar-SDK-Android/blob/trunk/docs/get-started/usage-quickeditor.md) if `android:allowBackup` is true.

Call `logout(email)` when the user logs out of your app. That calls `GravatarQuickEditor.logout`.

### iOS beyond autolinking

Before presenting the editor, configure the SDK (this library does that from `open`) and handle the universal link:

```swift
func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
  if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
     let incomingURL = userActivity.webpageURL {
    Task { await OAuthSession.shared.handleCallback(incomingURL) }
  }
}
```

Add the Associated Domains entitlement `applinks:yourhost.com` and host an Apple App Site Association file. `logout(email)` calls `OAuthSession.shared.deleteSession(with:)`.

## Expo config plugin

Autolinking does not know your redirect host, so Expo apps need setup beyond autolinking. Add the plugin:

```json
[
  "react-native-gravatar-quick-editor",
  { "redirectUri": "https://yourhost.com/redirect-url" }
]
```

The plugin merges the Android OAuth activity, adds the iOS associated domain, and appends the Gravatar Maven repositories when the Android Gradle file is Groovy. It does not rewrite `SceneDelegate` or `AppDelegate`; add the `OAuthSession.shared.handleCallback` call above. Bare React Native apps use the same manifest and SceneDelegate steps without the plugin.

## API

```ts
import {
  GravatarQuickEditorCore,
  openQuickEditor,
  QuickEditorError,
} from 'react-native-gravatar-quick-editor';

const editor = new GravatarQuickEditorCore({
  email: 'user@example.com',
  scope: ['avatars', 'about'],
  oauth: {
    clientId: 'YOUR_CLIENT_ID',
    redirectUri: 'https://yourhost.com/redirect-url',
  },
  onOpened: () => {},
  onProfileUpdated: (type, update) => {
    // type is 'avatar_updated' | 'profile_updated'
  },
  onClosed: (close) => {
    // close.reason is 'finished' | 'oauth_failed' | 'invalid_token'
  },
});

const result = await editor.open();
```

`open` settles when the sheet closes:

| `result.status` | Meaning |
| --- | --- |
| `success` | Dismiss reason `finished` and at least one avatar or about update |
| `cancelled` | Dismiss reason `finished` and no updates |
| `error` | Android `OauthFailed` or `InvalidToken` |

A failure before the sheet opens rejects with `QuickEditorError`. That includes `missing_email`, `missing_auth`, `invalid_redirect_uri`, `unsupported_scope`, `unsupported_option`, `already_open`, `activity_unavailable`, and `presenter_unavailable`.

`open(email)` overrides the email passed to the constructor. `close()` dismisses the sheet this module presented. `isOpen()` reports that session. `logout(email)` deletes the SDK's stored OAuth session.

### What matches the web Quick Editor

Web `GravatarQuickEditorCore` options that this library accepts:

- `email`
- `scope` containing `avatars` and/or `about`
- `onProfileUpdated` with `'avatar_updated' | 'profile_updated'`
- `onOpened`
- `onClosed`

Omitted `scope` defaults to `['avatars']`, which is `QuickEditorScopeOption.avatarPicker()` / `.avatarPicker(.horizontalInstrinsicHeight)`.

Avatar updates carry no image payload. The Android and iOS SDKs both document that result as a signal to refresh the avatar. About updates include the SDK `Profile` object, mapped to the OpenAPI snake_case fields (`display_name`, `avatar_url`, `verified_accounts`, and the rest of the generated model). Android can also return `user_id`, `user_login`, and `section_visibility`. iOS 3.4.0's `Profile` type does not declare those three.

### Gaps, not guessed APIs

These web options are not implemented, because the native SDKs do not document them:

| Web option | Native behavior |
| --- | --- |
| `locale` | Rejected with `unsupported_option`. Neither Quick Editor has a locale argument. |
| `editorTriggerSelector`, `avatarSelector`, `avatarRefreshDelay`, `utm` | DOM-only options on the web `GravatarQuickEditor` class. There is no native equivalent, so they are not part of this API. |
| `verified-accounts`, `links`, `interests`, `contact-info`, `wallet`, `photos`, `design`, `privacy` | Rejected with `unsupported_scope`. Native scopes are avatar picker, about editor, or both. |
| iOS dismiss reason | `QuickEditorPresenter.onDismiss` has no reason. iOS dismissals are `finished`. `oauth_failed` and `invalid_token` are the Android `GravatarQuickEditorDismissReason` values. |
| `close()` | The SDKs do not publish a dismiss method. `close()` removes the Android view `show` added, or dismisses the iOS controller this module presented. |
| iOS sheet detents | `horizontal` maps to horizontal intrinsic height. `vertical` maps to vertical large. Other iOS detents (`expandableMedium`, about-sheet styles) are not exposed. |
| Web `open(): boolean` | Native presentation is asynchronous. `open()` returns a promise. Rejection means it did not open. |

`aboutFields` maps to `AboutInputField` / `AboutInfoField`: `display_name`, `about_me`, `pronunciation`, `pronouns`, `location`, `job_title`, `company`, `first_name`, `last_name`. An empty list uses each SDK's `all` set. `initialPage` is only valid when both scopes are requested. `colorScheme` maps to `GravatarUiMode` and `UIUserInterfaceStyle`.

## Example

See [example/README.md](example/README.md). From this repository:

```sh
npm install
npm run example -- start
npm run example -- android
```

## Publish

The publish workflow runs on a `v*.*.*` tag. It uses `npm ci`, then lint, typecheck, and test, then `npm publish`. Put `NPM_TOKEN` in the GitHub Actions secret store. The workflow reads it as `secrets.NPM_TOKEN`. Do not commit a token, an `.npmrc` auth line, or a `.env` file.

```sh
npm version 0.1.1
git push origin main --follow-tags
```

Tag the commit that contains the matching `package.json` version. `npm publish` runs `prepare`, which builds `lib/` with react-native-builder-bob.

## Scripts

```sh
npm run lint
npm run typecheck
npm test
```
