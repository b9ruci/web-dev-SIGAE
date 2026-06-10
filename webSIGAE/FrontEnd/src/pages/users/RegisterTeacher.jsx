import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registrarDocente } from "../../services/api";

function RegisterTeacher() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre      : "",
    rut         : "",
    correo      : "",   // → Docente_Correo_Institucional
    telefono    : "",
    password    : "",
    especialidad: "",
    cargaHoraria: "",
    estado      : "Activo",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registrarDocente(formData);
      alert("Docente registrado correctamente");
      navigate("/usuarios");
    } catch (err) {

  if (
    err.data?.requiereAsignacionRol
  ) {

    alert(
      err.data.mensaje
    );

    navigate(
      `/gestion-roles/${err.data.usuarioId}`
    );

    return;
  }

  setError(
    err.message ||
    "Error al registrar el docente"
  );

}
     finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-card">
        <h1>Registrar Docente</h1>
        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input type="text"     name="nombre"       placeholder="Nombre completo"          value={formData.nombre}       onChange={handleChange} required />
          <input type="text"     name="rut"          placeholder="RUT"                      value={formData.rut}          onChange={handleChange} required />
          <input type="email"    name="correo"       placeholder="Correo institucional"     value={formData.correo}       onChange={handleChange} required />
          <input type="text"     name="telefono"     placeholder="Número telefónico"        value={formData.telefono}     onChange={handleChange} required />
          <input type="password" name="password"     placeholder="Contraseña"               value={formData.password}     onChange={handleChange} required />
          <input type="text"     name="especialidad" placeholder="Especialidad"             value={formData.especialidad} onChange={handleChange} required />
          <input type="number"   name="cargaHoraria" placeholder="Carga horaria máxima"    value={formData.cargaHoraria} onChange={handleChange} required />
          <select name="estado" value={formData.estado} onChange={handleChange}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          <button type="submit" disabled={loading}>
            {loading ? "Registrando..." : "Registrar Docente"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterTeacher;
