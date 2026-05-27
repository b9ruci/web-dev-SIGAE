import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, rolesPermitidos }) => {
  const { usuario, rolActivo } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" />;
  }

  if (!rolActivo) {
    return <Navigate to="/seleccionar-rol" />;
  }

  if (
    rolesPermitidos &&
    !rolesPermitidos.includes(rolActivo)
  ) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;