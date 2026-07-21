# Talia Sourcing Intelligence

Public-safe sourcing workspace for TA Connections. The application is an English-only static Next.js sourcing product focused on Platform Admin and Sourcing Manager workflows.

## Live source architecture

- Microsoft Entra SPA authentication uses Authorization Code with PKCE through `@azure/msal-browser`.
- Microsoft Graph access is delegated and read-only: `User.Read`, `Sites.Read.All`, and `Files.Read.All`.
- SharePoint site discovery, document-library discovery, file search, and a controlled Excel worksheet range are supported.
- Cvent and StormX CSV snapshots are parsed locally with quoted-field support and mapped into a shared canonical hotel record.
- Live and imported records exist in runtime memory only. They are never written to GitHub Pages, browser local storage, or the repository.
- The public presentation dataset is synthetic and is visually separated from authenticated runtime records.

## Entra activation

1. Create a Microsoft Entra App Registration configured as a Single-page application.
2. Add `https://maikolbj.github.io/talia-sourcing-intelligence/workspace/` as an SPA redirect URI.
3. Grant delegated Microsoft Graph permissions `User.Read`, `Sites.Read.All`, and `Files.Read.All`; apply tenant admin consent if required by policy.
4. In Talia, switch to Platform Admin and save the tenant ID, SPA client ID, SharePoint hostname, and site path.
5. Optionally set a Graph drive ID, workbook item ID, worksheet name, and a bounded range such as `A1:Z250`.
6. Select **Connect Microsoft 365** and sign in with an account that already has access to the sourcing site.

## Data safety

- The public deployment contains synthetic demonstration records only.
- SharePoint is accessed with delegated read-only Graph permissions; Cvent and StormX snapshots are local-only.
- Source links and non-secret connector identifiers are stored only in the current browser.
- Microsoft access tokens use session storage and are removed when the browser session ends.
- No tenant credentials, private documents, emails, or live records are committed to this repository.

## Local commands

```bash
npm install
npm run typecheck
npm run build
```

GitHub Actions builds and publishes the static export to GitHub Pages.
