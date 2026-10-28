# Backend integration plan

apps/api is reserved so the team can choose its server framework, database and hosting. No framework or runtime has been imposed, and no endpoints currently exist.

## Suggested first contracts

| Future endpoint               | Responsibility                                                     |
| ----------------------------- | ------------------------------------------------------------------ |
| GET /api/site-content         | Public validated content with a version identifier                 |
| PUT /api/admin/site-content   | Authenticated, authorised update with version conflict detection   |
| POST /api/registrations       | Validated registration, consent and safe upload workflow           |
| POST /api/career-applications | Role-specific application and safe upload workflow                 |
| POST /api/admin/session       | Real staff authentication or integration with an identity provider |

Import validateContent from @papas-choice/content for shape validation, but authorisation and business validation must happen on the server. Keep revision history and use optimistic concurrency so two editors cannot overwrite each other's work silently.

Replace ContentProvider's local adapter with an API content service. Keep defaults as a fallback only when appropriate. Remove the public local editor from a production build once a protected editor is introduced. A frontend password, hidden route or localStorage flag is not server authorisation.

Registration and career form submission handlers are the integration points. Agree retention, access and deletion policies before storing uploaded documents. Validate uploaded bytes on the server, enforce request and file size limits, and never trust client-side extension checks alone.

Contact and enquiry links can remain as they are. There is no requirement for ecommerce, baskets or payments in this project.
