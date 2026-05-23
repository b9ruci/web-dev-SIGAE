import { Link } from "react-router-dom";

function ResetPassword() {
  return (
    <div className="login-container">

      <form className="login-form">

        <h1>Nueva Contraseña</h1>

        <p>
          Debe ingresar una nueva contraseña
        </p>

        <input
          type="password"
          placeholder="Nueva contraseña"
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
        />

        <button type="submit">
          Actualizar contraseña
        </button>

        <div className="login-links">

          <Link to="/">
            Volver al login
          </Link>

        </div>

      </form>
    </div>
  );
}

export default ResetPassword;