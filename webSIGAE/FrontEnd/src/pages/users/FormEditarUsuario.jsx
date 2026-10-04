import { useState } from "react";
import {
  validarNombreCompleto, validarCorreoInstitucional, validarCorreo, DOMINIO_INSTITUCIONAL,
  validarTelefonoChileno, validarDireccion, MENSAJE_TELEFONO, MAX_NOMBRE_COMPLETO,
} from "../../utils/validaciones";

// Columnas de la dirección estructurada ↔ claves que usa validarDireccion.
// La dirección particular aplica a todo usuario, sin importar su rol.
const COLUMNAS_DIRECCION = {
  Usuario_Direccion_Calle : "calle",
  Usuario_Direccion_Numero: "numero",
  Usuario_Direccion_Depto : "depto",
  Usuario_Direccion_Comuna: "comuna",
};

const direccionDesdeForm = (f) =>
  Object.fromEntries(Object.entries(COLUMNAS_DIRECCION).map(([col, clave]) => [clave, f[col] || ""]));

// Campos que aplican a cada rol: solo esos se validan y se envían al backend
const CAMPOS_POR_ROL = {
  Es_Administrador: ["Administrador_Correo_Institucional"],
  Es_Docente: ["Docente_Correo_Institucional", "Docente_Especialidad", "Docente_Carga_Horaria_Maxima"],
  Es_Apoderado: ["Apoderado_Correo_Natural"],
};

function FormEditarUsuario({ datos, onGuardado }) {
  const [form, setForm] = useState({
    Usuario_Nombre_Completo: datos.Usuario_Nombre_Completo || "",
    Usuario_Telefono:        datos.Usuario_Telefono        || "",
    Docente_Especialidad:             datos.Docente_Especialidad             || "",
    Docente_Carga_Horaria_Maxima:     datos.Docente_Carga_Horaria_Maxima     || "",
    Docente_Correo_Institucional:     datos.Docente_Correo_Institucional     || "",
    Administrador_Correo_Institucional: datos.Administrador_Correo_Institucional || "",
    Usuario_Direccion_Calle:  datos.Usuario_Direccion_Calle  || "",
    Usuario_Direccion_Numero: datos.Usuario_Direccion_Numero || "",
    Usuario_Direccion_Depto:  datos.Usuario_Direccion_Depto  || "",
    Usuario_Direccion_Comuna: datos.Usuario_Direccion_Comuna || "",
    Apoderado_Correo_Natural: datos.Apoderado_Correo_Natural || "",
  });
  const [errores, setErrores] = useState({});
  const [msgExito, setMsgExito] = useState("");
  const [msgError, setMsgError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // La dirección es obligatoria para el apoderado; en los demás roles se valida y
  // envía solo si se ingresó (cuentas antiguas pueden no tenerla registrada)
  const incluyeDireccion =
    datos.Es_Apoderado || Object.keys(COLUMNAS_DIRECCION).some((col) => String(form[col]).trim() !== "");

  const camposAplicables = [
    "Usuario_Nombre_Completo",
    "Usuario_Telefono",
    ...(incluyeDireccion ? Object.keys(COLUMNAS_DIRECCION) : []),
    ...Object.entries(CAMPOS_POR_ROL).flatMap(([rol, campos]) => (datos[rol] ? campos : [])),
  ];

  const validarCampo = (name, value, datosForm = form) => {
    if (COLUMNAS_DIRECCION[name]) {
      return validarDireccion({ ...direccionDesdeForm(datosForm), [COLUMNAS_DIRECCION[name]]: value })[COLUMNAS_DIRECCION[name]] || "";
    }
    switch (name) {
      case "Usuario_Nombre_Completo":
        return !validarNombreCompleto(value)
          ? "Ingrese nombre y apellido, solo letras y espacios (ej: Juan Pérez)"
          : "";
      case "Usuario_Telefono":
        return !validarTelefonoChileno(value) ? MENSAJE_TELEFONO : "";
    }
    if (!value) return "";
    switch (name) {
      case "Administrador_Correo_Institucional":
      case "Docente_Correo_Institucional":
        return !validarCorreoInstitucional(value)
          ? `El correo debe pertenecer al dominio ${DOMINIO_INSTITUCIONAL}`
          : "";
      case "Apoderado_Correo_Natural":
        return !validarCorreo(value)
          ? "Ingrese un correo electrónico válido"
          : "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrores({ ...errores, [name]: validarCampo(name, value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsgExito("");
    setMsgError("");

    const nuevosErrores = {};
    camposAplicables.forEach((name) => {
      const msg = validarCampo(name, form[name]);
      if (msg) nuevosErrores[name] = msg;
    });

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setEnviando(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/usuarios/${datos.Usuario_Id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(Object.fromEntries(camposAplicables.map((name) => [name, form[name]]))),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsgError(data.mensaje || "Error al guardar cambios");
      } else {
        setMsgExito("Datos actualizados correctamente");
        if (onGuardado) onGuardado();
      }
    } catch {
      setMsgError("Error de conexión al servidor");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="cambiar-pwd-form" onSubmit={handleSubmit}>
      <div className="campo-pwd">
        <label>Nombre Completo</label>
        <input
          name="Usuario_Nombre_Completo"
          placeholder="Nombre completo (ej: Juan Pérez)"
          maxLength={MAX_NOMBRE_COMPLETO}
          value={form.Usuario_Nombre_Completo}
          onChange={handleChange}
          className={errores.Usuario_Nombre_Completo ? "input-invalid" : ""}
        />
        {errores.Usuario_Nombre_Completo && (
          <span className="input-error-msg">{errores.Usuario_Nombre_Completo}</span>
        )}
      </div>
      <div className="campo-pwd">
        <label>Teléfono</label>
        <input
          type="tel"
          name="Usuario_Telefono"
          placeholder="912345678 o +56912345678"
          value={form.Usuario_Telefono}
          onChange={handleChange}
          className={errores.Usuario_Telefono ? "input-invalid" : ""}
        />
        {errores.Usuario_Telefono && (
          <span className="input-error-msg">{errores.Usuario_Telefono}</span>
        )}
      </div>

      {datos.Es_Administrador && (
        <div className="campo-pwd">
          <label>Correo Institucional (Administrador)</label>
          <input
            name="Administrador_Correo_Institucional"
            value={form.Administrador_Correo_Institucional}
            onChange={handleChange}
            className={errores.Administrador_Correo_Institucional ? "input-invalid" : ""}
            placeholder={`nombre${DOMINIO_INSTITUCIONAL}`}
          />
          {errores.Administrador_Correo_Institucional && (
            <span className="input-error-msg">{errores.Administrador_Correo_Institucional}</span>
          )}
        </div>
      )}

      {datos.Es_Docente && (
        <>
          <div className="campo-pwd">
            <label>Correo Institucional (Docente)</label>
            <input
              name="Docente_Correo_Institucional"
              value={form.Docente_Correo_Institucional}
              onChange={handleChange}
              className={errores.Docente_Correo_Institucional ? "input-invalid" : ""}
              placeholder={`nombre${DOMINIO_INSTITUCIONAL}`}
            />
            {errores.Docente_Correo_Institucional && (
              <span className="input-error-msg">{errores.Docente_Correo_Institucional}</span>
            )}
          </div>
          <div className="campo-pwd">
            <label>Especialidad</label>
            <input name="Docente_Especialidad" value={form.Docente_Especialidad} onChange={handleChange} />
          </div>
          <div className="campo-pwd">
            <label>Carga Horaria Máxima (hrs)</label>
            <input type="number" name="Docente_Carga_Horaria_Maxima" value={form.Docente_Carga_Horaria_Maxima} onChange={handleChange} min="1" max="44" />
          </div>
        </>
      )}

      {datos.Es_Apoderado && (
        <>
          <div className="campo-pwd">
            <label>Correo Personal (Apoderado)</label>
            <input
              name="Apoderado_Correo_Natural"
              value={form.Apoderado_Correo_Natural}
              onChange={handleChange}
              className={errores.Apoderado_Correo_Natural ? "input-invalid" : ""}
            />
            {errores.Apoderado_Correo_Natural && (
              <span className="input-error-msg">{errores.Apoderado_Correo_Natural}</span>
            )}
          </div>
        </>
      )}

      {/* Dirección particular: todo usuario (Incremento 3) */}
      {[
        { name: "Usuario_Direccion_Calle",  label: "Calle",                   maxLength: 100 },
        { name: "Usuario_Direccion_Numero", label: "Número",                  maxLength: 7 },
        { name: "Usuario_Direccion_Depto",  label: "Depto./Casa (opcional)",  maxLength: 20 },
        { name: "Usuario_Direccion_Comuna", label: "Comuna",                  maxLength: 60 },
      ].map((campo) => (
        <div className="campo-pwd" key={campo.name}>
          <label>{campo.label}</label>
          <input
            name={campo.name}
            maxLength={campo.maxLength}
            value={form[campo.name]}
            onChange={handleChange}
            className={errores[campo.name] ? "input-invalid" : ""}
          />
          {errores[campo.name] && <span className="input-error-msg">{errores[campo.name]}</span>}
        </div>
      ))}

      {msgExito && <div className="msg-exito">{msgExito}</div>}
      {msgError && <div className="msg-error-form">{msgError}</div>}

      <button type="submit" className="btn-primario" disabled={enviando}>
        {enviando ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

export default FormEditarUsuario;
