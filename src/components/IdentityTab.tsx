import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSettings } from "../context/SettingsContext";
import {
  IdentityVerificationRequestError,
  IdentityVerificationService,
} from "../services/IdentityVerificationService";
import { darkColors } from "../theme/darkTheme";
import { IdentityVerification } from "../types/identityVerification";

const POLL_INTERVAL_MS = 2500;

export default function IdentityTab() {
  const { darkMode } = useSettings();
  const colors = darkMode
    ? darkColors
    : {
        background: "#f8fafc",
        surface: "#ffffff",
        primary: "#6366f1",
        text: "#111827",
        subtext: "#6b7280",
        border: "#e5e7eb",
      };
  const [verification, setVerification] = useState<IdentityVerification | null>(
    null,
  );
  const [isStarting, setIsStarting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const loadVerification = useCallback(async () => {
    setVerification(await IdentityVerificationService.getVerification());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadVerification().catch(() => undefined);
    }, [loadVerification]),
  );

  const checkVerification = useCallback(
    async (showError = false) => {
      if (
        !verification?.remoteSessionId ||
        verification.verificationStatus !== "pending"
      )
        return;
      setIsChecking(true);
      try {
        const result = await IdentityVerificationService.getRemoteStatus(
          verification.remoteSessionId,
        );
        if (result.status !== "pending") {
          await IdentityVerificationService.saveVerification({
            verificationStatus: result.status,
            remoteSessionId: verification.remoteSessionId,
            credentialType: result.credentialType,
            issuer: result.issuer,
            verifiedAt: result.verifiedAt,
            updatedAt: new Date().toISOString(),
          });
          await loadVerification();
        }
      } catch (error) {
        if (
          error instanceof IdentityVerificationRequestError &&
          error.status === 404
        ) {
          await IdentityVerificationService.saveVerification({
            verificationStatus: "failed",
            remoteSessionId: verification.remoteSessionId,
            updatedAt: new Date().toISOString(),
          });
          await loadVerification();
          return;
        }
        console.error("Unable to check verification status:", error);
        if (showError) {
          Alert.alert(
            "Unable to verify status",
            error instanceof Error
              ? error.message
              : "Please try again shortly.",
          );
        }
      } finally {
        setIsChecking(false);
      }
    },
    [loadVerification, verification],
  );

  useEffect(() => {
    if (verification?.verificationStatus !== "pending") return;
    const timer = setInterval(() => checkVerification(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [checkVerification, verification?.verificationStatus]);

  const startVerification = async () => {
    if (!IdentityVerificationService.isConfigured()) {
      Alert.alert(
        "Setup required",
        "This build needs the secure verification service URL before it can start a Credence ID verification.",
      );
      return;
    }

    setIsStarting(true);
    try {
      const session = await IdentityVerificationService.startVerification();
      await IdentityVerificationService.saveVerification({
        verificationStatus: "pending",
        remoteSessionId: session.sessionId,
        updatedAt: new Date().toISOString(),
      });
      await loadVerification();
      await WebBrowser.openBrowserAsync(session.verificationUrl);
      await checkVerification();
    } catch (error) {
      Alert.alert(
        "Verification unavailable",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsStarting(false);
    }
  };

  const status = verification?.verificationStatus || "unverified";
  const isVerified = status === "verified";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Ionicons name="shield-checkmark-outline" size={26} color="white" />
        <View>
          <Text style={styles.headerTitle}>Verified Profile</Text>
          <Text style={styles.headerSubtitle}>
            Digital ID verification powered by Credence ID
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.surface,
              borderColor: isVerified ? "#86efac" : colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: isVerified ? "#dcfce7" : "#eef2ff" },
            ]}
          >
            <Ionicons
              name={isVerified ? "checkmark-circle" : "shield-outline"}
              size={42}
              color={isVerified ? "#16a34a" : colors.primary}
            />
          </View>
          <Text style={[styles.statusTitle, { color: colors.text }]}>
            {isVerified
              ? "Identity verified"
              : status === "pending"
                ? "Verification in progress"
                : "Verify your identity"}
          </Text>
          <Text style={[styles.statusMessage, { color: colors.subtext }]}>
            {isVerified
              ? `Verified ${verification?.verifiedAt ? new Date(verification.verifiedAt).toLocaleDateString() : "recently"}.`
              : status === "pending"
                ? "Finish the request in your digital wallet. This screen will update automatically."
                : status === "failed"
                  ? "That verification session expired. Start a new request to try again."
                  : "Use a digital ID from a supported wallet to verify access to sensitive account features."}
          </Text>
          {isVerified && (
            <View style={styles.receipt}>
              <Text style={[styles.receiptText, { color: colors.subtext }]}>
                Credential: {verification?.credentialType || "Digital ID"}
              </Text>
              <Text style={[styles.receiptText, { color: colors.subtext }]}>
                Issuer: {verification?.issuer || "Verified issuer"}
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={22}
            color={colors.primary}
          />
          <View style={styles.infoCopy}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Privacy by design
            </Text>
            <Text style={[styles.infoBody, { color: colors.subtext }]}>
              Planora stores only your verification status, credential type,
              issuer, and timestamp—not your license image or raw identity
              claims.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary },
            (isStarting || status === "pending") && styles.disabledButton,
          ]}
          onPress={startVerification}
          disabled={isStarting || status === "pending"}
        >
          {isStarting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="qr-code-outline" size={21} color="white" />
          )}
          <Text style={styles.primaryButtonText}>
            {isStarting
              ? "Preparing secure request…"
              : isVerified
                ? "Verify again"
                : "Verify with digital ID"}
          </Text>
        </TouchableOpacity>

        {status === "pending" && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => checkVerification(true)}
            disabled={isChecking}
          >
            <Ionicons name="refresh-outline" size={19} color={colors.primary} />
            <Text
              style={[styles.secondaryButtonText, { color: colors.primary }]}
            >
              {isChecking ? "Checking…" : "Check verification status"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 58,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "700" },
  headerSubtitle: { color: "#e0e7ff", fontSize: 12, marginTop: 2 },
  content: { padding: 20, gap: 16 },
  statusCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  statusIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statusTitle: { fontSize: 21, fontWeight: "700", textAlign: "center" },
  statusMessage: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },
  receipt: { marginTop: 16, width: "100%", gap: 4 },
  receiptText: { fontSize: 13, textAlign: "center" },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  infoCopy: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  infoBody: { fontSize: 13, lineHeight: 19 },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    minHeight: 48,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "600" },
  disabledButton: { opacity: 0.55 },
});
