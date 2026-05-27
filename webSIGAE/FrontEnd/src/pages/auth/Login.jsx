import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const { login } = useAuth();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: correo, password })
    });
    if (!res.ok) throw new Error(await res.text());
    const { user, token } = await res.json();
    login(user, token);  // guarda token y user en contexto/localStorage
    if (user.roles.length > 1) navigate('/select-role');
    else navigate('/dashboard');
  } catch (err) {
    alert(err.message);
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