function Dashboard() {

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">

        <h1>Panel Principal</h1>

        <p>
          Bienvenido al Sistema de Gestión
          Académica Escolar
        </p>

      </div>

      <div className="dashboard-grid">

        <div className="dashboard-card">
          <h2>Usuarios</h2>

          <p>
            Gestión de administradores,
            docentes y apoderados
          </p>
        </div>

        <div className="dashboard-card">
          <h2>Estudiantes</h2>

          <p>
            Registro y visualización
            de estudiantes
          </p>
        </div>

        <div className="dashboard-card">
          <h2>Horarios</h2>

          <p>
            Gestión de bloques horarios
            y planificación académica
          </p>
        </div>

        <div className="dashboard-card">
          <h2>Citaciones</h2>

          <p>
            Comunicación entre docentes
            y apoderados
          </p>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;