import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

function Login() {

  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [rutError, setRutError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRutChange = (e) => {
    const valor = e.target.value;
    setRut(valor);
    setError("");
    if (valor && !validarRut(valor)) {
      setRutError("RUT inválido");
    } else {
      setRutError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarRut(rut)) {
      setRutError("RUT inválido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut, password }),
      });

      if (res.status === 401) {
        const data = await res.json();
        const msg = data.error || "";
        if (msg.toLowerCase().includes("deshabilitada")) {
          setError("Tu cuenta está deshabilitada. Contacta al administrador.");
        } else {
          setError("RUT o contraseña incorrectos. Verifica tus datos.");
        }
        return;
      }

      if (!res.ok) {
        setError("Ocurrió un error al iniciar sesión. Intenta nuevamente.");
        return;
      }

      const { user, token } = await res.json();
      login(user, token);
      if (user.roles.length > 1) navigate("/seleccionar-rol");
      else navigate("/dashboard");

    } catch {
      setError("No se pudo conectar con el servidor. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>

        <div className="login-logo">
          <span className="login-logo-icon">🎓</span>
          <h1>SIGAE</h1>
          <p>Sistema de Gestión Académica Escolar</p>
        </div>

        {error && (
          <div className="msg-error login-msg">
            {error}
          </div>
        )}

        <div className="input-group">
          <label htmlFor="rut">RUT</label>
          <input
            id="rut"
            type="text"
            placeholder="Ej: 12345678-9"
            value={rut}
            onChange={handleRutChange}
            className={rutError ? "input-invalid" : ""}
            required
          />
          {rutError && <span className="input-error-msg">{rutError}</span>}
        </div>

        <div className="input-group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>

        <div className="login-links">
          <Link to="/forgot-password">¿Olvidó su contraseña?</Link>
        </div>

      </form>
    </div>
  );
}

export default Login;
