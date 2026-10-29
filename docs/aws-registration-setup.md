# Papa’s Choice: simple AWS Console setup

This version uses **Lambda, SES and S3**. There is no database. Lambda’s built in Function URL provides the website endpoint, so a separate API Gateway is not required.

Use the separately supplied console kit for the ready to upload Lambda ZIP and formatted guide. Policy examples are also included in `apps/api/console-settings`. To create an upload ZIP yourself, build the API and compress the two files inside `apps/api/dist`, with no surrounding folder.

Use the updated React repository supplied with this kit. Its form includes the small request change needed by this simpler backend. Nothing has been deployed into your AWS account yet.

## What each part does

| Part                       | Purpose                                                                     |
| -------------------------- | --------------------------------------------------------------------------- |
| Lambda with a Function URL | Receives and validates the form, reads its attachment and requests an email |
| Amazon SES                 | Sends the email to imfahim003@gmail.com                                     |
| Private S3 bucket          | Temporarily holds the proof document, up to 5 MB                            |

Lambda also uses an IAM execution role for permissions and its standard CloudWatch logs for troubleshooting. You do not create a customer database, login system or background queue.

The browser asks Lambda for an upload permission, uploads the proof document to S3, then submits the application. Lambda reads the document and emails it with all the form details and any drawn signature. Successful sends delete the temporary document. The receiving mailbox keeps its copy of the application.

Keep the console region set to **Europe (London), eu-west-2**. IAM itself is global. Normal AWS usage charges apply to the resources you create.

## 1. SES: verify the email

**Purpose:** Prove that you control the sender address.

1. Open Amazon Simple Email Service using the AWS search bar.
2. Under Configuration, open **Identities**, then **Create identity**.
3. Choose **Email address** and enter `imfahim003@gmail.com`.
4. Create the identity, open the verification email in Gmail, and follow its link.
5. Return to SES and wait for **Verified**.

For this first test, use the same address as sender and receiver. SES sandbox accounts need both to be verified. The applicant’s email is only used for Reply To, so it does not need verification. No Gmail password is needed.

**Check:** SES shows the identity as Verified in London.

## 2. S3: create temporary document storage

**Purpose:** Support the existing proof document upload without putting a large file inside the Lambda request.

1. Open **S3**, then **General purpose buckets**, then **Create bucket**.
2. Select London and the general purpose bucket type.
3. Choose a unique name, for example `papas-choice-uploads-YOUR_ACCOUNT_ID`. Replace the ending with your actual account ID or another unique value.
4. Keep **ACLs disabled** and **Block all public access** enabled.
5. Keep versioning disabled for this temporary bucket.
6. Use default encryption with **Amazon S3 managed keys (SSE-S3)**.
7. Create it and note its exact name.

In the bucket’s **Permissions** tab, edit **Cross-origin resource sharing (CORS)**. Paste the contents of `apps/api/console-settings/s3-cors.json` and save:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["POST"],
    "AllowedOrigins": ["http://localhost:5173"],
    "MaxAgeSeconds": 300
  }
]
```

This lets the local website use its signed upload permission. It does not make files public.

Still under Permissions, edit **Bucket policy**. Open `apps/api/console-settings/s3-https-policy.json`, replace both occurrences of `YOUR_BUCKET_NAME` with the bucket’s actual name, then paste and save it. This requires HTTPS access.

Under **Management**, create a lifecycle rule:

| Setting             | Value                              |
| ------------------- | ---------------------------------- |
| Rule name           | expire-registration-documents      |
| Scope               | Filter by prefix                   |
| Prefix              | registrations/                     |
| Action              | Expire current versions of objects |
| Days after creation | 1                                  |

Do not add a minimum file size filter. Save the rule. Successful emails remove their document immediately; this rule handles abandoned files. Lifecycle cleanup runs asynchronously after expiry.

**Check:** Public access remains blocked, CORS includes the local origin, and the lifecycle rule is enabled.

## 3. Lambda: upload the registration code

**Purpose:** Run the registration logic when the browser sends a request.

1. Open **Lambda**, then **Event functions** or **Functions**.
2. Choose **Create function**, then **Author from scratch**.
3. Use these settings:

| Setting        | Value                                                |
| -------------- | ---------------------------------------------------- |
| Name           | papas-choice-register                                |
| Runtime        | Node.js 24.x                                         |
| Architecture   | arm64                                                |
| Execution role | Create a default role with basic logging permissions |

After creating it, open the **Code** tab. Choose **Upload from**, then **.zip file**, and upload `papas-choice-registration-lambda.zip` from this kit. Save, and choose Deploy if the editor shows pending changes.

Under **Runtime settings**, set the handler to `index.handler`. The archive already has `index.js`, its dependencies and `package.json` at the root. No Lambda layer or package installation is required.

In **Configuration**, edit **General configuration**:

| Setting | Value      |
| ------- | ---------- |
| Memory  | 512 MB     |
| Timeout | 25 seconds |

Keep the function outside a VPC for this setup.

### Add four environment variables

Go to **Configuration**, then **Environment variables**, then **Edit**. Add:

| Key            | Value                             |
| -------------- | --------------------------------- |
| FROM_EMAIL     | imfahim003@gmail.com              |
| TO_EMAIL       | imfahim003@gmail.com              |
| ALLOWED_ORIGIN | http://localhost:5173             |
| UPLOAD_BUCKET  | The exact bucket name from step 2 |

Use the bucket name alone, not its ARN or an `s3://` address. Save. AWS supplies the region automatically, and the function gets AWS credentials from its execution role.

## 4. IAM: allow Lambda to use SES and S3

**Purpose:** Give the function the permissions its code needs.

1. In Lambda, open **Configuration**, then **Permissions**.
2. Follow the **Execution role** link into IAM.
3. Keep the existing basic CloudWatch logging policy.
4. Choose **Add permissions**, then **Create inline policy**, then the JSON editor.
5. Open `apps/api/console-settings/lambda-permissions.json` from this kit.
6. Replace `YOUR_AWS_ACCOUNT_ID` with your 12 digit account ID from the top right AWS account menu. Replace `YOUR_BUCKET_NAME` with the actual bucket name.
7. Paste the edited JSON, review, name it `PapasChoiceRegistrationAccess`, and save.

The policy allows email sending from and to the chosen address, and file upload, read and deletion within your bucket’s `registrations/` prefix. It does not grant database access or administrator access. Leave the role’s existing Lambda trust policy intact.

### Optional safe check

In Lambda’s **Test** tab, create a private event called `ConfigurationCheck`. Paste `apps/api/console-settings/lambda-validation-test.json`, save and run it.

An HTTP status of **400** with `VALIDATION_ERROR` is expected because the application is intentionally empty. It confirms that the handler loads and validates input. It does not send an email or test SES and S3 access. The website test below checks the full flow.

## 5. Lambda Function URL: create the website endpoint

**Purpose:** Give React a public HTTPS address that invokes the function directly.

1. In your Lambda function, open **Configuration**, then **Function URL**.
2. Choose **Create function URL**.
3. Set **Auth type** to **NONE** so prospective customers can submit without an AWS login.
4. Use the default **BUFFERED** invocation mode.
5. Leave the Function URL’s optional **CORS configuration disabled**. The supplied handler already answers preflight requests and returns CORS headers using `ALLOWED_ORIGIN`.
6. Save and allow the console to add the public invocation permissions.

The console creates the function’s resource policy for public URL access. This is separate from the execution role you configured in step 4: the URL policy controls who can call Lambda, while the execution role controls what Lambda can do.

Copy the Function URL. It resembles:

```text
https://YOUR_URL_ID.lambda-url.eu-west-2.on.aws/
```

The code handles `/registrations/uploads` and `/registrations` under that address. No API Gateway routes need configuring.

**Check:** The Function URL is present and its auth type is NONE. If it returns an AWS 403 before your code runs, check that the resource policy grants both `lambda:InvokeFunctionUrl` and `lambda:InvokeFunction` for URL access. Creating the URL with NONE through the console normally adds both.

## 6. Connect and test the React form

Open the updated `papas-choice` project in your editor. In `apps/web`, create or edit `.env.local`:

```dotenv
VITE_REGISTRATION_API_URL=https://YOUR_URL_ID.lambda-url.eu-west-2.on.aws/
```

Replace the example with the actual Function URL. Make sure Windows has not added `.txt` to the filename.

Start or restart the frontend from its project folder:

```powershell
npm.cmd run dev
```

That command runs React locally. All AWS setup above is done through the console.

Open `http://localhost:5173/#/register`. Use that exact origin because a different port or `127.0.0.1` is a different origin.

Submit sample details with a real sample PDF, JPG or PNG. Include the optional guarantor information and a drawn signature if you want to check them. On success, note the application reference and check Gmail and spam for the email and attachments. Reply should target the applicant.

## See what happened

| Where                                                    | What to inspect                                         |
| -------------------------------------------------------- | ------------------------------------------------------- |
| Lambda: Monitor                                          | Invocations and errors                                  |
| CloudWatch log group `/aws/lambda/papas-choice-register` | Operational events containing the application reference |
| S3: Objects                                              | The proof document is deleted after a successful send   |
| Gmail                                                    | Complete form details and attachments                   |

Set the CloudWatch log group retention to 14 days after the first invocation creates it. Form bodies and attachments are not logged.

A successful receipt means SES accepted the email for sending. It does not guarantee inbox delivery. Check SES sending status and delivery or bounce information if the message does not arrive.

This minimal version has no persistent submission database or server deduplication. The browser blocks repeated clicks while submitting. If sending has an uncertain result, it asks you to check with the team before submitting again. Concurrent direct API requests could still send duplicates. File size and type checks and a honeypot are included; CORS is not authentication or a complete spam defence.

## Troubleshooting

| Problem                                  | Check                                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Invalid service configuration            | The four Lambda environment variables                                                                |
| Cannot find module or handler            | Upload the inner Lambda ZIP and use `index.handler`                                                  |
| AWS 403 before Lambda runs               | Function URL auth type and both public URL invocation permissions                                    |
| Origin or CORS error                     | Use exactly localhost:5173; check ALLOWED_ORIGIN and S3 CORS; keep the Function URL CORS setting off |
| Upload fails                             | Bucket name, S3 policy, IAM permissions and the document’s size and type                             |
| Email unavailable                        | SES verification in London and the execution role’s SES permissions                                  |
| Delivery unconfirmed                     | Check the reference in Gmail and logs before sending a new application                               |
| Opening the URL in the address bar fails | The form uses POST requests with an Origin header; a normal browser GET is not the form test         |

## Later changes

To change the receiver, update `TO_EMAIL` in Lambda and `ses:Recipients` in the inline IAM policy. Verify the new recipient while SES remains sandboxed.

To change the sender, verify the new address or domain, update `FROM_EMAIL`, and update both the SES identity ARN and `ses:FromAddress` in the policy.

For a published website, update `ALLOWED_ORIGIN` in Lambda and the origin in S3 CORS. Set the API URL in the frontend build environment and rebuild the frontend. This setup does not host the React website.

For future code edits, use the existing `npm.cmd run build:api` command locally. In File Explorer, open `apps/api/dist`, select `index.js` and `package.json` together, and compress them into a ZIP with those files at its root. Upload that ZIP through Lambda’s Code tab. SAM is not required.

## Official AWS references

1. [SES identity verification](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html)
2. [S3 CORS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/enabling-cors-examples.html)
3. [S3 lifecycle expiry](https://docs.aws.amazon.com/AmazonS3/latest/userguide/how-to-set-lifecycle-configuration-intro.html)
4. [Node.js Lambda ZIP deployment](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-package.html)
5. [Lambda execution roles](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
6. [Function URLs in the console](https://docs.aws.amazon.com/lambda/latest/dg/urls-configuration.html)
7. [Public Function URL permissions](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html)
