# Firebase Storage Setup for Omari Studio

This guide explains how to configure Firebase Storage for image uploads.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable **Storage** in the project

## 2. Get Service Account Credentials

1. In Firebase Console: Project Settings (gear) → Service accounts
2. Click **Generate new private key**
3. Save the JSON file securely

## 3. Configure Environment

Add to `backend/.env`:

```env
# Firebase Storage (required for image uploads)
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

- **FIREBASE_STORAGE_BUCKET**: Your bucket name (e.g. `myproject.appspot.com`), found in Firebase Console → Storage
- **FIREBASE_SERVICE_ACCOUNT**: The entire contents of the service account JSON file, as a single line (escape any quotes if needed)

### Alternative: Use a file path

Set `GOOGLE_APPLICATION_CREDENTIALS` to the absolute path of your service account JSON file:
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
```

## 4. Storage Rules

In Firebase Console → Storage → Rules, use:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /landing/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

- **Read**: Public (anyone can view images)
- **Write**: Disabled for clients; only your backend (Admin SDK) can upload

## 5. CORS (if needed)

If you host the frontend on a different domain, you may need to configure CORS for the Storage bucket. Use `gsutil`:

```bash
echo '[{"origin": ["*"], "method": ["GET"], "maxAgeSeconds": 3600}]' > cors.json
gsutil cors set cors.json gs://your-bucket-name
```

## 6. Migrate Existing Images

Images stored as external URLs (e.g. Facebook CDN) will eventually expire or return 403. To migrate:

1. Go to **محتوى الموقع** (Landing Admin) in your app
2. For each section (Hero, Gallery, Offers, Testimonials, Blog):
   - Edit each item
   - Re-upload the image using the new upload control
   - Save

The new Firebase URLs are permanent and will not have CORS or expiration issues.
