export type IdentityVerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed';

export interface IdentityVerification {
    id: string;
    verificationStatus: IdentityVerificationStatus;
    remoteSessionId?: string;
    credentialType?: string;
    issuer?: string;
    verifiedAt?: string;
    updatedAt: string;
}

export interface VerificationSession {
    sessionId: string;
    verificationUrl: string;
}
