#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>
#import <UIKit/UIKit.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>

@class DocumentAttachSession;

@interface DocumentAttachSession : NSObject <UIDocumentPickerDelegate>
@property (nonatomic, copy) RCTPromiseResolveBlock resolveBlock;
@property (nonatomic, copy) RCTPromiseRejectBlock rejectBlock;
@property (nonatomic, strong) UIDocumentPickerViewController *picker;
@property (nonatomic, strong) DocumentAttachSession *keepAlive;
@property (nonatomic, assign) BOOL finished;
- (instancetype)initWithResolve:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject;
- (void)presentFrom:(UIViewController *)presenter;
@end

@implementation DocumentAttachSession

- (instancetype)initWithResolve:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject
{
  if (self = [super init]) {
    _resolveBlock = [resolve copy];
    _rejectBlock = [reject copy];
    _finished = NO;
  }
  return self;
}

- (void)resolveWith:(NSArray *)files
{
  if (self.finished) return;
  self.finished = YES;
  RCTPromiseResolveBlock resolve = self.resolveBlock;
  self.resolveBlock = nil;
  self.rejectBlock = nil;
  self.picker = nil;
  self.keepAlive = nil;
  if (resolve) {
    resolve(files ?: @[]);
  }
}

- (void)rejectWithCode:(NSString *)code message:(NSString *)message
{
  if (self.finished) return;
  self.finished = YES;
  RCTPromiseRejectBlock reject = self.rejectBlock;
  self.resolveBlock = nil;
  self.rejectBlock = nil;
  self.picker = nil;
  self.keepAlive = nil;
  if (reject) {
    reject(code, message, nil);
  }
}

- (NSString *)mimeForName:(NSString *)name
{
  NSString *ext = name.pathExtension.lowercaseString;
  if ([ext isEqualToString:@"pdf"]) return @"application/pdf";
  if ([ext isEqualToString:@"png"]) return @"image/png";
  if ([ext isEqualToString:@"jpg"] || [ext isEqualToString:@"jpeg"]) return @"image/jpeg";
  if ([ext isEqualToString:@"docx"]) {
    return @"application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return @"application/octet-stream";
}

- (NSDictionary *)fileDictFromURL:(NSURL *)url
{
  BOOL access = [url startAccessingSecurityScopedResource];
  NSString *name = url.lastPathComponent ?: @"attachment.pdf";
  if (name.pathExtension.length == 0) {
    name = [name stringByAppendingString:@".pdf"];
  }

  NSString *tmpDir = [NSTemporaryDirectory()
      stringByAppendingPathComponent:@"MemberHubAttachments"];
  [[NSFileManager defaultManager] createDirectoryAtPath:tmpDir
                            withIntermediateDirectories:YES
                                             attributes:nil
                                                  error:nil];

  NSString *destName =
      [NSString stringWithFormat:@"%u_%@", arc4random_uniform(UINT32_MAX), name];
  NSString *destPath = [tmpDir stringByAppendingPathComponent:destName];

  NSError *error = nil;
  NSData *data = [NSData dataWithContentsOfURL:url options:0 error:&error];
  BOOL wrote = NO;
  if (data) {
    wrote = [data writeToFile:destPath options:NSDataWritingAtomic error:&error];
  }

  if (access) {
    [url stopAccessingSecurityScopedResource];
  }

  NSString *uri = nil;
  if (wrote) {
    uri = [NSURL fileURLWithPath:destPath].absoluteString;
  } else if (url.absoluteString.length) {
    // Fall back to picker-provided URL (asCopy:YES is usually already local)
    uri = url.absoluteString;
  }

  if (!uri.length) {
    return nil;
  }

  return @{
    @"uri" : uri,
    @"name" : name,
    @"type" : [self mimeForName:name],
  };
}

- (void)presentFrom:(UIViewController *)presenter
{
  // Keep session alive while picker is visible (delegate is weak)
  self.keepAlive = self;

  NSArray<UTType *> *types = @[
    UTTypePDF,
    UTTypeImage,
    UTTypeData,
    UTTypeItem,
  ];

  UIDocumentPickerViewController *picker =
      [[UIDocumentPickerViewController alloc] initForOpeningContentTypes:types
                                                                  asCopy:YES];
  picker.delegate = self;
  picker.allowsMultipleSelection = YES;
  picker.modalPresentationStyle = UIModalPresentationFullScreen;
  self.picker = picker;

  [presenter presentViewController:picker animated:YES completion:nil];
}

- (void)documentPicker:(UIDocumentPickerViewController *)controller
    didPickDocumentsAtURLs:(NSArray<NSURL *> *)urls
{
  NSMutableArray *out = [NSMutableArray array];
  for (NSURL *url in urls) {
    NSDictionary *file = [self fileDictFromURL:url];
    if (file) {
      [out addObject:file];
    }
  }
  [self resolveWith:out];
}

- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller
{
  // Delay: iOS sometimes reports cancel around a successful Open.
  __weak DocumentAttachSession *weakSelf = self;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.5 * NSEC_PER_SEC)),
                 dispatch_get_main_queue(), ^{
                   DocumentAttachSession *strongSelf = weakSelf;
                   if (!strongSelf || strongSelf.finished) {
                     return;
                   }
                   [strongSelf rejectWithCode:@"OPERATION_CANCELED"
                                      message:@"User cancelled document picker"];
                 });
}

@end

@interface DocumentAttach : NSObject <RCTBridgeModule>
@end

@implementation DocumentAttach

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (UIViewController *)topPresenter
{
  UIWindow *keyWindow = nil;
  for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
    if (scene.activationState != UISceneActivationStateForegroundActive) continue;
    if (![scene isKindOfClass:[UIWindowScene class]]) continue;
    for (UIWindow *w in ((UIWindowScene *)scene).windows) {
      if (w.isKeyWindow) {
        keyWindow = w;
        break;
      }
    }
    if (keyWindow) break;
  }

  UIViewController *vc = keyWindow.rootViewController;
  while (vc.presentedViewController) {
    vc = vc.presentedViewController;
  }
  return vc ?: RCTPresentedViewController();
}

RCT_EXPORT_METHOD(pick
                  : (NSDictionary *)options resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController *presenter = [self topPresenter];
    if (!presenter) {
      reject(@"NULL_PRESENTER", @"No view controller available", nil);
      return;
    }
    DocumentAttachSession *session =
        [[DocumentAttachSession alloc] initWithResolve:resolve reject:reject];
    [session presentFrom:presenter];
  });
}

@end
