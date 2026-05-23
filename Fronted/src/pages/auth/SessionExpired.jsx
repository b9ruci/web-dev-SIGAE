import { Link } from "react-router-dom";

function SessionExpired() {
  return (
    <div className="login-container">

      <div className="login-form">

        <h1>Sesión Expirada</h1>

        <p>
          Su sesión expiró por inactividad
        </p>

        <Link to="/">
          <button>
            Volver a iniciar sesión
          </button>
        </Link>

      </div>
    </div>
  );
}

export default SessionExpired;