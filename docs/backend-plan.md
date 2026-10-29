# Backend integration plan

<<<<<<< HEAD
apps/api is reserved so the team can choose its server framework, database and hosting. No framework or runtime has been imposed, and no endpoints currently exist.
=======
apps/api implements registration through a Lambda Function URL, SES and private temporary S3 uploads. There is no database. Follow aws-registration-setup.md to deploy through the AWS Console or preview locally. The optional template.yaml describes the same resources for future automation.

POST /registrations/uploads and POST /registrations submit applications for manual review and email their details, proof document and optional signature to the configured receiver. They do not create customer accounts or approve credit.
>>>>>>> origin/fullprods

## Suggested first contracts

| Future endpoint               | Responsibility                                                     |
| ----------------------------- | ------------------------------------------------------------------ |
| GET /api/site-content         | Public validated content with a version identifier                 |
| PUT /api/admin/site-content   | Authenticated, authorised update with version conflict detection   |
<<<<<<< HEAD
| POST /api/registrations       | Validated registration, consent and safe upload workflow           |
=======
>>>>>>> origin/fullprods
| POST /api/career-applications | Role-specific application and safe upload workflow                 |
| POST /api/admin/session       | Real staff authentication or integration with an identity provider |

Import validateContent from @papas-choice/content for shape validation, but authorisation and business validation must happen on the server. Keep revision history and use optimistic concurrency so two editors cannot overwrite each other's work silently.

Replace ContentProvider's local adapter with an API content service. Keep defaults as a fallback only when appropriate. Remove the public local editor from a production build once a protected editor is introduced. A frontend password, hidden route or localStorage flag is not server authorisation.

<<<<<<< HEAD
Registration and career form submission handlers are the integration points. Agree retention, access and deletion policies before storing uploaded documents. Validate uploaded bytes on the server, enforce request and file size limits, and never trust client-side extension checks alone.
=======
Registration is integrated. Career submissions remain a frontend demonstration. Future staff administration needs server authentication and authorisation. Keep mailbox access and retention appropriate for the application information.
>>>>>>> origin/fullprods

Contact and enquiry links can remain as they are. There is no requirement for ecommerce, baskets or payments in this project.
