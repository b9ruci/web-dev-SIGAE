import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

/* AUTH */

import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import SessionExpired from "../pages/auth/SessionExpired";
import SelectRole from "../pages/auth/SelectRole";
import GestionRoles from "../pages/users/GestionRoles";

/* PROTECTED ROUTE */

import ProtectedRoute from "./ProtectedRoute";

/* DASHBOARD */

import Dashboard from "../pages/dashboard/Dashboard";

/* USERS */

import Usuarios from "../pages/users/Usuarios";
import RegisterAdmin from "../pages/users/RegisterAdmin";
import RegisterTeacher from "../pages/users/RegisterTeacher";
import RegisterGuardian from "../pages/users/RegisterGuardian";
import RegisterStudent from "../pages/users/RegisterStudent";
import Perfil from "../pages/users/Perfil";

/* ACADEMIC */

import Cursos from "../pages/academic/Cursos";
import Horarios from "../pages/academic/Horarios";
import BloquesHorarios from "../pages/academic/BloquesHorarios";

/* COMMUNICATION */

import Mensajes from "../pages/communications/Mensajes";
import Citaciones from "../pages/communications/Citaciones";

/* REPORTS */

import Reportes from "../pages/reports/Reportes";

/* LAYOUT */

import MainLayout from "../layouts/MainLayout";

function AppRouter() {

  return (

    <BrowserRouter>

      <Routes>

        {/* AUTH */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/seleccionar-rol"
          element={<SelectRole />}
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

        {/* PRIVATE ROUTES */}

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >

          {/* DASHBOARD */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* USERS */}

          <Route
            path="/usuarios"
            element={<Usuarios />}
          />
          
          <Route
          path="/gestion-roles"
          element={<GestionRoles />}
          />

          <Route
            path="/registrar-admin"
            element={<RegisterAdmin />}
          />

          <Route
            path="/registrar-docente"
            element={<RegisterTeacher />}
          />

          <Route
            path="/registrar-apoderado"
            element={<RegisterGuardian />}
          />

          <Route
            path="/registrar-estudiante"
            element={<RegisterStudent />}
          />

          <Route
            path="/perfil"
            element={<Perfil />}
          />

          {/* ACADEMIC */}

          <Route
            path="/cursos"
            element={<Cursos />}
          />

          <Route
            path="/horarios"
            element={<Horarios />}
          />

          <Route
            path="/bloques"
            element={<BloquesHorarios />}
          />

          {/* COMMUNICATION */}

          <Route
            path="/mensajes"
            element={<Mensajes />}
          />

          <Route
            path="/citaciones"
            element={<Citaciones />}
          />

          {/* REPORTS */}

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