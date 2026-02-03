import api from "./api";

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
      const response = await api.post("/Authentication/login", {
        email,
        password,
        ipAddress: null,
        userAgent: navigator.userAgent,
      });
      const result = response.data;
      if (result.success && result.data.requiresTwoFactor) {
        return result;
      }
      if (result.success && result.data.requiresPasswordReset) {
        return result;
      }
      if (result.success && result.data.accessToken) {
        authService.saveAuthData(
          result.data.user,
          result.data.accessToken,
          result.data.refreshToken
        );
      }
      return result;
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      const errorMessage = error.response?.data?.Message 
        || error.response?.data?.message 
        || error.message;
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    try {
      const response = await api.post("/Authentication/logout");
      authService.clearAuthData();
      return response.data;
    } catch (error) {
      console.error("Logout error:", error);
      authService.clearAuthData();
      const errorMessage = error.response?.data?.Message 
        || error.response?.data?.message 
        || error.message;
      throw new Error(errorMessage);
    }
  },

  verifyOtp: async (email, otpCode) => {
    try {
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
      }
      return result;
    } catch (error) {
      console.error("OTP verification error:", error);
      const errorMessage = error.response?.data?.Message 
        || error.response?.data?.message 
        || error.message;
      throw new Error(errorMessage);
    }
  },

  verifyFirstLoginOtp: async (email, otpCode) => {
    try {
      const response = await api.post("/Authentication/verify-otp", {
        email: email,
        otpCode: otpCode,
        otpType: "ForgotPassword",
      });
      return response.data;
    } catch (error) {
      console.error("First login OTP verification error:", error);
      const errorMessage = error.response?.data?.Message 
        || error.response?.data?.message 
        || error.message;
      throw new Error(errorMessage);
    }
  },

  verifyResetOtp: async (email, otpCode) => {
    try {
      const response = await api.post("/Authentication/verify-otp", {
        email: email,
        otpCode: otpCode,
        otpType: "ForgotPassword",
      });
      return response.data;
    } catch (error) {
      console.error("Reset OTP verification error:", error);
      const errorMessage = error.response?.data?.Message 
        || error.response?.data?.message 
        || error.message;
      throw new Error(errorMessage);
    }
  },

  resendOtp: async (email, otpType) => {
    try {
      const response = await api.post("/Authentication/resend-otp", {
        email: email,
        otpType: otpType,
      });
      return response.data;
    } catch (error) {
      console.error("Resend OTP error:", error);
      const errorMessage = error.response?.data?.Message 
        || error.response?.data?.message 
        || error.message;
      throw new Error(errorMessage);
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post("/Authentication/forgot-password", {
        email: email,
      });
      return response.data;
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage = error.response?.data?.Message 
        || error.response?.data?.message 
        || error.message;
      throw new Error(errorMessage);
    }
  },

  resetPassword: async (email, otpCode, newPassword, confirmPassword) => {
    try {
      const response = await api.post("/Authentication/reset-password", {
        email: email,
        otpCode: otpCode,
        newPassword: newPassword,
        confirmPassword: confirmPassword || newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Reset password error:", error.response?.data || error);
      const errorMessage = error.response?.data?.Message 
        || error.response?.data?.message 
        || error.message;
      throw new Error(errorMessage);
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post("/Authentication/change-password", {
        currentPassword: currentPassword || "",
        newPassword: newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Change password error:", error);
      const errorMessage = error.response?.data?.Message 
        || error.response?.data?.message 
        || error.message;
      throw new Error(errorMessage);
    }
  },

  refreshAccessToken: async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        console.error("No refresh token available");
        throw new Error("No refresh token available");
      }
      const response = await api.post("/Authentication/refresh-token", {
        refreshToken: refreshToken,
      });
      const result = response.data;
      if (result.success && result.data.accessToken) {
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
      }
      return result;
    } catch (error) {
      console.error("Token refresh error:", error);
      authService.clearAuthData();
      const errorMessage = error.response?.data?.Message 
        || error.response?.data?.message 
        || error.message;
      throw new Error(errorMessage);
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
      localStorage.removeItem("token");
      localStorage.removeItem("tempUser");
      localStorage.removeItem("firstLoginOtpLockout");
      localStorage.removeItem("otpLockout");
      localStorage.removeItem("resetOtpLockout");
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  },

  saveAuthData: (userData, accessToken, refreshToken) => {
    try {
      const tokenClaims = getClaimsFromToken(accessToken);
      const enrichedUserData = {
        ...userData,
        empMasterId: tokenClaims?.empMasterId,
      };
      localStorage.setItem("user", JSON.stringify(enrichedUserData));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  },

  saveTempUser: (tempUserData) => {
    try {
      localStorage.setItem("tempUser", JSON.stringify(tempUserData));
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
    } catch (error) {
      console.error("Error clearing OTP lockout:", error);
    }
  },
};

export default authService;
