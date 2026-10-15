import { ActionSheetIOS, Alert, Platform } from 'react-native';
import type { AttachSource } from './documentPicker.helper';

/**
 * Portal-style source chooser — ActionSheet/Alert, NOT an RN Modal.
 * Presenting UIDocumentPicker from a Modal stack is what breaks Open on iOS.
 */
export function chooseAttachSource(
  onSelect: (source: AttachSource) => void,
): void {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Camera', 'Photos', 'Files'],
        cancelButtonIndex: 0,
      },
      buttonIndex => {
        if (buttonIndex === 1) onSelect('camera');
        else if (buttonIndex === 2) onSelect('photos');
        else if (buttonIndex === 3) onSelect('files');
      },
    );
    return;
  }

  Alert.alert('Upload files', 'Choose a source', [
    { text: 'Camera', onPress: () => onSelect('camera') },
    { text: 'Photos', onPress: () => onSelect('photos') },
    { text: 'Files', onPress: () => onSelect('files') },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
