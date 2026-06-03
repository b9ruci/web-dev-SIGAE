import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";


function Cursos() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles?.some(r => r === 'Administrador' || r === 'Super Admin'); // es admin
  
  const [cursos, setCursos] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nivelId, setNivelId] = useState("");
  const [seccion, setSeccion] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [cargando, setCargando] = useState(true);

  const token = localStorage.getItem("token");

  const cargarDatos = async () => {
    try {
      const [resCursos, resNiveles] = await Promise.all([
        fetch("/api/cursos", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/cursos/niveles", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setCursos(await resCursos.json());
      setNiveles(await resNiveles.json());
    } catch {
      setError("Error al cargar los datos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    const res = await fetch("/api/cursos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nivel_educativo_id: nivelId, seccion }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setExito(data.mensaje);
    setNivelId("");
    setSeccion("");
    setMostrarForm(false);
    cargarDatos();
  };

  // Agrupar por nivel
  const cursosAgrupados = cursos.reduce((acc, curso) => {
    const nivel = curso.Nivel_Educativo_Nombre;
    if (!acc[nivel]) acc[nivel] = [];
    acc[nivel].push(curso);
    return acc;
  }, {});

  if (cargando) return <div className="page-container"><p>Cargando cursos...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Cursos</h1>
          <p>Gestión de cursos por nivel educativo</p>
        </div>
        {esAdmin && (
          <button
            className="btn-primary"
            onClick={() => { setMostrarForm(!mostrarForm); setError(""); setExito(""); }}
          >
            {mostrarForm ? "Cancelar" : "+ Registrar Curso"}
          </button>
        )}
      </div>

      {exito && <p className="msg-exito">{exito}</p>}
      {error && <p className="msg-error">{error}</p>}

      {mostrarForm && (
        <div className="form-card">
          <h2>Nuevo Curso</h2>
          <form onSubmit={handleSubmit}>
            <label>Nivel Educativo</label>
            <select value={nivelId} onChange={(e) => setNivelId(e.target.value)} required>
              <option value="">Seleccionar nivel...</option>
              {niveles.map((n) => (
                <option key={n.Nivel_Educativo_Id} value={n.Nivel_Educativo_Id}>
                  {n.Nivel_Educativo_Nombre}
                </option>
              ))}
            </select>

            <label>Sección (letra A-Z)</label>
            <input
              type="text"
              maxLength={1}
              placeholder="Ej: A"
              value={seccion}
              onChange={(e) => setSeccion(e.target.value.toUpperCase())}
              required
            />

            <button type="submit" className="btn-primary">
              Registrar
            </button>
          </form>
        </div>
      )}

      {Object.keys(cursosAgrupados).length === 0 ? (
        <div className="empty-state">
          <p>No hay cursos registrados aún.</p>
        </div>
      ) : (
        Object.entries(cursosAgrupados).map(([nivel, lista]) => (
          <div key={nivel} className="cursos-grupo">
            <h3>{nivel}</h3>
            <div className="cursos-grid">
              {lista.map((c) => (
                <div key={c.Curso_Id} className="curso-card">
                  {c.Curso_Nombre}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Cursos;