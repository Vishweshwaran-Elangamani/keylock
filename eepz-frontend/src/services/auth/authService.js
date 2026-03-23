import axios from "axios";
import api from "./api";

// Base URLs
const KEYCLOAK_URL =
  import.meta.env.VITE_KEYCLOAK_URL ||
  "http://localhost:9090/realms/eepz-realm/protocol/openid-connect/token";

// Keycloak Client
const KEYCLOAK_CLIENT_ID =
  import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "eepz-client";

const KEYCLOAK_CLIENT_SECRET =
  import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET ||
  "nVKEcEhW5ppki0byRKiA1pk8vgB7ZRMb";

const authService = {
  // 🔐 LOGIN
  keycloakLogin: async (email, password) => {
    try {
      console.log("🚀 LOGIN STARTED");

      const params = new URLSearchParams();
      params.append("grant_type", "password");
      params.append("client_id", KEYCLOAK_CLIENT_ID);
      params.append("client_secret", KEYCLOAK_CLIENT_SECRET);
      params.append("username", email);
      params.append("password", password);

      const response = await axios.post(KEYCLOAK_URL, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      console.log("✅ TOKEN RESPONSE:", response.data);

      const accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;

      // ✅ Store tokens
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // 🔍 Decode token
      const decoded = authService.decodeToken(accessToken);

      console.log("🔍 DECODED TOKEN:", decoded);

      // 🔥 ROLE EXTRACTION
      const roles = decoded?.realm_access?.roles || [];

      console.log("🔥 ALL ROLES FROM TOKEN:", roles);

      // ❌ REMOVE SYSTEM ROLES
      const businessRoles = roles.filter(
        (r) =>
          !r.startsWith("default-") &&
          r !== "offline_access" &&
          r !== "uma_authorization"
      );

      console.log("🔥 BUSINESS ROLES:", businessRoles);

      // ✅ PICK ROLE
      let role = businessRoles[0] || "Employee";

      console.log("🔥 ROLE BEFORE MAPPING:", role);

      // 🔁 MAP TO UI ROLE
      if (role === "SuperAdmin") role = "Admin";
      if (role === "DepartmentHead") role = "DepartmentHead";

      console.log("🔥 FINAL ROLE AFTER MAPPING:", role);

      // 🧾 USER OBJECT
      const user = {
        email: decoded?.email,
        name:
          decoded?.name ||
          `${decoded?.given_name || ""} ${decoded?.family_name || ""}`.trim() ||
          decoded?.preferred_username,
        role: role,
        roleName: role,
        empId: decoded?.empId,
        empMasterId: decoded?.empMasterId,
      };

      console.log("👤 FINAL USER OBJECT:", user);

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          user,
        },
      };
    } catch (error) {
      console.error(
        "🔴 Keycloak Login Error:",
        error.response?.data || error.message
      );

      const err = error.response?.data;

      if (err?.error === "invalid_grant") {
        return {
          success: false,
          message: "Invalid email or password.",
        };
      }

      if (err?.error === "account_disabled") {
        return {
          success: false,
          message: "Account disabled. Contact admin.",
        };
      }

      return {
        success: false,
        message: "Authentication failed.",
      };
    }
  },

  // 🔓 LOGOUT
  logout: async () => {
    try {
      await api.post("/Authentication/logout");
    } catch (error) {
      console.warn("Logout API failed:", error.message);
    } finally {
      localStorage.clear();
    }
  },

  // 🔍 Decode JWT
  decodeToken: (token) => {
    if (!token) return null;

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(
            (c) =>
              "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
          )
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error("❌ TOKEN DECODE ERROR:", err);
      return null;
    }
  },

  // 🔑 Forgot Password
  forgotPassword: async (email) => {
    const response = await api.post("/Authentication/forgot-password", { email });
    return response.data;
  },

  // 🔁 Reset Password
  resetPassword: async (email, otp, newPassword) => {
    const response = await api.post("/Authentication/reset-password", {
      email,
      otp,
      newPassword,
    });
    return response.data;
  },

  // 🔐 OTP Verification
  verifyOtp: async (email, otp) => {
    const response = await api.post("/Authentication/verify-otp", {
      email,
      otp,
    });
    return response.data;
  },

  // 🔐 First Login OTP
  verifyFirstLoginOtp: async (email, otp) => {
    const response = await api.post(
      "/Authentication/verify-first-login-otp",
      { email, otp }
    );
    return response.data;
  },
};

export default authService;