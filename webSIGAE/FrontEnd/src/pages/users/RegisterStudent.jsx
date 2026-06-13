import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registrarEstudiante } from "../../services/api";
import { validarRut } from "../../utils/validaciones";

function RegisterStudent() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre         : "",
    rut            : "",
    curso          : "",
    estadoAcademico: "Regular",
  });

  const [cursos, setCursos]   = useState([]);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetch("/api/cursos", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => setCursos(Array.isArray(data) ? data : []))
      .catch(() => setCursos([]));
  }, []);

  const validarCampo = (name, value) => {
    if (name === "rut" && value && !validarRut(value)) {
      return "RUT inválido. Formato esperado: 12345678-9";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrores({ ...errores, [name]: validarCampo(name, value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nuevosErrores = {
      rut: validarCampo("rut", formData.rut),
    };

    if (Object.values(nuevosErrores).some((msg) => msg)) {
      setErrores(nuevosErrores);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await registrarEstudiante(formData);
      alert("Ficha estudiantil registrada correctamente");
      navigate("/usuarios");
    } catch (err) {
      setError(err.message || "Error al registrar el estudiante");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-card">
        <h1>Registrar Ficha Estudiantil</h1>

        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre completo"
            value={formData.nombre}
            onChange={handleChange}
            required
          />

          <div>
            <input
              type="text"
              name="rut"
              placeholder="RUT (ej: 12345678-9)"
              value={formData.rut}
              onChange={handleChange}
              className={errores.rut ? "input-invalid" : ""}
              required
            />
            {errores.rut && <span className="input-error-msg">{errores.rut}</span>}
          </div>

          <select
            name="curso"
            value={formData.curso}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione un curso</option>
            {cursos.map((c) => (
              <option key={c.Curso_Id} value={c.Curso_Id}>
                {c.Curso_Nombre}
              </option>
            ))}
          </select>

          <select
            name="estadoAcademico"
            value={formData.estadoAcademico}
            onChange={handleChange}
          >
            <option value="Regular">Regular</option>
            <option value="Irregular">Irregular</option>
            <option value="Retirado">Retirado</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Registrando..." : "Registrar Estudiante"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterStudent;
