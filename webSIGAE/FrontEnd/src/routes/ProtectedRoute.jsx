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
export function RoleRoute({ children, roles = [] }) {
  const { usuario, rolActivo } = useAuth();

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  const rolEfectivo = rolActivo || usuario?.roles?.[0];
  const esSuperAdmin = usuario?.administradorTipo === "Super Admin";

  const tieneAcceso =
    esSuperAdmin ||
    roles.some(
      (r) =>
        rolEfectivo === r ||
        usuario?.roles?.includes(r)
    );

  if (!tieneAcceso) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
