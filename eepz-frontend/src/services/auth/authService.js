import axios from "axios";
import api from "./api";

// ── Base URLs ────────────────────────────────────────────────────────────────
const KEYCLOAK_BASE =
  import.meta.env.VITE_KEYCLOAK_BASE_URL ||
  "http://localhost:9090";

const KEYCLOAK_REALM =
  import.meta.env.VITE_KEYCLOAK_REALM || "eepz-realm";

const KEYCLOAK_CLIENT_ID =
  import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "eepz-client";

// Derived URLs — single source of truth
const KEYCLOAK_TOKEN_URL = `${KEYCLOAK_BASE}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
const KEYCLOAK_LOGOUT_URL = `${KEYCLOAK_BASE}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;

// ── System roles to strip from JWT ──────────────────────────────────────────
const SYSTEM_ROLES = new Set([
  "offline_access",
  "uma_authorization",
  "default-roles-" + KEYCLOAK_REALM,
]);

const isSystemRole = (r) =>
  SYSTEM_ROLES.has(r) || r.startsWith("default-");

const authService = {

  // ── 🔐 LOGIN ──────────────────────────────────────────────────────────────
  // Authenticates via Keycloak password grant.
  // After admin creates a user, Keycloak sends them a "Set your password" email.
  // The user sets their password on Keycloak's hosted page, then logs in here normally.
  keycloakLogin: async (email, password) => {
    try {
      console.log("🔐 LOGIN STARTED");

      const params = new URLSearchParams();
      params.append("grant_type", "password");
      params.append("client_id", KEYCLOAK_CLIENT_ID);
      params.append("username", email);
      params.append("password", password);

      const response = await axios.post(KEYCLOAK_TOKEN_URL, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      console.log("✅ TOKEN RESPONSE:", response.data);

      const accessToken  = response.data.access_token;
      const refreshToken = response.data.refresh_token;
      const expiresIn    = response.data.expires_in; // seconds

      // ── Store tokens ──────────────────────────────────────────────────────
      localStorage.setItem("accessToken",  accessToken);
      localStorage.setItem("token",        accessToken);   // legacy key kept for compatibility
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem(
        "tokenExpiry",
        String(Date.now() + expiresIn * 1000)
      );

      // ── Decode JWT ────────────────────────────────────────────────────────
      const decoded = authService.decodeToken(accessToken);
      console.log("🔍 DECODED TOKEN:", decoded);

      // ── Role extraction ───────────────────────────────────────────────────
      const allRoles = decoded?.realm_access?.roles || [];
      console.log("🔥 ALL ROLES FROM TOKEN:", allRoles);

      const businessRoles = allRoles.filter((r) => !isSystemRole(r));
      console.log("🔥 BUSINESS ROLES:", businessRoles);

      let role = businessRoles[0] || "Employee";
      console.log("🔥 ROLE BEFORE MAPPING:", role);

      // ── Role mapping to UI labels ─────────────────────────────────────────
      const ROLE_MAP = {
        SuperAdmin:      "Admin",
        DepartmentHead:  "DepartmentHead",
        HR:              "HR",
        Manager:         "Manager",
        Leadership:      "Leadership",
        Employee:        "Employee",
      };
      role = ROLE_MAP[role] ?? role;
      console.log("🔥 FINAL ROLE AFTER MAPPING:", role);

      // ── Build user object from JWT claims ─────────────────────────────────
      const user = {
        email:       decoded?.email,
        name:
          decoded?.name ||
          `${decoded?.given_name || ""} ${decoded?.family_name || ""}`.trim() ||
          decoded?.preferred_username,
        role:        role,
        roleName:    role,
        empId:       decoded?.empId,
        empMasterId: decoded?.empMasterId,
      };

      console.log("👤 FINAL USER OBJECT:", user);

      // ── Persist user in localStorage ──────────────────────────────────────
      localStorage.setItem("user", JSON.stringify(user));

      return {
        success: true,
        data: { accessToken, refreshToken, user },
      };

    } catch (error) {
      console.error("🔴 Keycloak Login Error:", error.response?.data || error.message);

      const err = error.response?.data;

      // Keycloak returns error codes we can map to user-friendly messages
      const KC_ERROR_MESSAGES = {
        invalid_grant:    "Invalid email or password.",
        account_disabled: "Account disabled. Contact your administrator.",
        // New user who has not yet set a password via the Keycloak email link
        // will receive invalid_grant — guide them accordingly
      };

      const message =
        KC_ERROR_MESSAGES[err?.error] ||
        err?.error_description ||
        "Authentication failed. Please try again.";

      return { success: false, message };
    }
  },

  // ── 🔄 SILENT TOKEN REFRESH ───────────────────────────────────────────────
  // Call this before any API request when tokenExpiry is near.
  refreshAccessToken: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    try {
      const params = new URLSearchParams();
      params.append("grant_type",    "refresh_token");
      params.append("client_id",     KEYCLOAK_CLIENT_ID);
      params.append("refresh_token", refreshToken);

      const response = await axios.post(KEYCLOAK_TOKEN_URL, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token, refresh_token, expires_in } = response.data;

      localStorage.setItem("accessToken",  access_token);
      localStorage.setItem("token",        access_token);
      localStorage.setItem("refreshToken", refresh_token);
      localStorage.setItem("tokenExpiry",  String(Date.now() + expires_in * 1000));

      console.log("🔄 Token refreshed silently.");
      return access_token;
    } catch (err) {
      console.warn("🔴 Token refresh failed — logging out.", err.message);
      authService.clearSession();
      return null;
    }
  },

  // ── 🔓 LOGOUT ─────────────────────────────────────────────────────────────
  // Notifies backend (to record LastLoginAt), then revokes the Keycloak session.
  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    // 1. Notify our backend
    try {
      await api.post("/Authentication/logout");
    } catch (error) {
      console.warn("Backend logout API failed:", error.message);
    }

    // 2. Revoke Keycloak session (invalidates refresh token server-side)
    if (refreshToken) {
      try {
        const params = new URLSearchParams();
        params.append("client_id",     KEYCLOAK_CLIENT_ID);
        params.append("refresh_token", refreshToken);

        await axios.post(KEYCLOAK_LOGOUT_URL, params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        console.log("✅ Keycloak session revoked.");
      } catch (err) {
        console.warn("Keycloak logout endpoint failed:", err.message);
      }
    }

    // 3. Clear all local state
    authService.clearSession();
  },

  // ── 🧹 CLEAR SESSION ──────────────────────────────────────────────────────
  clearSession: () => {
    localStorage.clear();
  },

  // ── 🔍 DECODE JWT ─────────────────────────────────────────────────────────
  decodeToken: (token) => {
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      const base64    = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const json      = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(json);
    } catch (err) {
      console.error("❌ TOKEN DECODE ERROR:", err);
      return null;
    }
  },

  // ── ⏱️ IS TOKEN EXPIRED ───────────────────────────────────────────────────
  isTokenExpired: () => {
    const expiry = localStorage.getItem("tokenExpiry");
    if (!expiry) return true;
    // treat as expired 30 seconds before actual expiry to avoid race conditions
    return Date.now() > parseInt(expiry, 10) - 30_000;
  },

  // ── 🔑 FORGOT PASSWORD ────────────────────────────────────────────────────
  // Triggers Keycloak to re-send the "Set your password" email to the user.
  // Points to your backend which calls Keycloak execute-actions-email internally.
  forgotPassword: async (email) => {
    try {
      const response = await api.post("/Authentication/forgot-password", { email });
      return response.data;
    } catch (error) {
      console.error("forgotPassword error:", error.response?.data || error.message);
      throw error;
    }
  },

  // ── 🔁 CHANGE PASSWORD (logged-in user) ──────────────────────────────────
  // Calls your backend which calls Keycloak ResetPasswordAsync.
  // This replaces the old resetPassword(email, otp, newPassword) flow entirely.
  changePassword: async (newPassword) => {
    try {
      const response = await api.post("/Authentication/change-password", { newPassword });
      return response.data;
    } catch (error) {
      console.error("changePassword error:", error.response?.data || error.message);
      throw error;
    }
  },

  // ── LEGACY METHODS KEPT FOR BACKWARD COMPATIBILITY ────────────────────────
  // These are no-ops or redirects now that OTP flow is removed from new-user setup.
  // Keep them so any page still importing them does not break at runtime.

  // 🔁 Reset Password — legacy OTP flow (still used for forgot-password reset if kept)
  resetPassword: async (email, otp, newPassword) => {
    try {
      const response = await api.post("/Authentication/reset-password", {
        email,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("resetPassword error:", error.response?.data || error.message);
      throw error;
    }
  },

  // 🔐 OTP Verification — legacy (kept for forgot-password OTP flow if still in use)
  verifyOtp: async (email, otp) => {
    try {
      const response = await api.post("/Authentication/verify-otp", { email, otp });
      return response.data;
    } catch (error) {
      console.error("verifyOtp error:", error.response?.data || error.message);
      throw error;
    }
  },

  // 🔐 First Login OTP — DEPRECATED
  // New users now set their password directly via the Keycloak email link.
  // This method is kept only so existing component imports do not break.
  // You can safely delete it once all pages referencing it are updated.
  verifyFirstLoginOtp: async (_email, _otp) => {
    console.warn(
      "⚠️ verifyFirstLoginOtp is deprecated. " +
      "New users set their password via the Keycloak email link. " +
      "This call is a no-op."
    );
    return { success: false, message: "OTP login is no longer used. Please use the Keycloak email link." };
  },
};

export default authService;
