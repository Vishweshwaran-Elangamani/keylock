import api from "../api";

// JWT HELPER FUNCTIONS
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

const getClaimsFromToken = (token) => {
  const decoded = decodeJwt(token);
  if (!decoded) return null;

  return {
    userId: decoded.sub,
    email: decoded.email,
    empMasterId: decoded.empMasterId ? parseInt(decoded.empMasterId) : null,
    role: decoded[
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ],
    jti: decoded.jti,
    iat: decoded.iat,
    exp: decoded.exp,
    iss: decoded.iss,
    aud: decoded.aud,
  };
};

const authService = {
  login: async (email, password) => {
    try {
      console.log("Login attempt:", email);

      const response = await api.post("/Authentication/login", {
        email,
        password,
        ipAddress: null,
        userAgent: navigator.userAgent,
      });

      console.log("Login API response:", response.data);
      const result = response.data;

      if (result.success && result.data.requiresTwoFactor) {
        console.log("2FA Required for Admin");
        return result;
      }

      if (result.success && result.data.requiresPasswordReset) {
        console.log("Password Reset Required");
        return result;
      }

      if (result.success && result.data.accessToken) {
        authService.saveAuthData(
          result.data.user,
          result.data.accessToken,
          result.data.refreshToken
        );
        console.log("Login successful - Tokens saved");
      }

      return result;
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await api.post("/Authentication/logout");
      authService.clearAuthData();
      console.log("Logout successful");
      return response.data;
    } catch (error) {
      console.error("Logout error:", error);
      authService.clearAuthData();
      throw error.response?.data || error;
    }
  },

  verifyOtp: async (email, otpCode) => {
    try {
      console.log("Verifying 2FA OTP...");
      const response = await api.post("/Authentication/verify-otp", {
        email: email,
        otpCode: otpCode,
        otpType: "Login2FA",
      });

      const result = response.data;

      if (result.success && result.data.accessToken) {
        authService.saveAuthData(
          result.data.user,
          result.data.accessToken,
          result.data.refreshToken
        );
        console.log("2FA OTP verified - Tokens saved");
      }

      return result;
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error.response?.data || error;
    }
  },

  verifyFirstLoginOtp: async (email, otpCode) => {
    try {
      console.log("Verifying First Login OTP...");
      const response = await api.post("/Authentication/verify-otp", {
        email: email,
        otpCode: otpCode,
        otpType: "ForgotPassword",
      });

      console.log("First login OTP verified");
      return response.data;
    } catch (error) {
      console.error("First login OTP verification error:", error);
      throw error.response?.data || error;
    }
  },

  verifyResetOtp: async (email, otpCode) => {
    try {
      console.log("Verifying Reset OTP...");
      const response = await api.post("/Authentication/verify-otp", {
        email: email,
        otpCode: otpCode,
        otpType: "ForgotPassword",
      });

      console.log("Reset OTP verified");
      return response.data;
    } catch (error) {
      console.error("Reset OTP verification error:", error);
      throw error.response?.data || error;
    }
  },

  resendOtp: async (email, otpType) => {
    try {
      console.log(`Resending OTP (${otpType})...`);
      const response = await api.post("/Authentication/resend-otp", {
        email: email,
        otpType: otpType,
      });

      console.log("OTP resent successfully");
      return response.data;
    } catch (error) {
      console.error("Resend OTP error:", error);
      throw error.response?.data || error;
    }
  },

  forgotPassword: async (email) => {
    try {
      console.log("Sending forgot password OTP...");
      const response = await api.post("/Authentication/forgot-password", {
        email: email,
      });

      console.log("Forgot password OTP sent");
      return response.data;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error.response?.data || error;
    }
  },

  resetPassword: async (email, otpCode, newPassword, confirmPassword) => {
    try {
      console.log("Resetting password...");
      console.log("Email:", email);
      console.log("OTP:", otpCode);
      console.log("New Password Length:", newPassword?.length);
      console.log("Confirm Password Length:", confirmPassword?.length);

      const response = await api.post("/Authentication/reset-password", {
        email: email,
        otpCode: otpCode,
        newPassword: newPassword,
        confirmPassword: confirmPassword || newPassword,
      });

      console.log("Password reset successful");
      console.log("Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Reset password error:", error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      console.log("Changing password...");
      const response = await api.post("/Authentication/change-password", {
        currentPassword: currentPassword || "",
        newPassword: newPassword,
      });

      console.log("Password changed successfully");
      return response.data;
    } catch (error) {
      console.error("Change password error:", error);
      throw error.response?.data || error;
    }
  },

  refreshAccessToken: async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        console.error("No refresh token available");
        throw new Error("No refresh token available");
      }

      console.log("Refreshing access token...");
      const response = await api.post("/Authentication/refresh-token", {
        refreshToken: refreshToken,
      });

      const result = response.data;

      if (result.success && result.data.accessToken) {
        // GET CLAIMS FROM NEW TOKEN AND UPDATE USER
        const tokenClaims = getClaimsFromToken(result.data.accessToken);
        const currentUser = authService.getCurrentUser();

        if (currentUser && tokenClaims) {
          const updatedUser = {
            ...currentUser,
            empMasterId: tokenClaims.empMasterId,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }

        localStorage.setItem("accessToken", result.data.accessToken);
        if (result.data.refreshToken) {
          localStorage.setItem("refreshToken", result.data.refreshToken);
        }
        console.log(
          "Token refreshed successfully with empMasterId:",
          tokenClaims?.empMasterId
        );
      }

      return result;
    } catch (error) {
      console.error("Token refresh error:", error);
      authService.clearAuthData();
      throw error;
    }
  },

  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem("accessToken");
  },

  getRefreshToken: () => {
    return localStorage.getItem("refreshToken");
  },

  // NEW: GET ALL CLAIMS FROM TOKEN
  getClaims: () => {
    const token = authService.getToken();
    if (!token) return null;

    return getClaimsFromToken(token);
  },

  // NEW: GET empMasterId FROM TOKEN CLAIMS
  getEmpMasterId: () => {
    const claims = authService.getClaims();
    return claims?.empMasterId || null;
  },

  isAuthenticated: () => {
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    return !!(token && user);
  },

  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user?.roleName === role;
  },

  isAdmin: () => {
    return authService.hasRole("Admin");
  },

  isManager: () => {
    return authService.hasRole("Manager");
  },

  clearAuthData: () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("token"); // Remove duplicate token key
      localStorage.removeItem("tempUser");
      localStorage.removeItem("firstLoginOtpLockout");
      localStorage.removeItem("otpLockout");
      localStorage.removeItem("resetOtpLockout");
      console.log("Auth data cleared");
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  },

  saveAuthData: (userData, accessToken, refreshToken) => {
    try {
      console.log("💾 Saving auth data...");
      console.log("User data from backend:", userData);

      // DECODE TOKEN TO GET CLAIMS INCLUDING empMasterId
      const tokenClaims = getClaimsFromToken(accessToken);
      console.log("🔍 Token claims:", tokenClaims);
      console.log("📋 empMasterId from token:", tokenClaims?.empMasterId);

      // MERGE USER DATA WITH TOKEN CLAIMS
      const enrichedUserData = {
        ...userData,
        empMasterId: tokenClaims?.empMasterId,
      };

      console.log("✅ Enriched user data:", enrichedUserData);

      localStorage.setItem("user", JSON.stringify(enrichedUserData));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      console.log("Auth data saved:", {
        userId: enrichedUserData?.userId,
        email: enrichedUserData?.email,
        role: enrichedUserData?.roleName,
        empMasterId: enrichedUserData?.empMasterId,
      });
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  },

  saveTempUser: (tempUserData) => {
    try {
      localStorage.setItem("tempUser", JSON.stringify(tempUserData));
      console.log("Temp user saved");
    } catch (error) {
      console.error("Error saving temp user:", error);
    }
  },

  getTempUser: () => {
    try {
      const tempUserStr = localStorage.getItem("tempUser");
      return tempUserStr ? JSON.parse(tempUserStr) : null;
    } catch (error) {
      console.error("Error getting temp user:", error);
      return null;
    }
  },

  clearTempUser: () => {
    try {
      localStorage.removeItem("tempUser");
      console.log("Temp user cleared");
    } catch (error) {
      console.error("Error clearing temp user:", error);
    }
  },

  setOtpLockout: (type = "otp", minutes = 30) => {
    try {
      const lockoutUntil = Date.now() + minutes * 60 * 1000;
      const lockoutKey =
        type === "reset"
          ? "resetOtpLockout"
          : type === "firstLogin"
          ? "firstLoginOtpLockout"
          : "otpLockout";
      localStorage.setItem(lockoutKey, lockoutUntil.toString());
      console.log(`${type} OTP lockout set for ${minutes} minutes`);
    } catch (error) {
      console.error("Error setting OTP lockout:", error);
    }
  },

  isOtpLockedOut: (type = "otp") => {
    try {
      const lockoutKey =
        type === "reset"
          ? "resetOtpLockout"
          : type === "firstLogin"
          ? "firstLoginOtpLockout"
          : "otpLockout";
      const lockoutUntil = localStorage.getItem(lockoutKey);

      if (!lockoutUntil) return false;

      const isLocked = Date.now() < parseInt(lockoutUntil);

      if (!isLocked) {
        localStorage.removeItem(lockoutKey);
      }

      return isLocked;
    } catch (error) {
      console.error("Error checking OTP lockout:", error);
      return false;
    }
  },

  getRemainingLockoutTime: (type = "otp") => {
    try {
      const lockoutKey =
        type === "reset"
          ? "resetOtpLockout"
          : type === "firstLogin"
          ? "firstLoginOtpLockout"
          : "otpLockout";
      const lockoutUntil = localStorage.getItem(lockoutKey);

      if (!lockoutUntil) return 0;

      const remaining = Math.max(
        0,
        Math.ceil((parseInt(lockoutUntil) - Date.now()) / 1000)
      );
      return remaining;
    } catch (error) {
      console.error("Error getting lockout time:", error);
      return 0;
    }
  },

  clearOtpLockout: (type = "otp") => {
    try {
      const lockoutKey =
        type === "reset"
          ? "resetOtpLockout"
          : type === "firstLogin"
          ? "firstLoginOtpLockout"
          : "otpLockout";
      localStorage.removeItem(lockoutKey);
      console.log(`${type} OTP lockout cleared`);
    } catch (error) {
      console.error("Error clearing OTP lockout:", error);
    }
  },
};

export default authService;
