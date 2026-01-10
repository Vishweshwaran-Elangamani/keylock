import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/auth/AuthContext";
import { Toaster } from "sonner";
import AppRoutes from "./routes";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          duration={4000}
          toastOptions={{
            style: {
              background: "#fff",
              color: "#333",
              border: "1px solid #e0e0e0",
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;