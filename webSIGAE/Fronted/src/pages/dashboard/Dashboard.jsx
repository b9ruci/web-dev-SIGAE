function Dashboard() {

  // DATOS TEMPORALES
  // Después vendrán desde backend

  const totalUsuarios = 4;
  const totalDocentes = 1;
  const totalApoderados = 1;
  const totalEstudiantes = 1;
  const totalCursos = 1;
  const totalCitaciones = 1;

  return (

    <div className="dashboard-container">

      <h1>
        Dashboard SIGAE
      </h1>

      <p>
        Bienvenido al Sistema de Gestión Académica Escolar
      </p>

      {/* TARJETAS */}

      <div className="dashboard-cards">

        <div className="card">
          <h3>Usuarios</h3>
          <p>{totalUsuarios}</p>
        </div>

        <div className="card">
          <h3>Docentes</h3>
          <p>{totalDocentes}</p>
        </div>

        <div className="card">
          <h3>Apoderados</h3>
          <p>{totalApoderados}</p>
        </div>

        <div className="card">
          <h3>Estudiantes</h3>
          <p>{totalEstudiantes}</p>
        </div>

        <div className="card">
          <h3>Cursos</h3>
          <p>{totalCursos}</p>
        </div>

        <div className="card">
          <h3>Citaciones</h3>
          <p>{totalCitaciones}</p>
        </div>

      </div>

      {/* ACCESOS RÁPIDOS */}

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