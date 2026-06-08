import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function Dashboard() {

  const { rolActivo } = useAuth();

  const [stats, setStats] = useState({
    usuarios: 0,
    docentes: 0,
    apoderados: 0,
    estudiantes: 0,
    cursos: 0,
    citaciones: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const cargarDashboard = async () => {

      try {

        const response = await fetch(
          "/api/dashboard/stats"
        );

        const data = await response.json();

        setStats(data);

      } catch (error) {

        console.error(
          "Error cargando dashboard:",
          error
        );

      } finally {

        setLoading(false);

      }

    };

    cargarDashboard();

  }, []);

  if (loading) {

    return <h2>Cargando dashboard...</h2>;

  }

  return (

    <div className="dashboard-container">

      <h1>
        Dashboard SIGAE
      </h1>

      <p>
        Bienvenido al Sistema de Gestión Académica Escolar
      </p>

      {rolActivo && (
        <p>
          Rol actual: {rolActivo}
        </p>
      )}

      <div className="dashboard-cards">

        <div className="card">
          <h3>Usuarios</h3>
          <p>{stats.usuarios}</p>
        </div>

        <div className="card">
          <h3>Docentes</h3>
          <p>{stats.docentes}</p>
        </div>

        <div className="card">
          <h3>Apoderados</h3>
          <p>{stats.apoderados}</p>
        </div>

        <div className="card">
          <h3>Estudiantes</h3>
          <p>{stats.estudiantes}</p>
        </div>

        <div className="card">
          <h3>Cursos</h3>
          <p>{stats.cursos}</p>
        </div>

        <div className="card">
          <h3>Citaciones</h3>
          <p>{stats.citaciones}</p>
        </div>

      </div>

      <div className="quick-actions">

        <h2>
          Accesos Rápidos
        </h2>

        <div className="actions-grid">

          <a href="/registrar-docente">
            Registrar Docente
          </a>

          <a href="/registrar-apoderado">
            Registrar Apoderado
          </a>

          <a href="/registrar-estudiante">
            Registrar Estudiante
          </a>

          <a href="/citaciones">
            Ver Citaciones
          </a>

        </div>

      </div>

    </div>

  );
}

export default Dashboard;