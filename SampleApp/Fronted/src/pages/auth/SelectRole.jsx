import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function SelectRole() {

  const navigate = useNavigate();

  const {
    user,
    setSelectedRole,
  } = useAuth();

  const handleSelectRole = (role) => {

    setSelectedRole(role);

    navigate("/dashboard");
  };

  if (!user) {

    return <h2>No hay usuario activo</h2>;
  }

  return (

    <div className="login-container">

      <div className="login-form">

        <h1>Seleccionar Rol</h1>

        <p>
          Elige con qué rol deseas ingresar
        </p>

        {user.roles.map((role) => (

          <button
            key={role}
            onClick={() =>
              handleSelectRole(role)
            }
          >
            {role}
          </button>

        ))}

      </div>

    </div>
  );
}

export default SelectRole;