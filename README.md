# Talia Sourcing Intelligence

Public-safe sourcing workspace for TA Connections. The application is an English-only static Next.js product prototype focused on Platform Admin and Sourcing Manager workflows.

## Data safety

- The public deployment contains synthetic demonstration records only.
- SharePoint, Cvent, and StormX are modeled as read-only sources.
- Source links and imported CSV previews are stored only in the current browser.
- No tenant credentials, private documents, emails, or live records are committed to this repository.

## Local commands

```bash
npm install
npm run typecheck
npm run build
```

GitHub Actions builds and publishes the static export to GitHub Pages.
