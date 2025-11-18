import { useState, useEffect } from "react";

export default function useAuth() {
  const [role, setRoleState] = useState(
    localStorage.getItem("role") || "Employee"
  );

  useEffect(() => {
    localStorage.setItem("role", role);
  }, [role]);

  const setRole = (newRole) => {
    setRoleState(newRole);
    localStorage.setItem("role", newRole);
  };

  const logout = () => {
    localStorage.removeItem("role");
    setRoleState("Employee");
  };

  return { role, setRole, logout };
}
