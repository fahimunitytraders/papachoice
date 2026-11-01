# PapaChoice remote content

The website requires content from `https://d22teg2omtu6om.cloudfront.net/site-content/v1/`. This is the default URL; `VITE_CONTENT_BASE_URL` can override it at build time. An explicitly empty URL is an error.

There is no local fallback for non-product text or images. On a network, CORS, HTTP, timeout or validation error, the app displays a loading error with a retry button instead of showing old content. Failed requests are logged in the browser console. A missing remote image cannot fall back to a repository image.

## S3 structure

Keep the already uploaded objects under these keys:

```
site-content/v1/site.json
site-content/v1/interface.json
site-content/v1/favicon.svg
site-content/v1/assets/...
```

Warehouse images are `assets/warehouses/london.jpg` and `assets/warehouses/thrapston.jpg`. Paths and extensions are case-sensitive. Product records and `assets/products/` remain separate in the repository until the database integration is built. Marketing hero artwork is remote site content even when it depicts products.

Serve JSON as `application/json` and images with their correct image MIME types. The S3 origin and CloudFront response headers must permit GET/HEAD from the frontend's origin through CORS. Keep the bucket private using CloudFront origin access control. The JSON endpoints must return JSON, not an SPA error document.

## Updating content

Edit the existing S3 JSON values, preserving keys, types, schemaVersion and `{0}` placeholders. Upload images before JSON that references them. The app requests JSON with browser cache revalidation on each page load, but CloudFront may still serve cached objects. Configure short JSON cache lifetimes; invalidate `/site-content/v1/*` for immediate replacements or use new image filenames and update JSON. Removing the local fallback does not disable CloudFront caching. Open pages still need a refresh.

Career IDs must match the Lambda allowlist in `apps/web/src/data/jobs.js`; adding a new role requires updating and deploying that handler. Form field names and submitted country values remain application logic.

## Repository and development

Non-product images and the downloadable ZIP have been removed from the current branch. The earlier ZIP remains recoverable from Git history. `packages/content/site.json` and `interface.json` are schema/reference content used by validation and tests; the running website never substitutes them for a failed remote request. Product data remains in `packages/content/products.json`.

Tests explicitly supply fixtures. Run `npm test`, `node --test --test-isolation=none apps/api/careers.test.mjs`, and `npm run build`. Local development also loads CloudFront; configure an alternate HTTP localhost content server with `VITE_CONTENT_BASE_URL` when necessary.

To create a complete archive again, obtain the remote assets in an external directory containing `assets/` and `favicon.svg`, then run:

```
python3 scripts/package-content.py /tmp/papachoice-content.zip /path/to/external/site-content/v1
```

The script combines the reference JSON with those external assets and rejects missing images. It does not fetch or overwrite S3. Do not upload reference JSON over intentional S3 edits without reconciling them first.

Google Fonts remains external. Backend validation responses and email formatting remain in the Lambda. AWS configuration and deployment are managed separately.
