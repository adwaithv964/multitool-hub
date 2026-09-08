# MultiTool Hub

Landing page for the MultiTool platform — a growing collection of privacy-first tools.

## Tools

| Tool | Repo | Deployed |
|---|---|---|
| MetaClean 4K | metaclean-4k | Vercel + Render |
| Send Anywhere | sendanywhere-lite | Render |

## Adding a new tool

1. Add a new `<article class="tool-card">` block in `index.html`
2. Update the URL href to point to the deployed tool
3. Push to GitHub — Vercel auto-deploys

## Deploy

Deployed as a static site on Vercel. No build step needed.

```
vercel --prod
```
