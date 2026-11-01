# PapaChoice S3 content

Upload target: `https://d22teg2omtu6om.cloudfront.net/site-content/v1/`.

The ZIP contains:

```
site-content/v1/
  site.json          # page copy, theme, contact details, partners, career listings
  interface.json     # component/form labels, accessibility text, messages, legal copy
  manifest.json      # inventory with SHA-256 checksums
  favicon.svg
  assets/            # brand, partner, hero, story and warehouse images; source logo PDF
README.md
```

Product records, product categories and `assets/products/` are excluded. The existing catalogue stays in `packages/content/products.json` and local product images until the database integration is built. Marketing hero artwork showing products is included because it is part of the page design.

## Upload and activate

1. Extract the ZIP. Upload the `site-content/` directory to the root of the S3 origin used by this CloudFront distribution, preserving all object keys. If CloudFront has an origin path, upload beneath that prefix. Do not upload the ZIP itself as the content endpoint.
2. Keep the bucket private and allow CloudFront read access through its existing origin access control. Do not place secrets or customer submissions in this content folder.
3. Serve JSON as `application/json`, SVG as `image/svg+xml`, PNG as `image/png`, JPEG as `image/jpeg`, and PDF as `application/pdf`. Use short cache lifetimes for JSON (for example `public,max-age=60`) and suitable image caching. Invalidate `/site-content/v1/*` after replacing existing objects, or create a new version directory and change the configured base URL.
4. For a website hosted on another origin, configure S3 CORS and the CloudFront response headers policy to allow that site's origin for GET/HEAD. JSON requests must return JSON, not an SPA HTML error page. Example S3 CORS (replace the origin):

   ```json
   [{"AllowedOrigins":["https://YOUR-WEBSITE-DOMAIN"],"AllowedMethods":["GET","HEAD"],"AllowedHeaders":["*"],"MaxAgeSeconds":3600}]
   ```

5. Set `VITE_CONTENT_BASE_URL=https://d22teg2omtu6om.cloudfront.net/site-content/v1/` in the frontend build environment, then rebuild/redeploy. For local use, copy `apps/web/.env.example` to `apps/web/.env.local`, retaining your existing form endpoint. An empty content URL uses bundled defaults.
6. Check `site.json`, `interface.json` and an image at the CloudFront prefix. The app fetches and validates both JSON files before rendering with a five-second timeout. Network errors, invalid JSON or schema errors use the complete bundled fallback and log a warning. Upload all assets before activating the JSON; individual missing remote images do not trigger a release fallback.

## Editing content

Edit values in `site.json` and `interface.json`, preserving field names, schemaVersion, data types and `{0}` placeholders. HTML is rendered as text. Contact/page image paths beginning `/assets/` resolve under the content prefix; product images continue to use the app origin. Existing HTTPS image URLs are retained. Keep career IDs unchanged: adding a new role also requires updating the Lambda's job allowlist in `apps/web/src/data/jobs.js` and deploying the handler. Country codes/values and submission field names remain application logic.

Bundled source: `packages/content/site.json` and `packages/content/interface.json`. Regenerate the archive with `python3 scripts/package-content.py` (optional output path as first argument). Run `npm test`, `node --test --test-isolation=none apps/api/careers.test.mjs` and `npm run build` after code changes.

This archive contains the site's existing local images and text. Google Fonts remains an external font service. Backend validation responses and email formatting remain in the Lambda source. This package does not deploy AWS resources or configure the future product database.
