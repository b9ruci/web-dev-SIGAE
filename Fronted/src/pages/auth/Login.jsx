import { useState } from "react";
import {
  useNavigate,
  Link,
} from "react-router-dom";

function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log({
      correo,
      password,
    });

    navigate("/dashboard");
  };

  return (
    <div className="login-container">

      <form
        className="login-form"
        onSubmit={handleSubmit}
      >

        <h1>SIGAE</h1>

        <p>
          Sistema de Gestión Académica Escolar
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

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        <button type="submit">
          Iniciar Sesión
        </button>

        <div className="login-links">

          <Link to="/forgot-password">
            ¿Olvidó su contraseña?
          </Link>

          <Link to="/register">
            Registrar cuenta
          </Link>

        </div>

      </form>
    </div>
  );
}

export default Login;