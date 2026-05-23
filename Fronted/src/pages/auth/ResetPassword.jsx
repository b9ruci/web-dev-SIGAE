import { useState } from "react";
import {
  useNavigate,
  Link,
} from "react-router-dom";

function ResetPassword() {

  const [passwordActual, setPasswordActual] =
    useState("");

  const [passwordNueva, setPasswordNueva] =
    useState("");

  const [confirmarPassword, setConfirmarPassword] =
    useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (passwordNueva !== confirmarPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (passwordNueva === passwordActual) {
      alert(
        "La nueva contraseña debe ser diferente"
      );
      return;
    }

    console.log({
      passwordActual,
      passwordNueva,
    });

    alert("Contraseña actualizada");

    navigate("/");
  };

  return (
    <div className="login-container">

      <form
        className="login-form"
        onSubmit={handleSubmit}
      >

        <h1>Cambiar Contraseña</h1>

        <p>
          Debe ingresar una nueva contraseña
        </p>

        <input
          type="password"
          placeholder="Contraseña actual"
          value={passwordActual}
          onChange={(e) =>
            setPasswordActual(e.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={passwordNueva}
          onChange={(e) =>
            setPasswordNueva(e.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmarPassword}
          onChange={(e) =>
            setConfirmarPassword(e.target.value)
          }
          required
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