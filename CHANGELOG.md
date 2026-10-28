# Changelog

## 0.1.0

- Open the native Gravatar Quick Editor from React Native on Android and iOS.
- Android uses `com.gravatar:gravatar-quickeditor:2.5.1` (`GravatarQuickEditor.show`).
- iOS uses CocoaPods `GravatarUI` 3.4.0 (`QuickEditorPresenter`). Swift Package Manager coordinates are documented for the same tag.
- Public API follows web `GravatarQuickEditorCore` for email, `avatars` / `about` scope, and open / update / close callbacks.
- Session results distinguish success, cancellation, and OAuth or token errors.
