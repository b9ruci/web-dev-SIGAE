import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import SessionExpired from "../pages/auth/SessionExpired";

import Dashboard from "../pages/dashboard/Dashboard";

import Usuarios from "../pages/users/Usuarios";
import Reportes from "../pages/reports/Reportes";

import MainLayout from "../layouts/MainLayout";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH */}

        <Route path="/" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/session-expired"
          element={<SessionExpired />}
        />

        {/* DASHBOARD */}

        <Route element={<MainLayout />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/usuarios"
            element={<Usuarios />}
          />

          <Route
            path="/reportes"
            element={<Reportes />}
          />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;