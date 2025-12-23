import { Navigate, Route, Routes } from "react-router-dom";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage.jsx";
import LoginPage from "./features/auth/pages/LoginPage.jsx";
import DashboardPlaceholder from "./features/dashboard/pages/DashboardPlaceholder.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/dashboard" element={<DashboardPlaceholder />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
