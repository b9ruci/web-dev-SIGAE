import { useAuth } from "../context/AuthContext";

function Perfil() {

  const { usuario } = useAuth();

  return (

    <div className="page-container">

      <div className="form-card">

        <h1>Mi Perfil</h1>

        <p>
          <strong>Nombre:</strong>{" "}
          {usuario?.nombre}
        </p>

        <p>
          <strong>Correo:</strong>{" "}
          {usuario?.email}
        </p>

        <p>
          <strong>Rol:</strong>{" "}
          {usuario?.roles?.join(", ")}
        </p>

      </div>

    </div>
  );
}

export default Perfil;