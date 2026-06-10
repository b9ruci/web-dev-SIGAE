import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [estadoToken, setEstadoToken] = useState("validando"); // validando | valido | invalido
  const [mensajeToken, setMensajeToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  // Validar token al montar (CU 15)
  useEffect(() => {
    if (!token) {
      setEstadoToken("invalido");
      setMensajeToken("No se proporcionó un enlace de recuperación válido.");
      return;
    }

    fetch(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setEstadoToken("valido");
        } else {
          setEstadoToken("invalido");
          setMensajeToken(data.error || "El enlace no es válido o ha expirado.");
        }
      })
      .catch(() => {
        setEstadoToken("invalido");
        setMensajeToken("No se pudo verificar el enlace. Intenta nuevamente.");
      });
  }, [token]);

  const validar = () => {
    const e = {};
    if (newPassword.length < 8)
      e.newPassword = "Mínimo 8 caracteres";
    else if (!/[A-Z]/.test(newPassword))
      e.newPassword = "Debe contener al menos una mayúscula";
    else if (!/[0-9]/.test(newPassword))
      e.newPassword = "Debe contener al menos un número";

    if (newPassword !== confirmPassword)
      e.confirmPassword = "Las contraseñas no coinciden";

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGeneral("");
    const e2 = validar();
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al restablecer la contraseña");
      setExito(true);
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (estadoToken === "validando") {
    return (
      <div className="login-container">
        <div className="login-form">
          <h1>Nueva Contraseña</h1>
          <p>Verificando enlace...</p>
        </div>
      </div>
    );
  }

  if (estadoToken === "invalido") {
    return (
      <div className="login-container">
        <div className="login-form">
          <h1>Enlace no válido</h1>
          <p className="error-message">{mensajeToken}</p>
          <Link to="/forgot-password" style={{ display: "block", marginTop: "1rem" }}>
            Solicitar nuevo enlace
          </Link>
          <Link to="/" style={{ display: "block", marginTop: "0.5rem" }}>
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h1>Contraseña actualizada</h1>
          <div className="success-message">
            <p>Tu contraseña ha sido restablecida correctamente.</p>
          </div>
          <Link to="/" style={{ display: "block", marginTop: "1rem", textAlign: "center" }}>
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Nueva Contraseña</h1>

        <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
          La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.
        </p>

        {errorGeneral && <p className="error-message">{errorGeneral}</p>}

        <div className="input-group">
          <label htmlFor="new-password">Nueva contraseña</label>
          <input
            id="new-password"
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setErrors((prev) => ({ ...prev, newPassword: "" })); }}
            className={errors.newPassword ? "input-invalid" : ""}
            disabled={loading}
            required
          />
          {errors.newPassword && <span className="input-error-msg">{errors.newPassword}</span>}
        </div>

        <div className="input-group">
          <label htmlFor="confirm-password">Confirmar contraseña</label>
          <input
            id="confirm-password"
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirmPassword: "" })); }}
            className={errors.confirmPassword ? "input-invalid" : ""}
            disabled={loading}
            required
          />
          {errors.confirmPassword && <span className="input-error-msg">{errors.confirmPassword}</span>}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Establecer nueva contraseña"}
        </button>

        <Link to="/" style={{ marginTop: "1rem", display: "block", textAlign: "center" }}>
          ← Volver al inicio de sesión
        </Link>
      </form>
    </div>
  );
}

export default ResetPassword;
