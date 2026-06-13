import { useState } from "react";
import { validarCorreoInstitucional, validarCorreo, DOMINIO_INSTITUCIONAL } from "../../utils/validaciones";

function FormEditarUsuario({ datos, onGuardado }) {
  const [form, setForm] = useState({
    Usuario_Nombre_Completo: datos.Usuario_Nombre_Completo || "",
    Usuario_Telefono:        datos.Usuario_Telefono        || "",
    Docente_Especialidad:             datos.Docente_Especialidad             || "",
    Docente_Carga_Horaria_Maxima:     datos.Docente_Carga_Horaria_Maxima     || "",
    Docente_Correo_Institucional:     datos.Docente_Correo_Institucional     || "",
    Administrador_Correo_Institucional: datos.Administrador_Correo_Institucional || "",
    Apoderado_Direccion:   datos.Apoderado_Direccion   || "",
    Apoderado_Correo_Natural: datos.Apoderado_Correo_Natural || "",
  });
  const [errores, setErrores] = useState({});
  const [msgExito, setMsgExito] = useState("");
  const [msgError, setMsgError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const validarCampo = (name, value) => {
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
    Object.keys(form).forEach((name) => {
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
        body: JSON.stringify(form),
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
        <input name="Usuario_Nombre_Completo" value={form.Usuario_Nombre_Completo} onChange={handleChange} />
      </div>
      <div className="campo-pwd">
        <label>Teléfono</label>
        <input name="Usuario_Telefono" value={form.Usuario_Telefono} onChange={handleChange} />
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
          <div className="campo-pwd">
            <label>Dirección</label>
            <input name="Apoderado_Direccion" value={form.Apoderado_Direccion} onChange={handleChange} />
          </div>
        </>
      )}

      {msgExito && <div className="msg-exito">{msgExito}</div>}
      {msgError && <div className="msg-error-form">{msgError}</div>}

      <button type="submit" className="btn-primario" disabled={enviando}>
        {enviando ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

export default FormEditarUsuario;
