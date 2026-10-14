/**
 * Lazy-load @react-native-documents/picker (same as Portal_App CreateCase).
 * Uses package `types` so iOS gets UTIs (PDF = com.adobe.pdf) and Android gets MIME.
 */
export type PickedDocument = {
  uri: string;
  name: string;
  type: string;
};

const isCanceled = (err: any, picker: any) => {
  try {
    return (
      picker?.isErrorWithCode?.(err) &&
      err?.code === picker?.errorCodes?.OPERATION_CANCELED
    );
  } catch {
    return false;
  }
};

const isMissingNativeModule = (err: any) => {
  const msg = String(err?.message || err || '');
  return (
    msg.includes('RNDocumentPicker') ||
    msg.includes('could not be found') ||
    msg.includes('TurboModuleRegistry')
  );
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

/** Infer MIME when iOS returns a UTI / null type. */
const mimeFromFile = (file: any): string => {
  const raw = String(file?.type || file?.nativeType || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();

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

export async function pickCaseAttachments(): Promise<PickedDocument[] | null> {
  let picker: any;
  try {
    picker = loadPicker();
  } catch (err) {
    if (isMissingNativeModule(err)) {
      throw new Error(
        'Document picker is not linked in this build. Rebuild the app (npx react-native run-ios / run-android).',
      );
    }
    throw err;
  }

  const { types } = picker;
  // Platform-correct: PDF / images / DOCX (iOS UTIs + Android MIME)
  const type = types
    ? [types.pdf, types.images, types.docx].filter(Boolean)
    : [
        'application/pdf',
        'image/*',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

  try {
    const results = await picker.pick({
      type,
      allowMultiSelection: true,
      mode: 'import',
    });

    const mapped = (Array.isArray(results) ? results : [])
      .filter((f: any) => f?.uri)
      .map((f: any) => ({
        uri: String(f.uri),
        name: String(f.name || 'attachment.pdf'),
        type: mimeFromFile(f),
      }));

    return mapped;
  } catch (err) {
    if (isCanceled(err, picker)) {
      return null;
    }
    if (isMissingNativeModule(err)) {
      throw new Error(
        'Document picker is not linked in this build. Rebuild the app (npx react-native run-ios / run-android).',
      );
    }
    throw err;
  }
}
