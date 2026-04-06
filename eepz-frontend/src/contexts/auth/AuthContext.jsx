import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import authService from "../../services/auth/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ REHYDRATE AUTH ON APP LOAD
  useEffect(() => {
    try {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token");

      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const decoded = jwtDecode(token);

      const rebuiltUser = {
        userId: decoded.empMasterId || decoded.empId,
        name: decoded.name,
        email: decoded.email,
        username: decoded.preferred_username,
        role: decoded.role
      };

      setUser(rebuiltUser);
      setIsAuthenticated(true);

      // ✅ Backward compatibility
      localStorage.setItem("user", JSON.stringify(rebuiltUser));
      localStorage.setItem("userId", rebuiltUser.userId ?? "");
      localStorage.setItem("userName", rebuiltUser.name ?? "");
      localStorage.setItem("userRole", rebuiltUser.role ?? "");
      localStorage.setItem("email", rebuiltUser.email ?? "");
    } catch (err) {
      console.error("Auth bootstrap failed:", err);
      localStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false); // ✅ CRITICAL
    }
  }, []);

  // ✅ LOGIN
  const login = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);

    localStorage.setItem("accessToken", token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // ✅ LOGOUT
  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    finally {
      localStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};