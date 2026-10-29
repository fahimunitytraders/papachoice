# Papa's Choice frontend

Run commands from the repository root. See ../../README.md for setup, local editor usage, tests and team workflow.

Source pages are in src/pages. Shared public content is in ../../packages/content/defaults.json. Static assets are in public/assets. Vite outputs dist for production hosting.

Copy .env.example to .env.local and set VITE_REGISTRATION_API_URL to the deployed API URL, or http://localhost:3001 for the local preview API. Restart Vite after changes. See ../../docs/aws-registration-setup.md. AWS credentials never belong in this workspace.
