import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const { login } = useAuth();

  const handleSubmit = (e) => {

    e.preventDefault();

    // SIMULACIÓN DE LOGIN

    const fakeUser = {
      nombre: "Administrador SIGAE",
      correo,
      roles: ["Administrador", "Docente"],
    };

    login(fakeUser);

    // SI TIENE MÁS DE UN ROL
    if (fakeUser.roles.length > 1) {

      navigate("/select-role");

    } else {

      navigate("/dashboard");
    }
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

        </div>

      </form>

    </div>
  );
}

export default Login;