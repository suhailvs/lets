# CoinApp Web

A WhatsApp-style React (Vite) front-end for the CoinApp Django REST backend.

- **Chats** – every member of your exchange (like contacts). Open one to see your
  transactions as chat bubbles, and **Pay** or **Receive** coins from the composer.
- **Offerings / Wants** – browse the exchange's listings, filter by category / mine / a member,
  view details, message the owner, and add / edit / hide / delete your own.
- **Profile** – balance, change password, log out. Plus login and join-an-exchange screens.
- Light & dark themes (follows the OS), two-pane on desktop, single-pane on mobile.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run dev -- --host 0.0.0.0

```

In development Vite proxies `/api` and `/media` to `http://localhost:8000`
(override with `VITE_BACKEND=http://host:port npm run dev`), so no CORS setup is needed.
This assumes `coinapp.api.urls` is included at `/api/` – if you mount it elsewhere set
`VITE_API_URL` (see `.env.example`) and adjust the proxy in `vite.config.js`.

## Production build

```bash
VITE_API_URL=https://your-domain/api npm run build   # output in dist/
```

Serve `dist/` statically. If it is on a different origin than Django, install
`django-cors-headers` and allow that origin. The app uses hash routing, so any static host works.

## Backend notes

- Auth is DRF `TokenAuthentication` (`Authorization: Token <key>`) – make sure it is in
  `REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']`.
- Users sign in with their exchange username (e.g. `ABCD3`); the API upper-cases it.
- Registration here joins an *existing* exchange. Creating a new exchange (country/state pickers)
  isn't included.
- The listing list endpoint doesn't return the owner, so owner details appear on the detail screen.
