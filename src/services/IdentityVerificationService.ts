import { getDB } from "../database/db";
import {
  IdentityVerification,
  VerificationSession,
} from "../types/identityVerification";

const PRIMARY_VERIFICATION_ID = "primary_identity";

const apiBaseUrl = (
  process.env.EXPO_PUBLIC_IDENTITY_API_BASE_URL ||
  "https://planora-592z.onrender.com"
).replace(/\/$/, "");

export class IdentityVerificationRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "IdentityVerificationRequestError";
  }
}

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  if (!apiBaseUrl) {
    throw new Error("Identity verification has not been configured.");
  }

  const { headers, ...requestOptions } = options || {};
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(headers as Record<string, string> | undefined),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new IdentityVerificationRequestError(
      data.error || "Unable to contact the identity verification service.",
      response.status,
    );
  }

  return data as T;
};

export const IdentityVerificationService = {
  isConfigured: () => Boolean(apiBaseUrl),

  getVerification: async (): Promise<IdentityVerification | null> => {
    const db = await getDB();
    const result = await db.getAllAsync(
      "SELECT * FROM identity_verifications WHERE id = ?",
      [PRIMARY_VERIFICATION_ID],
    );
    return result.length ? (result[0] as IdentityVerification) : null;
  },

  saveVerification: async (
    verification: Omit<IdentityVerification, "id">,
  ): Promise<void> => {
    const db = await getDB();
    await db.runAsync(
      `INSERT OR REPLACE INTO identity_verifications
            (id, verificationStatus, remoteSessionId, credentialType, issuer, verifiedAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        PRIMARY_VERIFICATION_ID,
        verification.verificationStatus,
        verification.remoteSessionId || "",
        verification.credentialType || "",
        verification.issuer || "",
        verification.verifiedAt || "",
        verification.updatedAt,
      ],
    );
  },

  startVerification: async (): Promise<VerificationSession> =>
    request<VerificationSession>("/api/identity/sessions", { method: "POST" }),

  getRemoteStatus: async (
    sessionId: string,
  ): Promise<{
    status: "pending" | "verified" | "failed";
    credentialType?: string;
    issuer?: string;
    verifiedAt?: string;
  }> => request(`/api/identity/sessions/${encodeURIComponent(sessionId)}`),
};
