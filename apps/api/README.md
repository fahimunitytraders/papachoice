<<<<<<< HEAD
# Backend workspace

Reserved for the team's future backend. The frontend is fully runnable without this workspace serving anything.

Choose your backend framework here, add scripts and dependencies to this package.json, then add a root orchestration script if needed. Shared public content validation is available from @papas-choice/content. Follow ../../docs/backend-plan.md for integration points.
=======
# Registration email backend

AWS Lambda receives the registration form through its built in Function URL and sends a complete application email through SES to `imfahim003@gmail.com`. A private S3 bucket temporarily holds the proof document. No database is used.

Follow [the AWS Console guide](../../docs/aws-registration-setup.md). It shows how to create and connect each part through the AWS website.

## Local development

Run these commands from the repository root:

```powershell
npm.cmd ci
npm.cmd run dev:api
npm.cmd test
npm.cmd run build:api
```

The local API binds to `127.0.0.1:3001` and accepts the frontend origin `http://localhost:5173`. It saves sample email previews under `apps/api/.local-mail/` and never sends real email. Set `VITE_REGISTRATION_API_URL=http://localhost:3001` in the frontend environment file to use it. Use sample information and delete the previews after testing.

`build:api` bundles the Lambda code and its SDK dependencies into `dist/index.js`, with `dist/package.json`. Compress these two files at the ZIP root and upload through the Lambda console. The console kit also includes a ready made upload ZIP. No layer or SAM command is required.

## HTTP endpoints

| Method and path | Request body | Result |
| --- | --- | --- |
| POST /registrations/uploads | submissionId, registration, proof, websiteTrap | A short lived private S3 upload permission |
| POST /registrations | submissionId, registration, proof, websiteTrap | Email acceptance receipt and application reference |

The function uses the Function URL payload version 2.0 format. The handler dispatches requests by rawPath, so the two paths do not need a separate routing service. Both endpoints require JSON and the configured Origin. The handler also answers OPTIONS preflight requests, so leave the Function URL’s separate CORS configuration disabled.

The browser uploads the actual file directly to S3 using the returned form fields, with the file as the final multipart field. The S3 policy binds its key, exact size, MIME type, encryption, expiry and application fingerprint. Lambda compares that fingerprint before emailing. No complete application is stored on the server; only the temporary proof document and its signed metadata use S3.

Shared validation is in `packages/registration/index.js`; `tests/fixtures.js` contains a complete sample application. The registration object includes values, differentDelivery, includeGuarantor, declarationAccepted, declarationVersion and signatureDataUrl. The browser cannot choose the receiver or sender.

## Four runtime settings

| Variable | Value |
| --- | --- |
| FROM_EMAIL | SES verified sender |
| TO_EMAIL | Receiver, initially imfahim003@gmail.com |
| ALLOWED_ORIGIN | Exact frontend origin |
| UPLOAD_BUCKET | Private temporary document bucket |

Set these through Lambda’s Environment variables screen. Lambda uses its execution role for AWS access; no AWS keys belong in React. This endpoint submits an application for manual review and does not create a customer login or approve credit.

## Files and sending behaviour

Documents must be PDF, JPG or PNG, at most 5 MB. Lambda checks object metadata and basic file signatures. This is format validation, not malware scanning. A drawn signature is attached as a PNG; typed signatures and all active form sections appear in the email body.

S3 is private, encrypted and HTTPS only. Documents are removed after SES accepts the email. Remaining files become eligible for lifecycle deletion after one day; cleanup is asynchronous. Email copies remain subject to the receiving mailbox’s access and retention settings.

This version has no persistent submission ledger or server deduplication. The form blocks repeat clicks while sending and does not automatically retry an uncertain email result. Concurrent direct requests can still produce duplicates. An uncertain result asks the user to contact the team using the reference before trying again. Explicit provider rejections allow a retry. SES SDK retries are disabled because SendEmail has no idempotency token.

Operational logs contain references and event categories rather than form bodies, email addresses or attachments. Set log retention to 14 days in the console. A success receipt means SES accepted the message, not that it reached Gmail’s inbox.

The optional `template.yaml` describes the same Lambda, Function URL and S3 setup for future automated deployment. The console guide is the primary setup workflow.
>>>>>>> origin/fullprods
