# Architecture

The root package coordinates npm workspaces. It runs the frontend, builds both frontend and Lambda, and runs content, backend and frontend tests. `dev:api` runs a local email preview service without AWS access.

@papas-choice/web uses React, Vite and React Router hash routing. The route tree includes Home, About, Products, Partners, Careers, Register, Contact and the lazily loaded Admin page. Native dialog elements provide product enquiry details, career applications and information panels.

@papas-choice/content exports the defaults, schema validation and pure catalogue utilities. Defaults are plain JSON and contain the full editable public content model. Arrays cover products, categories, partners and the illustrated About sections. Schema version 1 is explicit. Validation rebuilds the object from known properties and rejects invalid colours, destinations, asset paths, duplicate identifiers and malformed values.

ContentProvider loads a valid browser override or falls back to defaults. Save validates then writes to localStorage before updating React state. If storage is unavailable or full, the editor shows an error; the bundled site still runs. Theme values become CSS custom properties.

No browser storage is used for registration or career data. The only application storage key is papas-choice-content-v1, containing public site content. No basket exists. Registration drafts and retry identifiers stay in memory while the form is open.

@papas-choice/registration defines the application schema, declaration and file limits shared by browser and Lambda. @papas-choice/api exposes two paths through a Lambda Function URL. The first validates an application and issues a restricted S3 upload policy. The second verifies the uploaded document and requests an SES email. Signed S3 metadata binds the temporary file to the same application and expiry. There is no database or persistent application store. The proof document and drawn signature become email attachments.

The frontend waits for a successful server receipt before showing completion. Validation, upload and email errors preserve its draft. The server controls the destination and uses the applicant’s validated email for Reply To. An uncertain delivery result stops the browser from submitting again and asks the user to contact the team. Concurrent direct API requests can still produce duplicates because this minimal version has no server deduplication. See apps/api/README.md for the data flow and failure semantics.

Animation uses CSS and IntersectionObserver. Reveal components fall back to visible content when IntersectionObserver is unavailable. About sections use large reveal transitions, image masks and progressive scroll-linked image movement where supported. Reduced motion removes all animation. The partner slider duplicates a noninteractive, aria-hidden visual row to create a seamless loop; only the first row is keyboard reachable.

base.css holds shared primitives and retained form/career styling. styles.css applies the Papa's Choice design, the new pages, editor, theme overrides and responsive adaptations.
