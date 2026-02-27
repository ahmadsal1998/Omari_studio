import path from 'path';
import fs from 'fs';
import admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';

const PREFIX = 'landing';

let initialized = false;
let bucketName: string | undefined;

export function initFirebase(): void {
  if (initialized) return;

  bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const creds = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!bucketName) {
    console.warn('Firebase Storage disabled: set FIREBASE_STORAGE_BUCKET');
    return;
  }

  if (!credsPath && !creds) {
    console.warn('Firebase Storage disabled: set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT');
    return;
  }

  try {
    let credential;
    if (credsPath) {
      const backendRoot = path.resolve(__dirname, '..', '..');
      const resolvedPath = path.isAbsolute(credsPath)
        ? credsPath
        : path.resolve(backendRoot, credsPath);
      if (!fs.existsSync(resolvedPath)) {
        console.error('Firebase init error: credentials file not found at', resolvedPath);
        return;
      }
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
      credential = admin.credential.cert(serviceAccount);
    } else if (creds) {
      credential = admin.credential.cert(JSON.parse(creds));
    } else {
      return;
    }

    admin.initializeApp({
      credential,
      storageBucket: bucketName,
    });
    initialized = true;
    console.log('Firebase Storage initialized successfully');
  } catch (err) {
    console.error('Firebase init error:', (err as Error).message);
  }
}

export function isFirebaseReady(): boolean {
  return initialized && !!admin.apps.length;
}

/**
 * Upload a buffer to Firebase Storage, optionally in a subfolder.
 * Returns the public download URL.
 */
export async function uploadToFirebase(
  buffer: Buffer,
  filename: string,
  folder: string = 'images',
  contentType?: string
): Promise<string> {
  if (!isFirebaseReady()) {
    throw new Error('Firebase Storage is not configured');
  }

  const bucket = getStorage().bucket();
  const ext = filename.split('.').pop() || 'jpg';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const path = `${PREFIX}/${folder}/${safeName}`;

  const file = bucket.file(path);
  await file.save(buffer, {
    metadata: {
      contentType: contentType || `image/${ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext}`,
      cacheControl: 'public, max-age=31536000',
    },
  });

  try {
    await file.makePublic();
  } catch {
    // Bucket may use fine-grained rules; public URL still works if rules allow read
  }
  return `https://storage.googleapis.com/${bucketName}/${path}`;
}
