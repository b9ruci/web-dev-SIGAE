import { useState } from "react";
import {
  useNavigate,
  Link,
} from "react-router-dom";

function ForgotPassword() {

  const [correo, setCorreo] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Correo enviado:", correo);

    navigate("/reset-password");
  };

  return (
    <div className="login-container">

      <form
        className="login-form"
        onSubmit={handleSubmit}
      >

        <h1>Recuperar Contraseña</h1>

        <p>
          Ingrese su correo institucional
        </p>

        <input
          type="email"
          placeholder="Correo institucional"
          value={correo}
          onChange={(e) =>
            setCorreo(e.target.value)
          }
          required
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