import { NativeModules, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

/**
 * Camera / Photos: react-native-image-picker.
 * Files (iOS): DocumentAttach (retained session, fullScreen).
 * Files (Android): @react-native-documents/picker.
 */
export type PickedDocument = {
  uri: string;
  name: string;
  type: string;
};

export type AttachSource = 'camera' | 'photos' | 'files';

const isCanceled = (err: any, picker?: any) => {
  const code = String(err?.code || '');
  if (code.includes('CANCELED') || code === 'OPERATION_CANCELED') return true;
  const msg = String(err?.message || '').toLowerCase();
  if (msg.includes('cancel') || msg.includes('canceled') || msg.includes('cancelled')) {
    return true;
  }
  try {
    return (
      picker?.isErrorWithCode?.(err) &&
      err?.code === picker?.errorCodes?.OPERATION_CANCELED
    );
  } catch {
    return false;
  }
};

const loadPicker = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-documents/picker');
  const picker = mod?.pick ? mod : mod?.default;
  if (!picker?.pick) {
    throw new Error('Document picker module failed to load.');
  }
  return picker;
};

const mimeFromFile = (file: any): string => {
  const raw = String(file?.type || file?.nativeType || '').toLowerCase();
  const name = String(file?.name || file?.fileName || '').toLowerCase();

  if (raw.includes('pdf') || name.endsWith('.pdf')) return 'application/pdf';
  if (raw.includes('png') || name.endsWith('.png')) return 'image/png';
  if (
    raw.includes('jpeg') ||
    raw.includes('jpg') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg')
  ) {
    return 'image/jpeg';
  }
  if (
    raw.includes('wordprocessingml') ||
    raw.includes('docx') ||
    name.endsWith('.docx')
  ) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (raw.includes('/') && !raw.startsWith('public.') && !raw.startsWith('com.')) {
    return raw;
  }
  return 'application/octet-stream';
};

const normalizeFileUri = (uri: string) => {
  const value = String(uri || '').trim();
  if (!value) return '';
  if (value.startsWith('file://') || value.startsWith('content://')) return value;
  if (value.startsWith('/')) return `file://${value}`;
  return value;
};

const mapPicked = (files: any[]): PickedDocument[] =>
  (files || [])
    .map((f: any) => ({
      uri: normalizeFileUri(
        f?.uri || f?.fileCopyUri || f?.localUri || f?.path || '',
      ),
      name: String(f?.name || f?.fileName || 'attachment.pdf'),
      type: mimeFromFile(f),
    }))
    .filter((f: PickedDocument) => Boolean(f.uri));

const mapImageAssets = (assets: any[] | undefined): PickedDocument[] =>
  (assets || [])
    .filter((a: any) => a?.uri)
    .map((a: any, index: number) => {
      const uri = String(a.uri);
      const ext =
        a.type === 'image/png' || uri.toLowerCase().includes('.png')
          ? 'png'
          : 'jpg';
      const name =
        String(a.fileName || '').trim() ||
        `photo_${Date.now()}_${index}.${ext}`;
      return { uri, name, type: mimeFromFile({ ...a, name }) };
    });

/** iOS — custom native picker (no RN Modal, fullScreen, retained delegate). */
async function pickWithDocumentAttach(): Promise<PickedDocument[] | null> {
  const mod = NativeModules.DocumentAttach;
  if (!mod?.pick) {
    throw new Error('DocumentAttach unavailable — rebuild the iOS app.');
  }
  try {
    const results = await mod.pick({});
    return mapPicked(Array.isArray(results) ? results : []);
  } catch (err: any) {
    if (isCanceled(err)) return null;
    throw err;
  }
}

async function pickWithDocumentsPackage(): Promise<PickedDocument[] | null> {
  const picker = loadPicker();
  const { types, keepLocalCopy } = picker;
  const type = types
    ? [types.pdf, types.images, types.docx, types.allFiles].filter(Boolean)
    : ['public.item'];

  try {
    const results = await picker.pick({
      type,
      allowMultiSelection: true,
      mode: 'import',
      presentationStyle: 'fullScreen',
    });

    let files = Array.isArray(results) ? results : [];

    if (typeof keepLocalCopy === 'function' && files.length) {
      try {
        const copied = await keepLocalCopy({
          files: files.map((f: any) => ({
            uri: f.uri,
            fileName: f.name || 'attachment',
          })),
          destination: 'cachesDirectory',
        });
        if (Array.isArray(copied) && copied.length) {
          files = copied.map((c: any, i: number) => ({
            ...files[i],
            uri:
              c?.status === 'success'
                ? c?.localUri || c?.uri || files[i]?.uri
                : files[i]?.uri,
            name: c?.fileName || files[i]?.name,
          }));
        }
      } catch {
        // keep original
      }
    }

    return mapPicked(files);
  } catch (err) {
    if (isCanceled(err, picker)) return null;
    throw err;
  }
}

export async function pickCaseAttachmentsFromFiles(): Promise<
  PickedDocument[] | null
> {
  // iOS: DocumentAttach only (avoids documents-picker cancel race entirely)
  if (Platform.OS === 'ios') {
    if (!NativeModules.DocumentAttach?.pick) {
      throw new Error(
        'DocumentAttach native module missing. Run yarn ios to rebuild.',
      );
    }
    return pickWithDocumentAttach();
  }

  return pickWithDocumentsPackage();
}

export async function pickCaseAttachmentsFromCamera(): Promise<
  PickedDocument[] | null
> {
  const result = await launchCamera({
    mediaType: 'photo',
    quality: 0.8,
    saveToPhotos: false,
    includeBase64: false,
  });
  if (result.didCancel) return null;
  if (result.errorCode) {
    throw new Error(result.errorMessage || 'Unable to open camera.');
  }
  const mapped = mapImageAssets(result.assets);
  return mapped.length ? mapped : null;
}

export async function pickCaseAttachmentsFromPhotos(): Promise<
  PickedDocument[] | null
> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
    selectionLimit: 5,
    includeBase64: false,
  });
  if (result.didCancel) return null;
  if (result.errorCode) {
    throw new Error(result.errorMessage || 'Unable to open photo library.');
  }
  const mapped = mapImageAssets(result.assets);
  return mapped.length ? mapped : null;
}

export async function pickCaseAttachmentsFromSource(
  source: AttachSource,
): Promise<PickedDocument[] | null> {
  if (source === 'camera') return pickCaseAttachmentsFromCamera();
  if (source === 'photos') return pickCaseAttachmentsFromPhotos();
  return pickCaseAttachmentsFromFiles();
}

export async function pickCaseAttachments(): Promise<PickedDocument[] | null> {
  return pickCaseAttachmentsFromFiles();
}
