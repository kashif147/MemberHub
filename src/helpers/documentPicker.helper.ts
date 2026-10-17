import { Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

/**
 * Case attachments — Portal CreateCase / CaseDetail allow-list + network-v2
 * copy-to-cache picker flow.
 * - Camera / Photos: react-native-image-picker
 * - Files: document picker (PDF / PNG / JPEG / DOCX only — not legacy .doc)
 */
export type PickedDocument = {
  uri: string;
  name: string;
  type: string;
};

export type AttachSource = 'camera' | 'photos' | 'files';

/** Same MIME allow-list as Portal_App CreateCase / CaseDetail. */
export const CASE_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const CASE_ATTACHMENT_TYPES_HINT =
  'PDF, PNG, JPEG, or DOCX (legacy .doc is not supported)';

const ALLOWED_MIME = new Set<string>(CASE_ATTACHMENT_MIME_TYPES);

const isCanceled = (err: any, picker?: any) => {
  if (picker?.isCancel?.(err)) return true;
  const code = String(err?.code || '');
  if (
    code.includes('CANCELED') ||
    code.includes('CANCEL') ||
    code === 'OPERATION_CANCELED' ||
    code === 'DOCUMENT_PICKER_CANCELED'
  ) {
    return true;
  }
  const msg = String(err?.message || '').toLowerCase();
  if (
    msg.includes('cancel') ||
    msg.includes('canceled') ||
    msg.includes('cancelled')
  ) {
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

const loadDocumentsPicker = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-documents/picker');
  const picker = mod?.pick ? mod : mod?.default;
  if (!picker?.pick) {
    throw new Error('Document picker module failed to load.');
  }
  return picker;
};

const mimeFromFile = (file: any): string => {
  const raw = String(
    file?.type || file?.nativeType || file?.mime || '',
  ).toLowerCase();
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
  // DOCX only — legacy .doc is rejected by issue-service / Portal
  if (
    raw.includes('wordprocessingml') ||
    name.endsWith('.docx') ||
    (raw.includes('docx') && !name.endsWith('.doc'))
  ) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (name.endsWith('.doc') || raw === 'application/msword') {
    return 'application/msword';
  }
  if (
    raw.includes('/') &&
    !raw.startsWith('public.') &&
    !raw.startsWith('com.')
  ) {
    return raw;
  }
  return 'application/octet-stream';
};

export const isAllowedCaseAttachment = (file: {
  name?: string;
  type?: string;
}) => {
  const mime = mimeFromFile(file);
  if (ALLOWED_MIME.has(mime)) return true;
  const name = String(file?.name || '').toLowerCase();
  return (
    name.endsWith('.pdf') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.docx')
  );
};

const normalizeFileUri = (uri: string) => {
  const value = String(uri || '').trim();
  if (!value) return '';
  if (value.startsWith('file://') || value.startsWith('content://')) {
    return value;
  }
  if (value.startsWith('/')) return `file://${value}`;
  return value;
};

/**
 * prj-network-v2 prefers the durable copy (`fileCopyUri`) over the
 * security-scoped `uri` after `copyTo: 'cachesDirectory'`.
 */
const resolvePickedUri = (file: any): string =>
  normalizeFileUri(
    file?.fileCopyUri ||
      file?.localUri ||
      file?.fileCopyURI ||
      file?.uri ||
      file?.path ||
      '',
  );

const mapPicked = (files: any[]): PickedDocument[] =>
  (files || [])
    .map((f: any) => ({
      uri: resolvePickedUri(f),
      name: String(f?.name || f?.fileName || 'attachment'),
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

/**
 * Files — Portal CreateCase types + network-v2 copy-to-cache.
 * Legacy .doc is intentionally excluded (issue-service rejects it).
 */
export async function pickCaseAttachmentsFromFiles(): Promise<
  PickedDocument[] | null
> {
  const picker = loadDocumentsPicker();
  const { types, keepLocalCopy, isCancel } = picker;

  const typeFilter = [
    types?.pdf,
    types?.images,
    types?.docx,
    ...CASE_ATTACHMENT_MIME_TYPES,
  ].filter(Boolean);

  try {
    const results = await picker.pick({
      type: typeFilter.length ? typeFilter : [...CASE_ATTACHMENT_MIME_TYPES],
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
            fileName: f.name || f.fileName || 'attachment',
          })),
          destination: 'cachesDirectory',
        });
        if (Array.isArray(copied) && copied.length) {
          files = copied.map((c: any, i: number) => {
            const original = files[i] || {};
            const localUri =
              c?.status === 'success'
                ? c?.localUri || c?.uri || original?.uri
                : original?.uri;
            return {
              ...original,
              fileCopyUri: localUri,
              localUri,
              uri: localUri || original?.uri,
              name: c?.fileName || original?.name,
            };
          });
        }
      } catch {
        // Fall back to pick() uris
      }
    }

    const mapped = mapPicked(files).filter(isAllowedCaseAttachment);
    if (files.length && !mapped.length) {
      throw new Error(
        `Unsupported file type. Please choose a ${CASE_ATTACHMENT_TYPES_HINT}.`,
      );
    }
    return mapped.length ? mapped : null;
  } catch (err) {
    if (isCanceled(err, { isCancel, ...picker })) return null;
    throw err;
  }
}

/** Camera — aligned with prj-network-v2 launchCamera options. */
export async function pickCaseAttachmentsFromCamera(): Promise<
  PickedDocument[] | null
> {
  const result = await launchCamera({
    mediaType: 'photo',
    quality: 0.8,
    saveToPhotos: false,
    includeBase64: false,
    presentationStyle: 'fullScreen',
  });
  if (result.didCancel) return null;
  if (result.errorCode) {
    throw new Error(result.errorMessage || 'Unable to open camera.');
  }
  const mapped = mapImageAssets(result.assets);
  return mapped.length ? mapped : null;
}

/** Photos — aligned with prj-network-v2 launchImageLibrary. */
export async function pickCaseAttachmentsFromPhotos(): Promise<
  PickedDocument[] | null
> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
    selectionLimit: 5,
    includeBase64: false,
    presentationStyle: 'fullScreen',
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

/** prj-network-v2 CustomImagePicker: wait for prior UI to finish dismissing. */
export const pickerPresentDelayMs = Platform.OS === 'ios' ? 700 : 200;
