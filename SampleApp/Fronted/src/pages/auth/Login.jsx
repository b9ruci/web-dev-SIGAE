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

    /*
      SIMULACIÓN DE LOGIN
      Después lo conectamos con backend
    */

    // SUPER ADMIN
    if (
      correo === "es.gonzales@jacquescousteau.edu" &&
      password === "1234"
    ) {

      const usuario = {
        nombre: "Esperanza Gonzales",
        roles: ["superadmin"],
      };

      localStorage.setItem(
        "usuario",
        JSON.stringify(usuario)
      );

      navigate("/dashboard");

      return;
    }

    // ADMIN NORMAL
    if (
      correo === "ca.gonzales@jacquescousteau.edu" &&
      password === "ilovemilf"
    ) {

      const usuario = {
        nombre: "Carlos Gonzales",
        roles: ["admin"],
      };

      localStorage.setItem(
        "usuario",
        JSON.stringify(usuario)
      );

      navigate("/dashboard");

      return;
    }

    // DOCENTE
    if (
      correo === "ma.morales@jacquescousteau.edu" &&
      password === "hash123"
    ) {

      const usuario = {
        nombre: "María Morales",
        roles: ["docente"],
      };

      localStorage.setItem(
        "usuario",
        JSON.stringify(usuario)
      );

      navigate("/dashboard");

      return;
    }

    // USUARIO MULTIROL
    if (
      correo === "multirol@jacquescousteau.edu" &&
      password === "1234"
    ) {

      const usuario = {
        nombre: "Usuario Multirol",
        roles: ["docente", "apoderado"],
      };

      localStorage.setItem(
        "usuario",
        JSON.stringify(usuario)
      );

      navigate("/seleccionar-rol");

      return;
    }

    alert("Credenciales incorrectas");
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