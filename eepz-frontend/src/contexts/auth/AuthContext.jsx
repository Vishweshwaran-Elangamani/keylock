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

  // 🔹 REHYDRATE USER FROM JWT ON APP LOAD / REFRESH
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

      // 🔹 BACKWARD COMPATIBILITY (DON’T REMOVE)
      localStorage.setItem("user", JSON.stringify(rebuiltUser));
      localStorage.setItem("userId", rebuiltUser.userId ?? "");
      localStorage.setItem("userName", rebuiltUser.name ?? "");
      localStorage.setItem("userRole", rebuiltUser.role ?? "");
      localStorage.setItem("email", rebuiltUser.email ?? "");
    } catch (error) {
      console.error("Auth init error:", error);

      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 LOGIN HANDLER (CUSTOM LOGIN PAGE)
  const login = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);

    localStorage.setItem("accessToken", token);
    localStorage.setItem("token", token); // backward support

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("userId", userData.userId ?? "");
    localStorage.setItem("userName", userData.name ?? "");
    localStorage.setItem("userRole", userData.role ?? "");
    localStorage.setItem("email", userData.email ?? "");
  };

  // 🔹 LOGOUT HANDLER
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
