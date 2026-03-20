# Gbe Browser

Gbe (Guy Browser Engineer) is a desktop browser that loads normal websites and also supports a custom protocol: `gbe://`.

## What it does
- Opens regular sites with standard web security.
- Opens `gbe://` sites from local folders with Node.js enabled (for your engineer sites).
- Includes a create page to map a folder to a `gbe://name` domain.

## Run (dev)
```
cd D:\gbe\app
npm install
npm start
```

## Create a local site
1. Create a folder with `index.html` (and your CSS/JS).
2. Open `gbe://create` in the browser.
3. Enter a domain name like `studio` and select the folder.
4. Go to `gbe://studio`.

## Build an installer (Windows)
```
cd D:\gbe\app
npm run dist
```
The installer will be created in `D:\gbe\app\dist` and will install like a normal app (Start Menu + Desktop shortcut).

## Project files
- `main.js`: app process and `gbe://` protocol handler.
- `index.html`, `renderer.js`, `styles.css`: browser UI.
- `installer/`: create pages for `gbe://` domains.
