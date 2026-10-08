# Publish YERA on GitHub Pages

This folder contains the complete redesigned site: source code, original logo and media, imported articles/events, migration evidence, tests and the deployment workflow. Dependencies and generated output are deliberately excluded.

## 1. Preview locally

Install Node.js 24 (the version is also recorded in `.nvmrc`). Open a terminal in the extracted `yera-website` directory, then run:

```sh
npm ci
npm run dev
```

Open the URL printed in the terminal. To check the production build instead:

```sh
npm run build
npm run verify:migration
npm run preview
```

No WordPress server, API key or environment file is required.

## 2. Put the sources in a GitHub repository

Create an empty GitHub repository. A public repository works with GitHub Free. Keep the contents of this folder at the repository root, including the hidden `.github`, `.gitignore` and `.nvmrc` files. Do not upload the ZIP itself as the site.

Using Git from this directory:

```sh
git init
git add .
git commit -m "Add YERA static website"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your actual repository URL. The ignore rules exclude dependencies, build output and local environment files.

## 3. Publish

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Open **Actions → Deploy to GitHub Pages → Run workflow** and select `main`.
4. Wait for the build and deployment jobs to complete. Open the deployment URL shown by the workflow.

The workflow installs dependencies with Node 24, builds the site, and deploys only `dist/`. It reads the Pages origin and repository base path automatically; you do not need to edit source URLs or set secrets for a normal Pages deployment.

Deployments are manual. After pushing later changes, run the workflow again.

## 4. Custom domain (optional)

Start by checking the site at its GitHub Pages URL. If moving `yera.be` later, configure the custom domain in **Settings → Pages**, follow GitHub's domain/DNS instructions, then rerun the deployment workflow so canonical URLs and the base path reflect that domain. Domain access is separate from this source handoff.

Official instructions: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Maintenance notes

- Edit layouts and components in `src/`; the shared theme is `src/styles/global.css`.
- Imported content is in `src/data/site.json`, original media in `public/`.
- `migration/` preserves original source records and asset checksums; keep it with the source repository. It is not copied into the published site.
- The original main and English collections contain some duplicate articles. Both records and their URLs are intentionally preserved.
- The contact form opens an email draft; it does not submit messages to a server.
- The content capture is from 8 October 2026. Builds use the included data, without fetching the live site.
- Do not run the fetch/import scripts during routine deployment; importing overwrites the imported data.
- See `README.md` for future React calculators/charts and `MIGRATION.md` for content and URL details.
