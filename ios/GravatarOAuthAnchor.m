#import "GravatarOAuthAnchor.h"

#import <AuthenticationServices/AuthenticationServices.h>
#import <UIKit/UIKit.h>
#import <objc/runtime.h>

@interface GravatarOAuthPresentationContext : NSObject <ASWebAuthenticationPresentationContextProviding>
@end

@implementation GravatarOAuthPresentationContext

+ (instancetype)sharedContext
{
  static GravatarOAuthPresentationContext *context;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    context = [GravatarOAuthPresentationContext new];
  });
  return context;
}

- (ASPresentationAnchor)presentationAnchorForWebAuthenticationSession:(ASWebAuthenticationSession *)session
{
  (void)session;
  NSSet<UIScene *> *scenes = UIApplication.sharedApplication.connectedScenes;
  UIWindowScene *foreground = nil;
  UIWindowScene *fallback = nil;
  for (UIScene *scene in scenes) {
    if (![scene isKindOfClass:[UIWindowScene class]]) {
      continue;
    }
    UIWindowScene *windowScene = (UIWindowScene *)scene;
    if (fallback == nil) {
      fallback = windowScene;
    }
    if (windowScene.activationState == UISceneActivationStateForegroundActive) {
      foreground = windowScene;
      break;
    }
  }

  UIWindowScene *scene = foreground != nil ? foreground : fallback;
  for (UIWindow *window in scene.windows) {
    if (window.isKeyWindow) {
      return window;
    }
  }
  for (UIWindow *window in scene.windows) {
    if (!window.isHidden && window.rootViewController != nil) {
      return window;
    }
  }
  if (scene.windows.firstObject != nil) {
    return scene.windows.firstObject;
  }
  if (scene != nil) {
    return [[UIWindow alloc] initWithWindowScene:scene];
  }
  return [UIWindow new];
}

@end

@interface ASWebAuthenticationSession (GravatarAnchor)
- (BOOL)gravatar_start;
@end

@implementation ASWebAuthenticationSession (GravatarAnchor)

- (BOOL)gravatar_start
{
  id<ASWebAuthenticationPresentationContextProviding> provider = self.presentationContextProvider;
  if ([self gravatar_anchorNeedsReplacement:provider]) {
    // presentationContextProvider is weak. The shared context lives for the process.
    self.presentationContextProvider = [GravatarOAuthPresentationContext sharedContext];
  }
  return [self gravatar_start];
}

- (BOOL)gravatar_anchorNeedsReplacement:(id<ASWebAuthenticationPresentationContextProviding>)provider
{
  if (provider == nil) {
    return YES;
  }
  NSString *className = NSStringFromClass([(id)provider class]);
  // GravatarUI.OldAuthenticationSession returns UIWindow() with no scene.
  if ([className containsString:@"OldAuthenticationSession"]) {
    return YES;
  }
  UIWindow *anchor = [provider presentationAnchorForWebAuthenticationSession:self];
  UIWindowScene *scene = anchor.windowScene;
  return scene == nil || scene.activationState != UISceneActivationStateForegroundActive;
}

@end

void GravatarInstallOAuthAnchorFix(void)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class sessionClass = ASWebAuthenticationSession.class;
    Method original = class_getInstanceMethod(sessionClass, @selector(start));
    Method replacement = class_getInstanceMethod(sessionClass, @selector(gravatar_start));
    if (original != NULL && replacement != NULL) {
      method_exchangeImplementations(original, replacement);
    }
  });
}
