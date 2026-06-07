import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function ForgotPassword() {
  const [correo, setCorreo] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMensaje("");

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correo }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar la solicitud");
      }

      setStatus("success");
      setMensaje(data.message);
    } catch (err) {
      setStatus("error");
      setMensaje(err.message);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Recuperar Contraseña</h1>

        {status !== "success" ? (
          <>
            <p>
              Ingrese su correo registrado en la plataforma. Puede ser su correo
              institucional (docentes y administradores) o correo personal (apoderados).
            </p>

            <input
              type="email"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={status === "loading"}
              required
            />

            {status === "error" && (
              <p className="error-message">{mensaje}</p>
            )}

            <button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Enviando..." : "Enviar enlace"}
            </button>
          </>
        ) : (
          <div className="success-message">
            <p>{mensaje}</p>
            <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
          </div>
        )}

        <Link to="/" style={{ marginTop: "1rem", display: "block", textAlign: "center" }}>
          ← Volver al inicio de sesión
        </Link>
      </form>
    </div>
  );
}

export default ForgotPassword;
