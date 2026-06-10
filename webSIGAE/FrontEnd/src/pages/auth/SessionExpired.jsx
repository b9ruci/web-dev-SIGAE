import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function SessionExpired() {
  const { logout } = useAuth();

  // Limpiar estado de auth al llegar a esta pantalla (CU 13)
  useEffect(() => {
    logout();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Sesión Expirada</h1>
        <p>
          Tu sesión expiró por seguridad. Debes iniciar sesión nuevamente para
          continuar.
        </p>
        <Link to="/">
          <button style={{ marginTop: "1rem", width: "100%" }}>
            Volver al inicio de sesión
          </button>
        </Link>
      </div>
    </div>
  );
}

export default SessionExpired;
