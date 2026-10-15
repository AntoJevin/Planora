# Planora identity service

This small service is the secure boundary between Planora and Credence ID Cloud SDK. It starts an Apple Wallet browser session, verifies the wallet response, and returns only a minimal verification receipt to the app.

## Setup

1. In Verify with Credence, generate an evaluation Cloud SDK key, create a reader profile, and register the public HTTPS origin that will host this service.
2. Copy `.env.example` to `.env` and set `PUBLIC_ORIGIN`, `CREDENCE_LICENSE_KEY`, and `CREDENCE_PROFILE_ID`. Never add `.env` to git.
3. Install and run: `npm install && npm start`.
4. Deploy the service to the same public HTTPS origin. Credence does not accept `localhost`, so use a hosted URL or HTTPS tunnel for local development.
5. Set the mobile app's `EXPO_PUBLIC_IDENTITY_API_BASE_URL` to the public service origin, then restart Expo.

## Demo behavior

The app opens `/verify/:id`, which displays a normal HTTPS QR code. Scan it with iPhone Camera to open the same page in Safari, then tap **Verify with Apple Wallet**. The page passes Credence's complete mdoc request (`deviceRequest` and `encryptionInfo`) to the Digital Credentials API, then sends the encrypted wallet response to this service for verification.

The mobile app receives no raw identity claims; it persists only verification status, credential type, issuer, and timestamp. Sessions are held in memory and expire after 10 minutes for this assignment demo, so a restart also invalidates them.

If an active request reports that its status cannot be read, check the service logs and confirm that the deployed `PUBLIC_ORIGIN` exactly matches the HTTPS domain registered with Credence, and that the deployed license key and reader profile are valid. The API intentionally returns only a safe error category to the app and never exposes provider credentials or tokens.

For production, protect the app-facing endpoints with authentication, use shared session storage with expiration, and apply rate limiting before deploying.
