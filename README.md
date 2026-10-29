# Papa's Choice

<<<<<<< HEAD
A React + Vite catalogue website in an npm workspaces monorepo. The frontend runs on its own. The backend workspace is reserved for your team to implement later.
=======
A React + Vite catalogue website in an npm workspaces monorepo, with an AWS Lambda registration backend. Registrations are emailed through Amazon SES to `imfahim003@gmail.com`, including the supporting document and any drawn signature.

Follow [the AWS Console setup guide](docs/aws-registration-setup.md) for the backend. Nothing has been deployed into your AWS account yet.
>>>>>>> origin/fullprods

## Start on Windows

Install Node.js 24, extract the ZIP, then open a terminal in this folder, alongside the root `package.json`.

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the localhost address printed by Vite, normally http://localhost:5173.

Use `npm.cmd` in PowerShell if Windows blocks `npm.ps1`. In Command Prompt, macOS or Linux, `npm ci` and `npm run dev` work normally.

Stop the server with Ctrl+C. Next time, only run `npm.cmd run dev`.

## Included

- Papa's Choice branding, the supplied logo and the approved food homepage design.
- Best sellers with product brands, prices and three food categories.
- A catalogue with search, filters, sorting and product enquiry details.
- Phone and WhatsApp enquiries, with no basket, checkout, quantity selectors or colour options.
- About page with the supplied company story and three illustrated, animated sections: Mission, Quality and Values.
- A looping partner slider with a pause control and reduced motion support, plus a searchable partner directory.
- Separate Registration, Careers and Contact pages.
- Credit Controller and Warehouse Operative roles, without salary details.
- Footer contact information, opening times, working navigation, directions and website information.
- A local site editor for hex colours, text, button labels and destinations, products, categories, partners and company details.
<<<<<<< HEAD
=======
- Registration emails with server validation, private document uploads and local email previews.
- A manual AWS Console guide for Lambda, its Function URL, SES and S3, plus an optional infrastructure template.
>>>>>>> origin/fullprods

## Pages

| Page        | URL           |
| ----------- | ------------- |
| Home        | `/#/`         |
| About us    | `/#/about`    |
| Products    | `/#/products` |
| Partners    | `/#/partners` |
| Careers     | `/#/careers`  |
| Register    | `/#/register` |
| Contact     | `/#/contact`  |
| Site editor | `/#/admin`    |

Hash routes work on static hosting without server rewrite rules. Do not open index.html directly as a file; use Vite or another web server.

## Edit colours and text

1. Open the Site editor link in the footer, or visit `http://localhost:5173/#/admin`.
2. Use Appearance for six digit hex colours, such as `#D7B99A`.
3. Use Page text for headings, paragraphs, navigation, button labels and the homepage button destinations.
4. Use Products and Partners to edit or add entries.
5. Use Company to update contact details and optional company registration information.
6. Choose Save changes, then open the site to see them.

The editor is a frontend prototype, not authenticated administration. It only stores public website content in this browser. It does not write to your repository or a server, and it does not change the site for other visitors.

To share edits with your team, choose Export JSON. Replace `packages/content/defaults.json` with the exported file and commit it. Import JSON loads a saved file into the editor; Save changes then applies it locally. Reset to defaults clears the browser override and restores the bundled file. See [content editing](docs/content-editing.md).

## Prices and company details

The three uploaded food products did not include prices. The starting figures are explicitly labelled sample prices. Edit them in Products and replace the catalogue price label and notice after you have verified the actual prices. Sample prices are per bottle, box or jar; no case quantities have been invented.

The supplied phone number, WhatsApp number, address and opening times are included. Email address, registered legal name, company number and VAT number are optional fields, blank by default and hidden until provided. No company identifiers have been invented.

## Workspace layout

```text
apps/
  web/                    React + Vite frontend
<<<<<<< HEAD
  api/                    Reserved backend workspace and integration notes
=======
  api/                    Lambda backend, local preview, SAM template and tests
>>>>>>> origin/fullprods
packages/
  content/                Shared defaults, validation and catalogue utilities
    defaults.json         Team's committed content configuration
    index.js              Shared data contract and validation
    tests/                Data and validation tests
<<<<<<< HEAD
docs/                     Architecture, editing, assets and backend plan
=======
  registration/           Shared application schema and declaration
docs/                     AWS setup, architecture, editing and asset notes
>>>>>>> origin/fullprods
.github/                  CI workflow, issue and pull request templates
package.json              Root workspace commands
package-lock.json         One shared lockfile
```

## Commands

Run from the repository root. In PowerShell, use `npm.cmd` instead of `npm`.

```sh
npm run dev
npm run build
<<<<<<< HEAD
=======
npm run build:api
npm run build:web
npm run dev:api
>>>>>>> origin/fullprods
npm run preview
npm test
npm run format
```

<<<<<<< HEAD
Production output goes to `apps/web/dist`. The delivered ZIP also contains a prebuilt copy. No database, API credentials or environment variables are needed to try the frontend.
=======
Frontend output goes to `apps/web/dist`; Lambda output goes to `apps/api/dist`. The ZIP includes both builds. The catalogue runs without AWS. Registration needs the local preview API or a deployed backend, configured through `apps/web/.env.local`.

To test without sending email, set `VITE_REGISTRATION_API_URL=http://localhost:3001` in that file. Run `npm.cmd run dev:api` in one terminal and `npm.cmd run dev` in another. Submit sample details at `http://localhost:5173/#/register` and inspect `apps/api/.local-mail/`. The setup guide has the complete steps.
>>>>>>> origin/fullprods

## Work in a team

Create an empty GitHub repository, then run:

```sh
git init -b main
git add .
git commit -m "Create Papa's Choice website"
git remote add origin https://github.com/YOUR-ORG/YOUR-REPO.git
git push -u origin main
```

Replace the URL with your repository. No remote repository has been created or pushed by this delivery.

<<<<<<< HEAD
Use feature branches and pull requests. GitHub Actions runs the shared tests, frontend interaction tests and production build. The workflow checks both Windows and Linux. Configure repository branch protection to require the workflow before merging. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Backend next

`apps/api` deliberately has no HTTP server, database or authentication yet. Follow [the backend plan](docs/backend-plan.md) when adding it. The shared content package can be imported by either workspace. The first real admin implementation must authorise content changes on the server; hiding the editor link is not access control.

Registration and career forms validate input and demonstrate completion, but do not submit or retain personal information. File inputs stay in memory only. Website information dialogs describe this current behaviour and need updating when the backend is connected.
=======
Use feature branches and pull requests. GitHub Actions runs shared tests, backend tests, frontend interaction tests, both builds and infrastructure validation. It checks Windows and Linux. Configure branch protection to require the workflow before merging. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Backend scope

`apps/api` implements registration and email delivery. The browser never receives AWS credentials. Lambda uses its execution role, and the destination email is controlled by the deployment configuration.

The local site editor and career form retain their existing behaviour. Staff authentication, shared content editing, customer logins and career submissions remain future work. See [the backend plan](docs/backend-plan.md). Registration requests manual review; it does not automatically approve an account or grant credit.
>>>>>>> origin/fullprods

## Images and verification

All product, logo, partner and About imagery is bundled locally. DM Sans loads from Google Fonts with an Arial fallback. See [asset sources](docs/assets.md) for provenance and replacement notes.

The build and automated tests are run before delivery. Browser visual verification could not run because the managed preview service was unavailable. Check the desktop and mobile layouts locally before deployment. Motion respects `prefers-reduced-motion`; the partner loop also supports pause, hover and keyboard focus.
