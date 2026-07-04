# FlexShare Web

The `web/` module contains the mobile-first React front end for FlexShare. It supports passenger route matching, driver route publishing, authentication views, and Google Maps based trip planning.

Previous hosted demo URL: <https://9whrslv2k8.execute-api.us-east-1.amazonaws.com/flexshare/app/index.html>

![FlexShare QR code](./QrCode.png)

## Tech Stack

- React 18
- Vite
- JavaScript / JSX
- SCSS
- Google Maps JavaScript, Places, and Directions APIs
- ESLint

## Setup

```bash
cd web
npm install
```

Create `web/.env.local`:

```env
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

Run locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Build output is written to `web/dist/`.

## Deployment Reference

The original front-end deployment target was AWS S3. The workflow is currently disabled at the repository level to prevent accidental deployments.

![AWS S3 deployment screenshot](./s3.jpeg)

## Directory Structure

```text
web/
|-- public/                 # Static files and PWA manifest
|-- src/
|   |-- api/                # API wrapper and request functions
|   |-- assets/             # Images and visual assets
|   |-- components/         # Shared UI components
|   |-- pages/              # Passenger, Driver, Login, Register, and error pages
|   |-- utils/              # Storage, geolocation, crypto, and helper utilities
|   |-- App.jsx             # Application routes and root component
|   |-- constant.js         # Shared constants
|   |-- index.css           # Global styles
|   `-- main.jsx            # Vite entry point
|-- eslint.config.js
|-- package.json
|-- vite.config.js
`-- README.md
```

## Key Features

- Passenger trip search with map-based origin and destination selection.
- Driver route publishing, seat management, and order management.
- Protected routes for authenticated pages.
- Local storage helpers for tokens and user profile state.
- Google Maps rendering for route preview and navigation context.

## Development Conventions

- Components use PascalCase.
- Shared utilities live under `src/utils/`.
- API calls are centralized under `src/api/`.
- Page folders usually pair `index.jsx` with `index.scss`.
- Keep API keys and local secrets in `.env.local`, never in source control.

## Troubleshooting

If the map does not render:

- Confirm `VITE_GOOGLE_MAPS_API_KEY` is set.
- Enable Maps JavaScript API, Places API, and Directions API in Google Cloud.
- Confirm the browser allows location permissions when geolocation is needed.
- Check Google Maps API key restrictions for localhost or deployed domains.

## More Detail

See `Project-Overview.md` for deeper front-end flow and architecture notes.
