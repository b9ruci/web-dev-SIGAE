import { useState } from "react";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmar) {
      alert("Las contraseñas no coinciden");
      return;
    }

    alert("Contraseña actualizada");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Nueva Contraseña</h1>

        <p>
          La nueva contraseña debe ser distinta a la anterior.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
          />

          <button type="submit">
            Actualizar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;