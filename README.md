# germany-hybe
# Germany HYBE — Netlify form notes

This project includes a multi-step (wizard) KYC form that submits to Netlify Forms. The interactive wizard is a client-side component, but a hidden server-rendered form is included so Netlify detects the form at build time.

Key points
- Form name: `kyc-verification`
- The interactive wizard is implemented in `components/kyc-form.tsx`. It mounts a native `<form>` with `data-netlify="true"`, `method="POST"` and `encType="multipart/form-data"` so uploaded documents are submitted.
- A hidden, server-rendered form is included in `app/page.tsx` so Netlify detects the form fields at build time (required by Netlify Forms).

Files and behavior
- `components/kyc-form.tsx` collects all fields across steps, generates hidden inputs for dynamic fields before submission and ensures file inputs are populated (handles drag-and-drop flows by copying files into a DataTransfer object). It then calls `form.submit()` so Netlify processes the POST.
- `components/kyc-sections/document-upload.tsx` contains the file input with `name="documents"` (multiple). If browsers prevent assigning FileList to the input, the form logic includes a fallback that submits filenames as `documents_filenames[]` hidden fields.

Netlify setup and testing
1. Ensure Netlify Forms are enabled in your Netlify site settings (they are usually enabled by default).
2. Deploy the site (or run a Netlify CLI dev server) so Netlify can detect forms at build time. The hidden form in `app/page.tsx` ensures detection.
3. To test locally with Netlify's form handling you can:
	- Use `netlify dev` (Netlify CLI) which provides form handling in dev mode, or
	- Deploy to a branch on Netlify and submit the form from the deployed site to see submissions in the Netlify dashboard.

Testing notes and limitations
- The submission uses the native form submit to allow Netlify to parse multipart/form-data and attach uploaded files. Modern browsers allow setting `input.files` via a `DataTransfer` object (this code attempts that). If the browser blocks it, the fallback will at least send filenames to Netlify.
- The form redirects to `/success` (configured in `components/kyc-form.tsx`) after a successful native submission. Ensure the `/success` route exists (the project contains `app/success/page.tsx`).

If you want serverless processing instead of Netlify Forms (e.g., storing files in S3), we can add an API endpoint to accept the multipart upload and forward to your storage provider.

If you'd like, I can also add an example test harness or a small integration test showing a synthetic submission (no files) against Netlify's test endpoints.

This project contains a multi-step KYC wizard built with Next.js (app router). It is intended to be deployed to Netlify and uses Netlify Forms to capture wizard submissions.

Netlify-specific notes
- The interactive wizard is a client component. Netlify only detects forms that are present in the built HTML. To ensure Netlify captures the form structure at build time, a hidden server-rendered form is included in `app/page.tsx` with `name="kyc-verification"` and `data-netlify="true"`.
- The client wizard populates the real form at runtime (hidden inputs + file inputs) and calls the native `.submit()` so Netlify receives a multipart/form-data POST and redirects to `/success` on successful submission.

What I changed to enable Netlify form handling
- Added a hidden, server-rendered form in `app/page.tsx` so Netlify detects the form during build.
- Ensured the documents file input has a `name="documents"` in `components/kyc-sections/document-upload.tsx` so uploaded files are included in the multipart POST.

How to test locally
- Netlify local dev (recommended): install the Netlify CLI and run `netlify dev` at the project root. Submit the wizard and check the Netlify dev logs / dashboard for received form entries.

	```bash
	npm install -g netlify-cli
	netlify dev
	```

- Alternatively, build the site statically and inspect the generated HTML to confirm the hidden form is present (search for `name="kyc-verification"`).

Netlify form behavior
- On successful submission the form posts to the `action` on the interactive form (set to `/success`) and Netlify will persist submissions in the Netlify dashboard. If you prefer serverless processing or custom handling, consider using Netlify Functions to receive the POST and forward or process data.

If you'd like, I can also:
- Add a Netlify-specific honeypot field and spam protection.
- Add client-side code to POST via fetch to `/` (x-www-form-urlencoded) as a fallback for environments where native form submit isn't desired.

