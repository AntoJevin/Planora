import express from "express";
import crypto from "node:crypto";
import QRCode from "qrcode";

const requiredConfig = [
  "PUBLIC_ORIGIN",
  "CREDENCE_LICENSE_KEY",
  "CREDENCE_PROFILE_ID",
];
const config = Object.fromEntries(
  requiredConfig.map((key) => [key, process.env[key]]),
);
const baseUrl = "https://credenceid.com/cloudsdk/playground";
const port = Number(process.env.PORT || 3001);
const sessions = new Map();
let tokenSession;

const app = express();
app.use(express.json());

const isConfigured = () => requiredConfig.every((key) => Boolean(config[key]));

const credenceRequest = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.error || `Credence request failed (${response.status}).`,
    );
  return { status: response.status, body };
};

const getAccessToken = async () => {
  if (tokenSession?.expiresAt > Date.now() + 60_000)
    return tokenSession.accessToken;

  const { body } = await credenceRequest("/v1/setup", {
    method: "POST",
    headers: {
      Origin: config.PUBLIC_ORIGIN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      licenseKey: config.CREDENCE_LICENSE_KEY,
      profileId: config.CREDENCE_PROFILE_ID,
    }),
  });
  tokenSession = {
    accessToken: body.accessToken,
    expiresAt: Date.now() + body.expiresIn * 1000,
  };
  return tokenSession.accessToken;
};

const getSession = (id) => sessions.get(id);

app.post("/api/identity/sessions", async (_request, response) => {
  if (!isConfigured())
    return response
      .status(503)
      .json({ error: "Identity service is not configured." });
  try {
    const accessToken = await getAccessToken();
    const { body } = await credenceRequest("/openid4vp/v1/mdoc/initiate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Origin: config.PUBLIC_ORIGIN,
      },
    });
    const id = crypto.randomUUID();
    sessions.set(id, {
      credenceSessionId: body.sessionId,
      walletUri: body.walletUri,
      createdAt: Date.now(),
    });
    response.status(201).json({
      sessionId: id,
      verificationUrl: `${config.PUBLIC_ORIGIN}/verify/${id}`,
    });
  } catch (error) {
    console.error(
      "Could not create identity verification session:",
      error.message,
    );
    response
      .status(502)
      .json({ error: "Unable to start secure identity verification." });
  }
});

app.get("/api/identity/sessions/:id", async (request, response) => {
  const session = getSession(request.params.id);
  if (!session)
    return response
      .status(404)
      .json({ error: "Verification session not found or expired." });
  try {
    const accessToken = await getAccessToken();
    const result = await credenceRequest("/openid4vp/v1/mdoc/result", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Origin: config.PUBLIC_ORIGIN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId: session.credenceSessionId }),
    });
    if (result.status === 202) return response.json({ status: "pending" });
    if (!result.body.success) return response.json({ status: "failed" });

    const identity = JSON.parse(result.body.identity || "{}");
    sessions.delete(request.params.id);
    return response.json({
      status: "verified",
      credentialType: "Mobile driver license",
      issuer:
        identity.issuer || identity.issuing_authority || "Verified issuer",
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Could not read identity verification result:",
      error.message,
    );
    response.status(502).json({ error: "Unable to read verification status." });
  }
});

app.get("/verify/:id", async (request, response) => {
  const session = getSession(request.params.id);
  if (!session)
    return response
      .status(404)
      .send("Verification session not found or expired.");
  const qrCode = await QRCode.toDataURL(session.walletUri, {
    margin: 1,
    width: 320,
  });
  response
    .type("html")
    .send(
      `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verify Planora profile</title><style>body{font-family:system-ui,sans-serif;background:#f8fafc;color:#111827;margin:0;padding:32px;text-align:center}.card{max-width:420px;margin:auto;background:#fff;border-radius:20px;padding:28px;box-shadow:0 8px 30px #0001}img{width:100%;max-width:320px}a{display:block;background:#6366f1;color:#fff;text-decoration:none;padding:14px;border-radius:12px;font-weight:700;margin-top:20px}p{color:#4b5563;line-height:1.5}</style></head><body><main class="card"><h1>Verify your Planora profile</h1><p>Scan this code with your compatible digital ID wallet, or continue on this device.</p><img src="${qrCode}" alt="Digital ID verification QR code"><a href="${session.walletUri}">Open my digital wallet</a><p>Your wallet asks for consent before sharing anything. Planora stores only a verification receipt.</p></main></body></html>`,
    );
});

app.listen(port, () =>
  console.log(`Planora identity service listening on port ${port}`),
);
