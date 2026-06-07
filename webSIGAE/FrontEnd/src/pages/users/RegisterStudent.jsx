import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registrarEstudiante } from "../../services/api";

function RegisterStudent() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre         : "",
    rut            : "",
    curso          : "",
    estadoAcademico: "Regular",
  });

  const [cursos, setCursos]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Carga los cursos reales desde la BD al montar el componente
  useEffect(() => {
    fetch("/api/cursos", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => setCursos(Array.isArray(data) ? data : []))
      .catch(() => setCursos([]));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

          <input
            type="text"
            name="rut"
            placeholder="RUT"
            value={formData.rut}
            onChange={handleChange}
            required
          />

          {/* Los cursos vienen de /api/cursos con Curso_Id y Curso_Nombre */}
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
