# Contributing

Contributions are always welcome, no matter how large or small!

Please follow the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is an npm workspace. It contains:

- The library package in the root directory.
- An example app in the `example/` directory.

Use the Node.js version in [`.nvmrc`](./.nvmrc). Install from the repository root:

```sh
npm install
```

Do not use Yarn, pnpm, or Bun. The lockfile is `package-lock.json`.

The example app uses the local library. JavaScript changes show up after Metro reloads. Native changes need a rebuild of the example app.

Open `example/android` in Android Studio, or `example/ios/GravatarQuickEditorExample.xcworkspace` in Xcode after `pod install`.

```sh
npm run example -- start
npm run example -- android
npm run example -- ios
npm run typecheck
npm run lint
npm test
```

### Scripts

- `npm install`: install the library and the example app.
- `npm run typecheck`: type-check with TypeScript.
- `npm run lint`: lint with ESLint.
- `npm test`: run Jest.
- `npm run example -- start`: start Metro.
- `npm run example -- android`: run the example on Android.
- `npm run example -- ios`: run the example on iOS.

### Sending a pull request

- Prefer small pull requests focused on one change.
- Verify that lint, typecheck, and tests pass.
- Update the README when the public API changes.
