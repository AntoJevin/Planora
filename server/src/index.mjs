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
const SESSION_TTL_MS = 10 * 60 * 1000;
const sessions = new Map();
let tokenSession;

class CredenceRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "CredenceRequestError";
    this.status = status;
  }
}

const app = express();
app.use(express.json());

const isConfigured = () => requiredConfig.every((key) => Boolean(config[key]));

const credenceRequest = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new CredenceRequestError(
      body.error || `Credence request failed (${response.status}).`,
      response.status,
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

const getSession = (id) => {
  const session = sessions.get(id);
  if (session && Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(id);
    return undefined;
  }
  return session;
};

const getSafeStatusError = (error) => {
  if (!(error instanceof CredenceRequestError))
    return { error: "Unable to read verification status.", code: "UPSTREAM_ERROR" };
  if (error.status === 401 || error.status === 403)
    return {
      error: "The identity service configuration needs attention. Please contact Planora support.",
      code: "CREDENCE_CONFIGURATION",
    };
  if (error.status === 404)
    return {
      error: "The verification request expired. Start a new request in Planora.",
      code: "SESSION_EXPIRED",
    };
  if (error.status === 429)
    return {
      error: "The identity service is busy. Please try again shortly.",
      code: "RATE_LIMITED",
    };
  return { error: "Unable to read verification status.", code: "UPSTREAM_ERROR" };
};

app.post("/api/identity/sessions", async (_request, response) => {
  if (!isConfigured())
    return response
      .status(503)
      .json({ error: "Identity service is not configured." });
  try {
    const accessToken = await getAccessToken();
    const { body } = await credenceRequest("/v1/getDocRequest", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Origin: config.PUBLIC_ORIGIN,
      },
    });
    if (
      typeof body.sessionId !== "string" ||
      typeof body.dcRequest?.deviceRequest !== "string"
    ) {
      throw new Error("Credence returned an invalid Apple Wallet request.");
    }
    const id = crypto.randomUUID();
    sessions.set(id, {
      credenceSessionId: body.sessionId,
      deviceRequest: body.dcRequest.deviceRequest,
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
  return response.json(session.result || { status: "pending" });
});

app.post("/api/identity/sessions/:id/present", async (request, response) => {
  const session = getSession(request.params.id);
  if (!session)
    return response
      .status(404)
      .json({ error: "Verification session not found or expired." });
  if (session.result) return response.json(session.result);

  const { data } = request.body || {};
  if (typeof data !== "string" || data.length === 0 || data.length > 100_000)
    return response.status(400).json({ error: "Invalid wallet response." });

  try {
    const accessToken = await getAccessToken();
    const { body } = await credenceRequest("/v1/verifyDocRequest", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Origin: config.PUBLIC_ORIGIN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId: session.credenceSessionId, data }),
    });
    if (!body.res) {
      session.result = { status: "failed" };
      return response.json(session.result);
    }

    let identity = {};
    try {
      identity = JSON.parse(body.resDetails || "{}");
    } catch {
      identity = {};
    }
    session.result = {
      status: "verified",
      credentialType: "Mobile driver license",
      issuer:
        identity.issuer || identity.issuing_authority || "Verified issuer",
      verifiedAt: new Date().toISOString(),
    };
    return response.json(session.result);
  } catch (error) {
    console.error("Could not verify wallet response:", error.message);
    const safeError = getSafeStatusError(error);
    return response
      .status(error instanceof CredenceRequestError ? error.status : 502)
      .json(safeError);
  }
});

app.get("/verify/:id", async (request, response) => {
  const session = getSession(request.params.id);
  if (!session)
    return response
      .status(404)
      .send("Verification session not found or expired. Start a new request in Planora.");
  const verificationUrl = `${config.PUBLIC_ORIGIN}/verify/${request.params.id}`;
  const qrCode = await QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 320,
  });
  const sessionId = JSON.stringify(request.params.id).replace(/</g, "\\u003c");
  const deviceRequest = JSON.stringify(session.deviceRequest).replace(/</g, "\\u003c");
  response
    .set(
      "Content-Security-Policy",
      "default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'",
    )
    .type("html")
    .send(
      `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verify Planora profile</title><style>body{font-family:system-ui,sans-serif;background:#f8fafc;color:#111827;margin:0;padding:32px;text-align:center}.card{max-width:420px;margin:auto;background:#fff;border-radius:20px;padding:28px;box-shadow:0 8px 30px #0001}img{width:100%;max-width:320px}button{width:100%;border:0;background:#6366f1;color:#fff;padding:14px;border-radius:12px;font-size:16px;font-weight:700;margin-top:20px}button:disabled{background:#9ca3af}p{color:#4b5563;line-height:1.5}.notice{background:#eff6ff;border-radius:12px;color:#1e3a8a;font-size:14px;padding:12px;text-align:left}</style></head><body><main class="card"><h1>Verify your Planora profile</h1><p>On your iPhone, scan this QR code with Camera. It opens this secure page in Safari, where Apple Wallet can ask for consent.</p><img src="${qrCode}" alt="QR code that opens the Apple Wallet verification page"><button id="verify" disabled>Verify with Apple Wallet</button><p id="message" class="notice">Open this page in Safari on an iPhone with a mobile driver’s license in Apple Wallet.</p><p>Planora receives only a verification receipt, not your identity document.</p></main><script>const sessionId=${sessionId};const deviceRequest=${deviceRequest};const button=document.getElementById('verify');const message=document.getElementById('message');if(navigator.credentials&&navigator.credentials.get){button.disabled=false;message.textContent='Ready to request your mobile driver’s license.'}button.addEventListener('click',async()=>{button.disabled=true;message.textContent='Opening Apple Wallet…';try{const credential=await navigator.credentials.get({digital:{requests:[{protocol:'org-iso-mdoc',data:deviceRequest}]},mediation:'required'});if(!credential||typeof credential.data!=='string')throw new Error('Apple Wallet did not return a credential.');message.textContent='Verifying your consented credential…';const result=await fetch('/api/identity/sessions/'+encodeURIComponent(sessionId)+'/present',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:credential.data})});const body=await result.json();if(!result.ok)throw new Error(body.error||'Unable to verify your credential.');message.textContent=body.status==='verified'?'Verified. You can return to Planora.':'Verification was not completed. You can return to Planora.'}catch(error){message.textContent=error instanceof Error?error.message:'Unable to start Apple Wallet verification.';button.disabled=false}})</script></body></html>`,
    );
});

app.listen(port, () =>
  console.log(`Planora identity service listening on port ${port}`),
);
