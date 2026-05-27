import { useState } from "react";

function ResetPassword() {

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    alert("Contraseña actualizada correctamente");
  };

  return (
    <div className="login-container">

      <form
        className="login-form"
        onSubmit={handleSubmit}
      >

        <h1>Nueva Contraseña</h1>

        <p>
          Ingrese su nueva contraseña
        </p>

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) =>
            setNewPassword(e.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(e.target.value)
          }
          required
        />

        <button type="submit">
          Cambiar contraseña
        </button>

      </form>

    </div>
  );
}

export default ResetPassword;