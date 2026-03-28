import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/auth/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      // 🔥 FIX: SUPPORT BOTH TOKENS
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token");

      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);
        setIsAuthenticated(true);

        // ✅ KEEP OLD SYSTEM COMPATIBLE
        localStorage.setItem("userId", parsedUser.userId || "");
        localStorage.setItem("userName", parsedUser.name || "");
        localStorage.setItem(
          "userRole",
          parsedUser.roleType ||
            parsedUser.role ||
            parsedUser.userRole ||
            ""
        );
        localStorage.setItem("email", parsedUser.email || "");
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth init error:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);

    localStorage.setItem("user", JSON.stringify(userData));

    // 🔥 CRITICAL FIX
    localStorage.setItem("accessToken", token);
    localStorage.setItem("token", token); // backward compatibility

    // ✅ OLD SYSTEM SUPPORT
    localStorage.setItem("userId", userData.userId || "");
    localStorage.setItem("userName", userData.name || "");
    localStorage.setItem(
      "userRole",
      userData.roleType ||
        userData.role ||
        userData.userRole ||
        ""
    );
    localStorage.setItem("email", userData.email || "");
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);

      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      localStorage.removeItem("email");

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
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};