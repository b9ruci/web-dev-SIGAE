import { Link } from "react-router-dom";

function SessionExpired() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Sesión Expirada</h1>

        <p>
          Tu sesión expiró por inactividad.
        </p>

        <Link to="/">
          <button>
            Volver al Login
          </button>
        </Link>
      </div>
    </div>
  );
}

export default SessionExpired;