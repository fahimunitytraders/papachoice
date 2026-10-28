# Contributing

Use Node.js 24 and npm. Install from the repository root with `npm ci` (`npm.cmd ci` in PowerShell). Keep one root package-lock.json; do not create separate workspace lockfiles.

## Workflow

1. Pull the latest main branch.
2. Create a focused feature branch, for example `feature/product-enquiries`.
3. Start the frontend with `npm run dev`.
4. Make your change in the relevant workspace.
5. Run `npm test` and `npm run build`.
6. Open a pull request with a description and relevant checks.

Keep UI components in apps/web and shared content validation in packages/content. Add backend implementation under apps/api. Do not put secrets in public frontend environment variables or commit .env files.

Use `npm install PACKAGE --workspace=@papas-choice/web` for frontend dependencies. Commit package.json and the root lockfile together. Export browser editor changes into packages/content/defaults.json before expecting teammates to see them.

For visual changes, check mobile and desktop widths, keyboard navigation, empty states and reduced motion. Product prices and company identifiers should be verified before replacing placeholder values.

The GitHub Actions workflow checks Windows and Linux. A maintainer should enable branch protection and require it before merging. CODEOWNERS is provided as a commented template; add your real GitHub team handles.
