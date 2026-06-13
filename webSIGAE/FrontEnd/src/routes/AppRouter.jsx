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

import ProtectedRoute, { RoleRoute } from "./ProtectedRoute";

/* DASHBOARD */

import Dashboard from "../pages/dashboard/Dashboard";

/* USERS */

import Usuarios from "../pages/users/Usuarios";
import RegisterAdmin from "../pages/users/RegisterAdmin";
import RegisterTeacher from "../pages/users/RegisterTeacher";
import RegisterGuardian from "../pages/users/RegisterGuardian";
import RegisterStudent from "../pages/users/RegisterStudent";
import Apoderados from "../pages/users/Apoderados";
import Perfil from "../pages/users/Perfil";

/* ACADEMIC */

import Cursos from "../pages/academic/Cursos";
import Horarios from "../pages/academic/Horarios";
import BloquesHorarios from "../pages/academic/BloquesHorarios";
import PlanEducativo from "../pages/academic/PlanEducativo";

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

        {/* AUTH — públicas */}

        <Route path="/"                element={<Login />} />
        <Route path="/seleccionar-rol" element={<SelectRole />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/session-expired" element={<SessionExpired />} />

        {/* RUTAS PRIVADAS — requieren sesión */}

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >

          {/* Accesibles por todos los roles autenticados */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil"     element={<Perfil />} />
          <Route
            path="/perfil/:id"
            element={
              <RoleRoute roles={["Administrador"]}>
              <Perfil />
              </RoleRoute>
            }
        />
          {/* Accesibles por Docente y Apoderado */}
          <Route path="/citaciones" element={<Citaciones />} />
          <Route path="/mensajes"   element={<Mensajes />} />

          {/* Accesibles por Docente */}
          <Route
            path="/horarios"
            element={
              <RoleRoute roles={["Docente", "Administrador"]}>
                <Horarios />
              </RoleRoute>
            }
          />

          {/* Exclusivas de Administrador / SuperAdmin */}
          <Route
            path="/usuarios"
            element={
              <RoleRoute roles={["Administrador"]}>
                <Usuarios />
              </RoleRoute>
            }
          />
          
          <Route
          path="/gestion-roles"
          element={
          <RoleRoute roles={["Administrador"]}>
            <GestionRoles />
            </RoleRoute>
          }
          />

<Route
  path="/gestion-roles/:id"
  element={
    <RoleRoute roles={["Administrador"]}>
      <GestionRoles />
    </RoleRoute>
  }
/>

          <Route
            path="/registrar-admin"
            element={
              <RoleRoute roles={["Administrador"]}>
                <RegisterAdmin />
              </RoleRoute>
            }
          />

          <Route
            path="/registrar-docente"
            element={
              <RoleRoute roles={["Administrador"]}>
                <RegisterTeacher />
              </RoleRoute>
            }
          />

          <Route
            path="/registrar-apoderado"
            element={
              <RoleRoute roles={["Administrador"]}>
                <RegisterGuardian />
              </RoleRoute>
            }
          />

          <Route
            path="/registrar-estudiante"
            element={
              <RoleRoute roles={["Administrador"]}>
                <RegisterStudent />
              </RoleRoute>
            }
          />

          <Route
            path="/apoderados"
            element={
              <RoleRoute roles={["Administrador"]}>
                <Apoderados />
              </RoleRoute>
            }
          />

          <Route
            path="/perfil"
            element={<Perfil />}
          />

          {/* ACADEMIC */}

          <Route
            path="/cursos"
            element={
              <RoleRoute roles={["Administrador"]}>
                <Cursos />
              </RoleRoute>
            }
          />

          <Route
            path="/bloques"
            element={
              <RoleRoute roles={["Administrador"]}>
                <BloquesHorarios />
              </RoleRoute>
            }
          />

          <Route
            path="/bloques-horarios"
            element={
              <RoleRoute roles={["Administrador"]}>
                <BloquesHorarios />
              </RoleRoute>
            }
          />

          <Route
            path="/plan-educativo"
            element={
              <RoleRoute roles={["Administrador", "Docente"]}>
                <PlanEducativo />
              </RoleRoute>
            }
          />

          <Route
            path="/reportes"
            element={
              <RoleRoute roles={["Administrador"]}>
                <Reportes />
              </RoleRoute>
            }
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default AppRouter;
