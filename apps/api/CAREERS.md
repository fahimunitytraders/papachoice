# Career application email deployment

The frontend posts to `VITE_CAREERS_LAMBDA_URL`. Deploy `careers.handler` as a separate Node.js 24 Lambda; registration continues to use `index.handler` unchanged. Package the repository-relative files together so the ZIP contains:

- `apps/api/careers.mjs`
- `apps/api/index.mjs`
- `apps/web/src/data/jobs.js`
- root `package.json` (ES module mode)

Set the handler to `apps/api/careers.handler`. For example, from the repository root:

```sh
zip careers-lambda.zip apps/api/careers.mjs apps/api/index.mjs apps/web/src/data/jobs.js package.json
```

Configure the same Gmail OAuth environment bindings used by registration:
`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_FROM`, `GMAIL_TO`.
Optionally set `GMAIL_CAREERS_TO` to a separate recruitment inbox; otherwise `GMAIL_TO` is used. Never put Gmail credentials in Amplify frontend variables.

Expose the Lambda using a Function URL configured with CORS for your actual Amplify/custom website origins, POST, and the Content-Type header. CORS belongs on the Function URL configuration, not in duplicate response headers. Use a public HTTPS endpoint for unauthenticated applicants. Set `VITE_CAREERS_LAMBDA_URL` in Amplify for the careers-update branch and rebuild the frontend. Keep `VITE_REGISTRATION_LAMBDA_URL` unchanged. A Vite variable change requires rebuilding.

CV uploads are PDF only, at most 3 MB. The server validates required fields, known job IDs, consent, request size, and PDF header. This is basic format validation, not malware scanning. The function needs outbound HTTPS to Google's OAuth and Gmail endpoints and an appropriate timeout (for example 30 seconds). Apply abuse controls/rate limits at your API edge before opening recruitment to public traffic; CORS is not an abuse control.

Run `node --test apps/api/careers.test.mjs`, `npm test`, and `npm run build`. These checks mock email transport and do not send real messages. After deployment, submit one authorised application from the deployed branch, confirm the role and attached CV arrive in the configured inbox, and confirm registration still works. Do not treat a passing local test as proof of deployed email delivery.
