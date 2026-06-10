import { useState } from "react";
import { Link } from "react-router-dom";

function validarRut(rutCompleto) {
  if (!/^\d{7,8}-[\dkK]$/.test(rutCompleto)) return false;
  const [cuerpo, dvIngresado] = rutCompleto.split("-");
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const dvEsperado = 11 - (suma % 11);
  const dv = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "k" : String(dvEsperado);
  return dv === dvIngresado.toLowerCase();
}

// Pasos: "rut" → "seleccionar" (si hay múltiples correos) → "enviado"
function ForgotPassword() {
  const [paso, setPaso] = useState("rut");
  const [rut, setRut] = useState("");
  const [rutError, setRutError] = useState("");
  const [correos, setCorreos] = useState([]);
  const [correoSeleccionado, setCorreoSeleccionado] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devResetLink, setDevResetLink] = useState("");

  const handleRutChange = (e) => {
    const valor = e.target.value;
    setRut(valor);
    setError("");
    if (valor && !validarRut(valor)) {
      setRutError("RUT inválido (ej: 12345678-9)");
    } else {
      setRutError("");
    }
  };

  const handleSubmitRut = async (e) => {
    e.preventDefault();
    if (!validarRut(rut)) {
      setRutError("RUT inválido");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/check-recovery-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al consultar");

      const lista = data.correos || [];

      if (lista.length === 0) {
        // No revelar si el RUT existe; mostrar mensaje genérico
        setPaso("enviado");
        return;
      }

      if (lista.length === 1) {
        // Solo un correo: enviar directamente sin pedir selección
        await enviarEnlace(null);
      } else {
        // Múltiples correos: pedir selección
        setCorreos(lista);
        setCorreoSeleccionado(lista[0].enmascarado);
        setPaso("seleccionar");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const enviarEnlace = async (enmascarado) => {
    setLoading(true);
    setError("");
    try {
      const body = enmascarado
        ? { rut, correoEnmascarado: enmascarado }
        : { rut };

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar el enlace");
      if (data.devResetLink) setDevResetLink(data.devResetLink);
      setPaso("enviado");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSeleccion = async (e) => {
    e.preventDefault();
    await enviarEnlace(correoSeleccionado);
  };

  return (
    <div className="login-container">
      <form
        className="login-form"
        onSubmit={
          paso === "seleccionar" ? handleSubmitSeleccion : handleSubmitRut
        }
      >
        <h1>Recuperar Contraseña</h1>

        {paso === "rut" && (
          <>
            <p>
              Ingresa tu RUT para identificar tu cuenta y recibir el enlace de
              recuperación.
            </p>

            <div className="input-group">
              <label htmlFor="rut">RUT</label>
              <input
                id="rut"
                type="text"
                placeholder="Ej: 12345678-9"
                value={rut}
                onChange={handleRutChange}
                className={rutError ? "input-invalid" : ""}
                disabled={loading}
                required
              />
              {rutError && <span className="input-error-msg">{rutError}</span>}
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Consultando..." : "Continuar"}
            </button>
          </>
        )}

        {paso === "seleccionar" && (
          <>
            <p>
              Tu cuenta tiene más de un correo registrado. Elige a cuál deseas
              que se envíe el enlace de recuperación:
            </p>

            <div className="input-group">
              <label htmlFor="correo-select">Correo destino</label>
              <select
                id="correo-select"
                value={correoSeleccionado}
                onChange={(e) => setCorreoSeleccionado(e.target.value)}
                disabled={loading}
              >
                {correos.map((c) => (
                  <option key={c.enmascarado} value={c.enmascarado}>
                    {c.tipo}: {c.enmascarado}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setPaso("rut"); setError(""); }}
              disabled={loading}
              style={{ marginTop: "0.5rem" }}
            >
              ← Cambiar RUT
            </button>
          </>
        )}

        {paso === "enviado" && (
          <>
            <div className="success-message">
              <p>
                Si el RUT ingresado corresponde a una cuenta activa, recibirás un
                enlace de recuperación en el correo seleccionado.
              </p>
              <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                El enlace es válido por <strong>30 minutos</strong>. Revisa tu
                bandeja de entrada y también la carpeta de spam.
              </p>
            </div>
            {devResetLink && (() => {
              let devResetPath = devResetLink;
              try {
                const parsed = new URL(devResetLink);
                devResetPath = parsed.pathname + parsed.search;
              } catch (_) {}
              return (
                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#fef3c7", border: "1px solid #d97706", borderRadius: "6px" }}>
                  <p style={{ fontSize: "0.8rem", color: "#92400e", marginBottom: "0.5rem", fontWeight: 600 }}>
                    Modo desarrollo — enlace de prueba:
                  </p>
                  <Link
                    to={devResetPath}
                    style={{ display: "block", wordBreak: "break-all", fontSize: "0.78rem", color: "#1d4ed8", marginBottom: "0.75rem" }}
                  >
                    {devResetLink}
                  </Link>
                  <Link
                    to={devResetPath}
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "0.5rem 1rem",
                      background: "#1d4ed8",
                      color: "#fff",
                      borderRadius: "4px",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Ir a restablecer contraseña →
                  </Link>
                </div>
              );
            })()}
          </>
        )}

        <Link
          to="/"
          style={{ marginTop: "1rem", display: "block", textAlign: "center" }}
        >
          ← Volver al inicio de sesión
        </Link>
      </form>
    </div>
  );
}

export default ForgotPassword;
