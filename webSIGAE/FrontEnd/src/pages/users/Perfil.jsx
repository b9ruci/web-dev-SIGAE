import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import FormEditarUsuario from "./FormEditarUsuario";
import { apiFetch } from "../../services/api";

function Perfil() {
  const { usuario } = useAuth();
  const { id: idParam } = useParams();
  const idObjetivo = idParam || usuario?.id;
  const esPerfilPropio = !idParam || String(idParam) === String(usuario?.id);

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [msgExito, setMsgExito] = useState("");
  const [msgError, setMsgError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!idObjetivo) return;
    apiFetch(`/api/usuarios/${idObjetivo}`)
      .then((r) => {
        if (!r || !r.ok) throw new Error(`HTTP ${r?.status}`);
        return r.json();
      })
      .then((data) => setDatos(data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [idObjetivo]);

  const recargarDatos = () => {
    apiFetch(`/api/usuarios/${idObjetivo}`)
      .then((r) => {
        if (!r || !r.ok) throw new Error(`HTTP ${r?.status}`);
        return r.json();
      })
      .then((data) => setDatos(data))
      .catch(console.error);
  };

  const getRoles = () => {
    if (!datos) return [];
    const roles = [];
    if (datos.Es_Administrador) roles.push("Administrador");
    if (datos.Es_Docente) roles.push("Docente");
    if (datos.Es_Apoderado) roles.push("Apoderado");
    return roles;
  };

  const getBadgeRol = (rol) => {
    if (rol === "Administrador") {
      if (datos?.Administrador_Tipo === "SuperAdmin") {
        return <span key="superadmin" className="badge-rol badge-superadmin">Super Administrador</span>;
      }
      return <span key="admin" className="badge-rol badge-admin">Administrador</span>;
    }
    if (rol === "Docente") return <span key="docente" className="badge-rol badge-docente">Docente</span>;
    if (rol === "Apoderado") return <span key="apoderado" className="badge-rol badge-apoderado">Apoderado</span>;
    return null;
  };

  const getCorreos = () => {
    if (!datos) return [];
    const correos = [];
    if (datos.Administrador_Correo_Institucional) correos.push(datos.Administrador_Correo_Institucional);
    if (datos.Docente_Correo_Institucional) correos.push(datos.Docente_Correo_Institucional);
    if (datos.Apoderado_Correo_Natural) correos.push(datos.Apoderado_Correo_Natural);
    return [...new Set(correos)];
  };

  const handleCambiarContrasena = async (e) => {
    e.preventDefault();
    setMsgExito("");
    setMsgError("");

    if (nuevaContrasena !== confirmarContrasena) {
      setMsgError("Las contraseñas nuevas no coinciden");
      return;
    }
    if (nuevaContrasena.length < 8) {
      setMsgError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (!/[A-Z]/.test(nuevaContrasena) || !/[0-9]/.test(nuevaContrasena)) {
      setMsgError("La nueva contraseña debe contener al menos una mayúscula y un número");
      return;
    }

    setEnviando(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/cambiar-contrasena", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          usuarioId: usuario.id,
          contrasenaActual,
          nuevaContrasena,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsgError(data.error || "Error al actualizar contraseña");
      } else {
        setMsgExito(data.message || "Contraseña actualizada correctamente");
        setContrasenaActual("");
        setNuevaContrasena("");
        setConfirmarContrasena("");
      }
    } catch {
      setMsgError("Error de conexión al servidor");
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <div className="perfil-container"><p>Cargando perfil...</p></div>;
  if (!datos) return <div className="perfil-container"><p>No se pudo cargar el perfil.</p></div>;

  const roles = getRoles();
  const correos = getCorreos();

  const puedeEditar = (() => {
    if (esPerfilPropio) return false;
    if (!datos) return false;
    const esSuperAdmin = usuario?.administradorTipo === "SuperAdmin";
    const esAdmin = (usuario?.roles || []).includes("Administrador");
    const objetivoEsSuperAdmin = datos.Es_Administrador && datos.Administrador_Tipo === "SuperAdmin";
    const objetivoEsAdmin = datos.Es_Administrador && datos.Administrador_Tipo !== "SuperAdmin";
    if (objetivoEsSuperAdmin) return false;
    if (objetivoEsAdmin) return esSuperAdmin;
    return esSuperAdmin || esAdmin;
  })();

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h1>{esPerfilPropio ? "Mi Perfil" : `Perfil de ${datos?.Usuario_Nombre_Completo || "Usuario"}`}</h1>
        <p>{esPerfilPropio ? "Información de tu cuenta en SIGAE" : "Vista de perfil (solo lectura)"}</p>
      </div>

      <div className="perfil-card">
        <h2>Información Personal</h2>
        <div className="perfil-grid">
          <div className="perfil-campo">
            <label>Nombre Completo</label>
            <span>{datos?.Usuario_Nombre_Completo || "Sin nombre registrado"}</span>
          </div>
          <div className="perfil-campo">
            <label>RUT</label>
            <span>{datos?.Usuario_RUT || "Sin RUT registrado"}</span>
          </div>
          <div className="perfil-campo">
            <label>Teléfono</label>
            <span>{datos?.Usuario_Telefono || "Sin teléfono registrado"}</span>
          </div>
          <div className="perfil-campo">
            <label>Estado de Cuenta</label>
            <span>
              {datos?.Usuario_Estado_Cuenta
                ? <span className="badge-activo">Activo</span>
                : <span className="badge-inactivo">Inactivo</span>}
            </span>
          </div>
          <div className="perfil-campo" style={{ gridColumn: "1 / -1" }}>
            <label>Correo(s)</label>
            <span>{correos.length > 0 ? correos.join(" · ") : "Sin correos registrados"}</span>
          </div>
          <div className="perfil-campo" style={{ gridColumn: "1 / -1" }}>
            <label>Roles</label>
            <div className="perfil-roles">
              {roles.length > 0
                ? roles.map((r) => getBadgeRol(r))
                : <span>Sin roles asignados</span>}
            </div>
          </div>
          {datos?.Es_Docente ? (
            <>
              <div className="perfil-campo">
                <label>Especialidad</label>
                <span>{datos.Docente_Especialidad || "Sin especialidad registrada"}</span>
              </div>
              <div className="perfil-campo">
                <label>Carga Horaria Máxima</label>
                <span>{datos.Docente_Carga_Horaria_Maxima || "Sin carga horaria registrada"} hrs</span>
              </div>
            </>
          ) : null}
          {datos?.Es_Apoderado ? (
            <div className="perfil-campo" style={{ gridColumn: "1 / -1" }}>
              <label>Dirección</label>
              <span>{datos.Apoderado_Direccion || "Sin dirección registrada"}</span>
            </div>
          ) : null}
        </div>
      </div>

      {esPerfilPropio && (
        <div className="perfil-card">
          <h2>Cambiar Contraseña</h2>
          <form className="cambiar-pwd-form" onSubmit={handleCambiarContrasena}>
            <div className="campo-pwd">
              <label htmlFor="contrasenaActual">Contraseña Actual</label>
              <input
                id="contrasenaActual"
                type="password"
                value={contrasenaActual}
                onChange={(e) => setContrasenaActual(e.target.value)}
                required
              />
            </div>
            <div className="campo-pwd">
              <label htmlFor="nuevaContrasena">Nueva Contraseña</label>
              <input
                id="nuevaContrasena"
                type="password"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                required
              />
              <span className="pwd-error" style={{ display: nuevaContrasena && nuevaContrasena.length < 8 ? "block" : "none" }}>
                Mínimo 8 caracteres, una mayúscula y un número
              </span>
            </div>
            <div className="campo-pwd">
              <label htmlFor="confirmarContrasena">Confirmar Nueva Contraseña</label>
              <input
                id="confirmarContrasena"
                type="password"
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                className={confirmarContrasena && confirmarContrasena !== nuevaContrasena ? "input-invalid" : ""}
                required
              />
            </div>
            {msgExito && <div className="msg-exito">{msgExito}</div>}
            {msgError && <div className="msg-error-form">{msgError}</div>}
            <button type="submit" className="btn-primario" disabled={enviando}>
              {enviando ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        </div>
      )}

      {puedeEditar && (
        <div className="perfil-card">
          <h2>Editar Datos</h2>
          <FormEditarUsuario datos={datos} onGuardado={recargarDatos} />
        </div>
      )}

    </div>
  );
}

export default Perfil;