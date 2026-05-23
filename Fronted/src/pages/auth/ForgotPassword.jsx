import { Link } from "react-router-dom";

function ForgotPassword() {
  return (
    <div className="login-container">

      <form className="login-form">

        <h1>Recuperar Contraseña</h1>

        <p>
          Ingrese su correo institucional
        </p>

        <input
          type="email"
          placeholder="Correo electrónico"
        />

        <button type="submit">
          Enviar enlace
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

export default ForgotPassword;