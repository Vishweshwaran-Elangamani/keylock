import axios from "axios";
import api from "./api";

/* ================================
   CONFIG (KEYCLOAK)
================================ */
const KEYCLOAK_URL =
  import.meta.env.VITE_KEYCLOAK_URL ||
  "http://localhost:9090/realms/eepz-realm/protocol/openid-connect/token";

const CLIENT_ID =
  import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "eepz-client";

/* ================================
   JWT DECODE (UNCHANGED)
================================ */
const decodeJwt = (token) => {
  try {
    if (!token) return null;

    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

/* ================================
   CLAIMS (RESTORED EXACTLY)
================================ */
const getClaimsFromToken = (token) => {
  const decoded = decodeJwt(token);
  if (!decoded) return null;

  return {
    userId: decoded.sub,
    email: decoded.email,
    empMasterId: decoded.empMasterId
      ? parseInt(decoded.empMasterId)
      : null,

    // 🔥 IMPORTANT: use role directly from token
    role: decoded.role,

    jti: decoded.jti,
    iat: decoded.iat,
    exp: decoded.exp,
    iss: decoded.iss,
    aud: decoded.aud,
  };
};

/* ================================
   BUILD USER (ONLY REQUIRED FIX)
================================ */
const buildUserFromToken = (token) => {
  const decoded = decodeJwt(token);
  if (!decoded) return null;

  let role = decoded.role;

  // ✅ ONLY mapping needed for backend compatibility
  if (role === "SuperAdmin") role = "Admin";

  return {
    email: decoded.email,
    name: decoded.name || decoded.preferred_username,

    role: role,
    roleName: role,

    empId: decoded.empId || decoded.empID || "0",
    empMasterId: decoded.empMasterId || "0",
  };
};

/* ================================
   AUTH SERVICE
================================ */
const authService = {
  /* 🔐 LOGIN (KEYCLOAK ONLY CHANGE) */
  login: async (email, password) => {
    try {
      const params = new URLSearchParams();
      params.append("grant_type", "password");
      params.append("client_id", CLIENT_ID);
      params.append("username", email);
      params.append("password", password);

      const response = await axios.post(KEYCLOAK_URL, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const data = response.data;

      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;

      const user = buildUserFromToken(accessToken);

      authService.saveAuthData(user, accessToken, refreshToken);

      return {
        success: true,
        data: {
          user,
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      console.error("Login error:", error);

      const errorMessage =
        error.response?.data?.error_description ||
        error.response?.data?.error ||
        error.message;

      throw new Error(errorMessage);
    }
  },

  /* 🔄 REFRESH (KEYCLOAK CHANGE) */
  refreshAccessToken: async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      const params = new URLSearchParams();
      params.append("grant_type", "refresh_token");
      params.append("client_id", CLIENT_ID);
      params.append("refresh_token", refreshToken);

      const response = await axios.post(KEYCLOAK_URL, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const data = response.data;

      const accessToken = data.access_token;
      const newRefreshToken = data.refresh_token;

      const tokenClaims = getClaimsFromToken(accessToken);
      const currentUser = authService.getCurrentUser();

      if (currentUser && tokenClaims) {
        const updatedUser = {
          ...currentUser,
          empMasterId: tokenClaims.empMasterId,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("token", accessToken);

      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }

      return { success: true };
    } catch (error) {
      console.error("Token refresh error:", error);
      authService.clearAuthData();
      throw new Error("Session expired");
    }
  },

  /* 🔓 LOGOUT (UNCHANGED) */
  logout: async () => {
    authService.clearAuthData();
  },

  /* ================================
     STORAGE (UNCHANGED)
  ================================ */
  saveAuthData: (userData, accessToken, refreshToken) => {
    try {
      const tokenClaims = getClaimsFromToken(accessToken);

      const enrichedUserData = {
        ...userData,
        empMasterId: tokenClaims?.empMasterId,
      };

      localStorage.setItem("user", JSON.stringify(enrichedUserData));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("token", accessToken); // 🔥 IMPORTANT OLD SUPPORT
      localStorage.setItem("refreshToken", refreshToken);
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  },

  clearAuthData: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
  },

  /* ================================
     HELPERS (FULLY RESTORED)
  ================================ */
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getToken: () => localStorage.getItem("accessToken"),

  getRefreshToken: () => localStorage.getItem("refreshToken"),

  getClaims: () => {
    const token = authService.getToken();
    if (!token) return null;
    return getClaimsFromToken(token);
  },

  getEmpMasterId: () => {
    const claims = authService.getClaims();
    return claims?.empMasterId || null;
  },

  isAuthenticated: () => {
    return !!(
      localStorage.getItem("accessToken") &&
      localStorage.getItem("user")
    );
  },

  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user?.roleName === role;
  },

  isAdmin: () => authService.hasRole("Admin"),
  isManager: () => authService.hasRole("Manager"),
};

export default authService;