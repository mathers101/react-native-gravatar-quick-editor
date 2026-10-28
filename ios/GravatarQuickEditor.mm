#import "GravatarQuickEditor.h"

#import <React/RCTUtils.h>

#if __has_include("GravatarQuickEditor-Swift.h")
#import "GravatarQuickEditor-Swift.h"
#elif __has_include(<GravatarQuickEditor/GravatarQuickEditor-Swift.h>)
#import <GravatarQuickEditor/GravatarQuickEditor-Swift.h>
#endif

@implementation GravatarQuickEditor

RCT_EXPORT_MODULE()

- (void)open:(NSString *)optionsJson
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject
{
  __weak __typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController *controller = RCTPresentedViewController();
    if (controller == nil) {
      reject(
        @"presenter_unavailable",
        @"No view controller is available to present the Gravatar Quick Editor.",
        nil);
      return;
    }

    [[GravatarQuickEditorImpl shared] openWithOptionsJson:optionsJson
                                                presenter:controller
                                                  onEvent:^(NSString *eventJson) {
                                                    __strong __typeof(weakSelf) strongSelf = weakSelf;
                                                    [strongSelf emitOnSessionEvent:eventJson];
                                                  }
                                               onResolved:^(NSString *resultJson) {
                                                 resolve(resultJson);
                                               }
                                               onRejected:^(NSString *code, NSString *message) {
                                                 reject(code, message, nil);
                                               }];
  });
}

- (void)close
{
  [[GravatarQuickEditorImpl shared] closeEditor];
}

- (NSNumber *)isOpen
{
  return @([[GravatarQuickEditorImpl shared] editorIsOpen]);
}

- (void)logout:(NSString *)email
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject
{
  [[GravatarQuickEditorImpl shared] logoutWithEmail:email];
  resolve(nil);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeGravatarQuickEditorSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"GravatarQuickEditor";
}

@end
