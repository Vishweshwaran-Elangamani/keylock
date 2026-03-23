import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/auth/AuthContext";
import authService from "../../../services/auth/authService";
import { toast } from "sonner";
import logodarkfull from "../../../assets/logodarkfull.png";
import "../../../styles/auth/Auth.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({ email: false, password: false });

  const navigate = useNavigate();
  const { login } = useAuth();

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    if (name === "email") {
      if (!value.trim()) newErrors.email = "Email is required";
      else if (!validateEmail(value.trim()))
        newErrors.email = "Please enter a valid email address";
      else delete newErrors.email;
    }

    if (name === "password") {
      if (!value) newErrors.password = "Password is required";
      else if (value.length < 6)
        newErrors.password = "Password must be at least 6 characters";
      else delete newErrors.password;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim())
      newErrors.email = "Email is required";
    else if (!validateEmail(formData.email.trim()))
      newErrors.email = "Invalid email";

    if (!formData.password)
      newErrors.password = "Password is required";

    setErrors(newErrors);
    setTouched({ email: true, password: true });

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) validateField(name, value);
    if (error) setError("");
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const getDashboardRoute = (role) => {
    const routes = {
      Admin: "/admin/dashboard",
      HR: "/hr/dashboard",
      Manager: "/manager/dashboard",
      DepartmentHead: "/department-head/dashboard",
      Leadership: "/leadership/dashboard",
      Employee: "/employee/dashboard",
    };

    return routes[role] || "/employee/dashboard";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Enter valid details");
      return;
    }

    toast.loading("Signing in...");
    performLogin();
  };

  // 🔥 FINAL LOGIN LOGIC
  const performLogin = async () => {
    setLoading(true);

    try {
      const response = await authService.keycloakLogin(
        formData.email,
        formData.password
      );

      if (!response.success || !response.data) {
        const msg = response.message || "Login failed";
        setError(msg);
        toast.dismiss();
        toast.error(msg);
        return;
      }

      const { user, accessToken, refreshToken } = response.data;

      if (!user || !accessToken) {
        throw new Error("Invalid auth response");
      }

      // ✅ Save auth
      login(user, accessToken, refreshToken);

      toast.dismiss();
      toast.success(`Welcome back, ${user.name}!`);

      // ✅ Correct role routing
      const route = getDashboardRoute(user.role);

      navigate(route, { replace: true });

    } catch (err) {
      console.error("Login error:", err);

      let msg = "Unable to sign in";

      if (err.response?.status === 401)
        msg = "Invalid email or password";

      setError(msg);
      toast.dismiss();
      toast.error(msg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eepz-login-page">
      <div className="container-fluid h-100 g-0">
        <div className="row g-0 h-100">

          {/* LEFT SIDE */}
          <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white p-4">
            <div className="eepz-login-form-container">

              <div className="text-center mb-4">
                <img
                  src={logodarkfull}
                  alt="EEPZ Logo"
                  style={{ width: "400px" }}
                />
                <h2 className="fw-bold mt-3">
                  Sign In
                </h2>
              </div>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}

                {/* EMAIL */}
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="form-control mb-3"
                  disabled={loading}
                />

                {/* PASSWORD */}
                <div className="position-relative mb-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="form-control"
                    disabled={loading}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "10px",
                      cursor: "pointer",
                    }}
                  >
                    👁
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center eepz-login-right-bg">
            <h2 className="text-white">Welcome to EEPZ</h2>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;