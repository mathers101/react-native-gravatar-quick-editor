#import <Foundation/Foundation.h>

/// GravatarUI 3.4.0 anchors ASWebAuthenticationSession to a brand-new UIWindow.
/// That window has no UIWindowScene, so on a scene-based app (React Native, Expo)
/// iOS rejects the session immediately and the Quick Editor's Continue button
/// returns to the same intro sheet. Call this before the editor can start OAuth.
#ifdef __cplusplus
extern "C" {
#endif

void GravatarInstallOAuthAnchorFix(void);

#ifdef __cplusplus
}
#endif
