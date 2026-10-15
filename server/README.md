# Planora identity service

This small service is the secure boundary between Planora and Credence ID Cloud SDK. It starts a QR/deep-link mobile ID session, polls Credence for its outcome, and returns only a minimal verification receipt to the app.

## Setup

1. In Verify with Credence, generate an evaluation Cloud SDK key, create a reader profile, and register the public HTTPS origin that will host this service.
2. Copy `.env.example` to `.env` and set `PUBLIC_ORIGIN`, `CREDENCE_LICENSE_KEY`, and `CREDENCE_PROFILE_ID`. Never add `.env` to git.
3. Install and run: `npm install && npm start`.
4. Deploy the service to the same public HTTPS origin. Credence does not accept `localhost`, so use a hosted URL or HTTPS tunnel for local development.
5. Set the mobile app's `EXPO_PUBLIC_IDENTITY_API_BASE_URL` to the public service origin, then restart Expo.

## Demo behavior

The app opens `/verify/:id`, where the candidate can scan a QR code or use a wallet deep link. The mobile app receives no raw identity claims; it persists only verification status, credential type, issuer, and timestamp. Sessions are held in memory for this assignment demo, so restart the service to invalidate them.

For production, protect the app-facing endpoints with authentication, use shared session storage with expiration, and apply rate limiting before deploying.
