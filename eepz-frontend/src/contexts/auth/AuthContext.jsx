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
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);

      //  SET INDIVIDUAL FIELDS IN LOCALSTORAGE
      localStorage.setItem("userId", parsedUser.userId);
      localStorage.setItem("userName", parsedUser.userName);
      localStorage.setItem(
        "userRole",
        parsedUser.roleType || parsedUser.role || parsedUser.userRole
      );
      localStorage.setItem("email", parsedUser.email);
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);

    //  ALSO SET INDIVIDUAL FIELDS
    localStorage.setItem("userId", userData.userId);
    localStorage.setItem("userName", userData.userName);
    localStorage.setItem(
      "userRole",
      userData.roleType || userData.role || userData.userRole
    );
    localStorage.setItem("email", userData.email);
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
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      localStorage.removeItem("email");
      navigate("/login");
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
