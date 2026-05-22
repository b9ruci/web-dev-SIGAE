function Dashboard() {
  return (
    <div>

      <h1>Dashboard SIGAE</h1>

      <p>
        Bienvenido al sistema de gestión académica escolar.
      </p>

      <div className="cards-container">

        <div className="dashboard-card">
          <h3>Usuarios</h3>
          <p>Gestión de cuentas institucionales</p>
        </div>

        <div className="dashboard-card">
          <h3>Horarios</h3>
          <p>Administración académica</p>
        </div>

        <div className="dashboard-card">
          <h3>Citaciones</h3>
          <p>Comunicación docente-apoderado</p>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;