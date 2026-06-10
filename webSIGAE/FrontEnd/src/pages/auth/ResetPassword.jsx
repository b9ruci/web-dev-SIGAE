import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [estadoToken, setEstadoToken] = useState("validando"); // validando | valido | invalido | error_red
  const [mensajeToken, setMensajeToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  const validarToken = () => {
    if (!token) {
      setEstadoToken("invalido");
      setMensajeToken("No se proporcionó un enlace de recuperación válido.");
      return;
    }

    fetch(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.valid) {
          setEstadoToken("valido");
        } else {
          setEstadoToken("invalido");
          setMensajeToken(data.error || "El enlace no es válido o ha expirado.");
        }
      })
      .catch((err) => {
        console.error("validate-reset-token error:", err);
        setEstadoToken("error_red");
        setMensajeToken("No se pudo conectar con el servidor. Verifica que el backend esté corriendo.");
      });
  };

  useEffect(() => {
    validarToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /* ── Pantalla de carga ── */
  if (estadoToken === "validando") {
    return (
      <div className="login-container">
        <div className="login-form">
          <h1>Verificando enlace...</h1>
          <p style={{ color: "#64748b" }}>Por favor espera un momento.</p>
        </div>
      </div>
    );
  }

  /* ── Error de red (backend no disponible) ── */
  if (estadoToken === "error_red") {
    return (
      <div className="login-container">
        <div className="login-form">
          <h1 style={{ color: "#b91c1c" }}>Sin conexión con el servidor</h1>
          <div className="error-message">{mensajeToken}</div>
          <button
            onClick={() => { setEstadoToken("validando"); setMensajeToken(""); validarToken(); }}
            style={{ marginTop: "1rem", width: "100%" }}
          >
            Reintentar
          </button>
          <Link to="/forgot-password" style={{ display: "block", marginTop: "0.75rem", textAlign: "center" }}>
            Solicitar nuevo enlace
          </Link>
          <Link to="/" style={{ display: "block", marginTop: "0.5rem", textAlign: "center" }}>
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  /* ── Token inválido / expirado ── */
  if (estadoToken === "invalido") {
    return (
      <div className="login-container">
        <div className="login-form">
          <h1 style={{ color: "#b91c1c" }}>Enlace no válido</h1>
          <div className="error-message">{mensajeToken}</div>
          <Link
            to="/forgot-password"
            style={{ display: "block", marginTop: "1rem", textAlign: "center", fontWeight: 600 }}
          >
            Solicitar un nuevo enlace
          </Link>
          <Link to="/" style={{ display: "block", marginTop: "0.5rem", textAlign: "center", color: "#64748b" }}>
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  /* ── Éxito ── */
  if (exito) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h1>¡Contraseña actualizada!</h1>
          <div className="success-message">
            Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </div>
          <button onClick={() => navigate("/")} style={{ marginTop: "1rem", width: "100%" }}>
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  /* ── Formulario ── */
  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Nueva Contraseña</h1>
        <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "1rem" }}>
          Mínimo 8 caracteres, al menos una mayúscula y un número.
        </p>

        {errorGeneral && <div className="error-message">{errorGeneral}</div>}

        <div className="input-group">
          <label htmlFor="new-password">Nueva contraseña</label>
          <input
            id="new-password"
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, newPassword: "" })); }}
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
            onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: "" })); }}
            className={errors.confirmPassword ? "input-invalid" : ""}
            disabled={loading}
            required
          />
          {errors.confirmPassword && <span className="input-error-msg">{errors.confirmPassword}</span>}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Establecer nueva contraseña"}
        </button>

        <Link to="/" style={{ marginTop: "1rem", display: "block", textAlign: "center", color: "#64748b" }}>
          ← Volver al inicio de sesión
        </Link>
      </form>
    </div>
  );
}

export default ResetPassword;
