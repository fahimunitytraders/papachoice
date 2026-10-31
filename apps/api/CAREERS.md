# Enable career applications using the existing registration Lambda

Both forms use the same Function URL, Gmail settings and recipient (`GMAIL_TO`). No new Lambda or environment variable is required.

1. Check out the `careers-update` branch.
2. From the repository root, package the shared handler and job list:

   ```sh
   zip email-lambda.zip apps/api/index.mjs apps/web/src/data/jobs.js package.json
   ```

3. Upload `email-lambda.zip` to your existing registration Lambda. Set its handler to `apps/api/index.handler` and use Node.js 24. Keep the existing Gmail environment variables, Function URL and CORS settings. Ensure the timeout is at least 30 seconds.
4. Deploy the website branch in Amplify. Keep `VITE_REGISTRATION_LAMBDA_URL` pointing to that same Lambda. Careers uses it too. Rebuild after changing frontend variables.
5. Submit a registration and a career application from the deployed website. Confirm both emails and attachments reach the existing inbox.

Career applications send `type: "careers"`; requests without a type remain registrations. The shared handler validates each form separately and reuses the same file validation, MIME generation, OAuth exchange and Gmail sender. CVs must be PDFs no larger than 3 MB.

Local checks: `node --test --test-isolation=none apps/api/careers.test.mjs`, `npm test`, `npm run build`. Tests mock Gmail and do not prove live delivery. The public endpoint should retain appropriate abuse protection; CORS alone is not rate limiting. File-header validation does not replace malware scanning.
