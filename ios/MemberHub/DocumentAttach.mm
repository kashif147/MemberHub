#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>
#import <UIKit/UIKit.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>

/**
 * In-app document picker — avoids @react-native-documents/picker iOS Open race
 * (presentationControllerDidDismiss cancelling before didPickDocumentsAt).
 */
@interface DocumentAttach : NSObject <RCTBridgeModule, UIDocumentPickerDelegate>
@end

@implementation DocumentAttach {
  RCTPromiseResolveBlock _resolve;
  RCTPromiseRejectBlock _reject;
  UIDocumentPickerViewController *_picker;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_EXPORT_METHOD(pick
                  : (NSDictionary *)options resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_resolve != nil) {
      reject(@"ASYNC_OP_IN_PROGRESS", @"A document pick is already in progress", nil);
      return;
    }

    self->_resolve = [resolve copy];
    self->_reject = [reject copy];

    NSArray<UTType *> *contentTypes = @[ UTTypeItem ];
    UIDocumentPickerViewController *picker =
        [[UIDocumentPickerViewController alloc] initForOpeningContentTypes:contentTypes
                                                                    asCopy:YES];
    picker.delegate = self;
    picker.allowsMultipleSelection = YES;
    // Do not set presentationController.delegate — that breaks Open on iOS 17+.

    self->_picker = picker;

    UIViewController *presenter = RCTPresentedViewController();
    if (!presenter) {
      self->_resolve = nil;
      self->_reject = nil;
      self->_picker = nil;
      reject(@"NULL_PRESENTER", @"No view controller to present document picker", nil);
      return;
    }

    [presenter presentViewController:picker animated:YES completion:nil];
  });
}

- (void)documentPicker:(UIDocumentPickerViewController *)controller
    didPickDocumentsAtURLs:(NSArray<NSURL *> *)urls
{
  NSMutableArray *out = [NSMutableArray arrayWithCapacity:urls.count];
  for (NSURL *url in urls) {
    NSString *name = url.lastPathComponent ?: @"attachment";
    NSString *mime = @"application/octet-stream";
    NSString *ext = url.pathExtension.lowercaseString;
    if ([ext isEqualToString:@"pdf"] || name.pathExtension.length == 0) {
      // Extensionless Inbox files are treated as PDF for case attachments
      mime = @"application/pdf";
      if (name.pathExtension.length == 0) {
        name = [name stringByAppendingString:@".pdf"];
      }
    } else if ([ext isEqualToString:@"png"]) {
      mime = @"image/png";
    } else if ([ext isEqualToString:@"jpg"] || [ext isEqualToString:@"jpeg"]) {
      mime = @"image/jpeg";
    } else if ([ext isEqualToString:@"docx"]) {
      mime = @"application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    [out addObject:@{
      @"uri" : url.absoluteString ?: @"",
      @"name" : name,
      @"type" : mime,
    }];
  }

  RCTPromiseResolveBlock resolve = self->_resolve;
  self->_resolve = nil;
  self->_reject = nil;
  self->_picker = nil;
  if (resolve) {
    resolve(out);
  }
}

- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller
{
  RCTPromiseRejectBlock reject = self->_reject;
  self->_resolve = nil;
  self->_reject = nil;
  self->_picker = nil;
  if (reject) {
    reject(@"OPERATION_CANCELED", @"User cancelled document picker", nil);
  }
}

@end
