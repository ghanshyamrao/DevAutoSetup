# Developer One-Click Setup Manager

A Windows desktop application that installs essential development software with a single click using **Windows Package Manager (winget)**.

## Features

- **One-click installation** – Select packages and install in batch (real download and install via winget)
- **Silent install** – Uses `winget install -e --silent`
- **Admin permission detection** – Checks for elevated rights
- **Software catalog** – Loaded from `public/software-list.json` (with icon URLs)
- **Install logs** – Recent activity and installation history
- **Lightweight UI** – Electron + React, dark theme

## Requirements

- **Windows 10/11**
- **winget** (included by default on Windows 11)
- **Administrator privileges** (for installs)
- **Internet** connection

## Quick start

```bash
npm install
npm run dev
```

- **Dev:** `npm run dev` – runs Vite (port 5173) and Electron. Selecting software and clicking **Start installation** downloads and installs via winget.
- **Build:** `npm run build` then `npm start` (or package with `npm run electron:build`).

## Software catalog (JSON)

The app loads the catalog from **`public/software-list.json`**. Each entry can have:

- `id` – unique string
- `name` – display name
- `winget_id` – e.g. `Microsoft.VisualStudioCode`
- `category` – e.g. `browser`, `Development Tools`, `Utilities`
- `enabled` – `true` or `false`
- `icon_url` – optional URL for the app icon

Edit `public/software-list.json` to add or change software. The built-in list is used if the file is missing or the fetch fails.

## Building the Windows installer

To produce a Windows installer (.exe):

```bash
npm run electron:build
```

**Output (in `dist-electron/`):**
- **Installer:** `Developer One-Click Setup Manager Setup 1.0.0.exe` – run this to install the app on Windows.
- **Unpacked app:** `win-unpacked/` – folder containing the portable `.exe`; you can run it or zip it without installing.

Code signing is disabled by default (`signAndEditExecutable: false`) so the build works without a certificate. To use a custom app icon, add `build/icon.png` and set `win.icon` in `package.json`.

## Winget install format

Each selected package is installed with:

```bash
winget install --id <WINGET_ID> -e --silent --accept-source-agreements --accept-package-agreements
```

Example: `winget install --id OpenJS.NodeJS.LTS -e --silent`

## License

MIT
