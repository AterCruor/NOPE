# GitHub Pages Setup

Minimal, playful static site for No-as-a-Service.

## Enable Pages
1. Push this repo to GitHub.
2. In GitHub, open the repo settings.
3. Go to **Pages**.
4. Under **Build and deployment**, pick:
   - Source: **Deploy from a branch**
   - Branch: **main** (or your default branch)
   - Folder: **/docs**
5. Save and wait for the site to publish.

## Local Preview
You can preview locally by opening `docs/index.html` in a browser.

## Updating Reasons
When you edit `data/reasons.json`, regenerate the share hashes and static copy:
```
npm run build:reasons
```
