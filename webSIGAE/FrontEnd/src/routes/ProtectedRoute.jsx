import { Navigate } from "react-router-dom";
import { useAuth } from "../pages/context/AuthContext";

// Protege cualquier ruta que requiera sesión activa
function ProtectedRoute({ children }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Protege rutas que requieren un rol específico.
// Si el usuario no tiene ninguno de los roles permitidos, redirige al dashboard.
// superAdminOnly=true restringe el acceso exclusivamente al Super Administrador.
export function RoleRoute({ children, roles = [], superAdminOnly = false }) {
  const { usuario, rolActivo } = useAuth();

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  const rolEfectivo = rolActivo || usuario?.roles?.[0];
  const esSuperAdmin = usuario?.administradorTipo === "Super Admin";

  if (superAdminOnly && !esSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const tieneAcceso =
    esSuperAdmin ||
    roles.some((r) => rolEfectivo === r);

  if (!tieneAcceso) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
