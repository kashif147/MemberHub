import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes, bytesToUtf8 } from '@noble/hashes/utils.js';
import { JWT_SECRET } from '../constants/config';

const base64ToUint8Array = (base64: string): Uint8Array => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const cleaned = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const output: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned.charAt(i);
    if (c === '=') break;
    const val = chars.indexOf(c);
    if (val < 0) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(output);
};

/** Same PBKDF2 key derivation as ProjectShell-1 Login.js deriveKeyFromSecret */
const deriveKeyFromSecret = (secret: string): Uint8Array => {
  const secretBytes = utf8ToBytes(secret);
  const hash = sha256(secretBytes);
  const salt = hash.slice(0, Math.min(64, hash.length));
  return pbkdf2(sha256, secretBytes, salt, { c: 100000, dkLen: 32 });
};

/**
 * Decrypt CRM accessToken (iv:tag:data) — mirrors ProjectShell-1 decryptTokenReact.
 * Plain JWT strings are returned unchanged.
 */
export const decryptCrmAccessToken = async (
  encryptedToken: string,
): Promise<string> => {
  if (!encryptedToken) {
    throw new Error('Encrypted token missing');
  }

  // Already a JWT
  if (encryptedToken.split('.').length === 3 && !encryptedToken.includes(':')) {
    return encryptedToken.replace(/^Bearer\s+/i, '');
  }

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET missing — set it in src/constants/config.ts');
  }

  const parts = encryptedToken.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format (must be iv:tag:data)');
  }

  const [ivBase64, authTagBase64, encrypted] = parts;
  const iv = base64ToUint8Array(ivBase64);
  const authTag = base64ToUint8Array(authTagBase64);
  const encryptedData = base64ToUint8Array(encrypted);

  const combined = new Uint8Array(encryptedData.length + authTag.length);
  combined.set(encryptedData);
  combined.set(authTag, encryptedData.length);

  const key = deriveKeyFromSecret(JWT_SECRET);
  const aes = gcm(key, iv);
  const plaintext = aes.decrypt(combined);
  return bytesToUtf8(plaintext);
};
