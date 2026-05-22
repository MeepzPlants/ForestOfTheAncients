# Forest of the Ancients — Setup Guide

## Requirements

- Node.js 18 or later
- A modern browser (Chrome, Safari, Firefox, Edge)
- A GitHub account (for deployment)
- A Vercel or Netlify account (for hosting)

---

## Local development

### 1. Install dependencies

```bash
cd fota-local
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

The app opens at `http://localhost:3000`. The service worker is disabled in development mode — offline functionality only works in production builds.

---

## Building for production

### Personal version (with your plant inventory preloaded)

```bash
npm run build
```

Output goes to `fota-local/dist/`.

### Shared version (empty inventory for other users)

Before building, rename `src/data/defaultPlants.empty.js` to `src/data/defaultPlants.js`, replacing the existing file. Then:

```bash
npm run build
```

Rename the file back to `defaultPlants.empty.js` afterward to restore your personal version.

---

## Generating PWA icons

You need two PNG icons in `public/`:

- `icon-192.png` — 192×192 pixels
- `icon-512.png` — 512×512 pixels

### Recommended approach

1. Open `public/logo.svg` in a browser or image editor
2. Export or screenshot at 192×192 and save as `icon-192.png`
3. Export or screenshot at 512×512 and save as `icon-512.png`
4. Place both files in `fota-local/public/`

Alternatively use a free online SVG-to-PNG converter such as svgtopng.com or cloudconvert.com.

For best results on iOS, ensure the icons have a solid background (the SVG already includes a dark green rounded rectangle background).

---

## Deploying to Vercel (recommended)

### First deployment

1. Push the `fota-local` folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **Add new project** and import your repository
4. Set the following build settings:
   - **Framework preset:** Other
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm install`
5. Click **Deploy**

Vercel gives you a free URL like `fota-local.vercel.app`.

### Connecting your custom domain

1. In your Vercel project go to **Settings → Domains**
2. Add `theancientgarden.com`
3. Follow Vercel's DNS instructions to point your domain registrar's nameservers or add a CNAME record

### Subsequent deployments

Push to your GitHub repository's main branch. Vercel deploys automatically.

---

## Deploying to Netlify

1. Run `npm run build` locally
2. Go to [netlify.com](https://netlify.com) and sign in
3. Drag and drop the `dist/` folder onto the Netlify dashboard
4. Netlify gives you a free URL immediately
5. For a custom domain go to **Domain settings** and add `theancientgarden.com`

---

## Deploying to GitHub Pages

1. Install the gh-pages package: `npm install --save-dev gh-pages`
2. Add to `package.json` scripts: `"deploy": "gh-pages -d dist"`
3. Run `npm run build && npm run deploy`
4. In your GitHub repository go to **Settings → Pages** and set source to `gh-pages` branch

Note: GitHub Pages serves from a subdirectory by default which requires setting `base` in `vite.config.js`. Vercel or Netlify are simpler for this project.

---

## Installing the PWA on your phone

### Android (Chrome)

1. Open the app URL in Chrome
2. Tap the three-dot menu
3. Tap **Add to Home screen**
4. Tap **Add**

The app installs with its own icon and opens fullscreen without the browser UI.

### iPhone (Safari)

1. Open the app URL in Safari (must be Safari, not Chrome)
2. Tap the Share button (box with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**

### Desktop (Chrome or Edge)

1. Open the app URL
2. Click the install icon in the address bar (looks like a monitor with a down arrow)
3. Click **Install**

---

## Data storage and privacy

All data is stored locally in your browser's IndexedDB. Nothing is sent to any server. Your plant inventory, journal entries, photos, propagation records, and harvest logs never leave your device.

**Important:** Clearing browser data or site data in your browser settings will delete all app data. Use the Export feature in Settings regularly to keep a backup.

---

## Sharing the app with others

Build the shared version (empty inventory) and deploy it to a separate Vercel project or subdomain. Share the URL. Each user's data is completely isolated on their own device — users cannot see each other's plants.

---

## Troubleshooting

**App shows a database error on startup**
The app requires IndexedDB which is disabled in private/incognito mode. Open the app in a regular browser window.

**Photos are not saving**
IndexedDB has storage limits (typically 50% of available disk space on desktop, less on mobile). If you have a very large number of photos the database may be full. Export your data, clear it, and reimport — or delete old photos from the journal.

**Service worker not updating**
If the app seems stuck on an old version, go to Settings (in your browser's developer tools → Application → Service Workers) and click **Unregister**, then reload.

**Notifications not working on iPhone**
Push notifications require iOS 16.4 or later and the app must be installed to the home screen (not just opened in Safari) before notifications will work.

**Build fails with module errors**
Ensure you are using Node.js 18 or later: `node --version`. If the version is older, update Node.js from nodejs.org.
