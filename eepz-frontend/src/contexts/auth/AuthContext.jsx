import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/auth/authService";

const AuthContext = createContext(null);

const KEYS = {
  user: "user",
  accessToken: "accessToken",
  token: "token",
  refreshToken: "refreshToken",
  userId: "userId",
  userName: "userName",
  userRole: "userRole",
  email: "email",
  empId: "empId",
};

const readToken = () =>
  localStorage.getItem(KEYS.accessToken) || localStorage.getItem(KEYS.token);

const removeAllAuthKeys = () => {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
};

const syncIndividualFields = (userData) => {
  localStorage.setItem(KEYS.userId, userData?.userId || "");
  localStorage.setItem(KEYS.userName, userData?.name || "");
  localStorage.setItem(KEYS.userRole, userData?.roleName || userData?.role || "");
  localStorage.setItem(KEYS.email, userData?.email || "");
  localStorage.setItem(KEYS.empId, userData?.empId || "");
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔥 INIT AUTH STATE (IMPORTANT FIX)
  useEffect(() => {
    try {
      const token = readToken();
      const storedUser = localStorage.getItem(KEYS.user);

      if (token && storedUser) {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);
        setIsAuthenticated(true);
      } else {
        removeAllAuthKeys();
      }
    } catch {
      removeAllAuthKeys();
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔥 FORCE LOGOUT LISTENER
  useEffect(() => {
    const handleForceLogout = () => {
      removeAllAuthKeys();
      setUser(null);
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    };

    window.addEventListener("auth:force-logout", handleForceLogout);
    return () => window.removeEventListener("auth:force-logout", handleForceLogout);
  }, [navigate]);

  // 🔐 LOGIN
  const login = (userData, accessToken, refreshToken) => {
    localStorage.setItem(KEYS.user, JSON.stringify(userData));
    localStorage.setItem(KEYS.accessToken, accessToken);
    localStorage.setItem(KEYS.token, accessToken);

    if (refreshToken) {
      localStorage.setItem(KEYS.refreshToken, refreshToken);
    }

    syncIndividualFields(userData);

    setUser(userData);
    setIsAuthenticated(true);
  };

  // 🔓 LOGOUT
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Logout API failed:", err);
    } finally {
      removeAllAuthKeys();
      setUser(null);
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export default AuthContext;