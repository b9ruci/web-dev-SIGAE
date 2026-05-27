import { useState } from "react";

function ForgotPassword() {
  const [correo, setCorreo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    alert(
      "Se ha enviado un enlace de recuperación al correo."
    );
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

      </form>

    </div>
  );
}

export default ForgotPassword;