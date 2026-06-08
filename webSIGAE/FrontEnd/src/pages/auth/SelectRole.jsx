import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function SelectRole() {

  const navigate = useNavigate();

  const {
    usuario,
    seleccionarRol,
  } = useAuth();

  const handleSelectRole = (rol) => {

    seleccionarRol(rol);

    navigate("/dashboard");
  };

  if (!usuario) {

    return <p>Cargando...</p>;
  }

  return (

    <div className="page-container">

      <div className="form-card">

        <h1>Seleccionar Rol</h1>

        <p>
          Bienvenido {usuario.nombre}
        </p>

        {usuario.roles.map((rol) => (

          <button
            key={rol}
            onClick={() =>
              handleSelectRole(rol)
            }
          >
            {rol}
          </button>

        ))}

      </div>

    </div>
  );
}

export default SelectRole;
