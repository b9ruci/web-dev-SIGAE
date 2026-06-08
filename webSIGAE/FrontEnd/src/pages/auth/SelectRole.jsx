import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function SelectRole() {

  const navigate = useNavigate();
  const { usuario, seleccionarRol } = useAuth();

  const handleSelectRole = (role) => {
    seleccionarRol(role);
    navigate("/dashboard");
  };

  return (

    <div className="select-role-container">

      <div className="select-role-card">

        <h1>
          Seleccionar Rol
        </h1>

        <p>
          Elige el rol con el que deseas ingresar
        </p>

        <div className="roles-container">

          {usuario?.roles?.map((role) => (

            <button
              key={role}
              className="role-button"
              onClick={() =>
                handleSelectRole(role)
              }
            >
              {role}
            </button>

          ))}

        </div>

      </div>

    </div>
  );
}

export default SelectRole;