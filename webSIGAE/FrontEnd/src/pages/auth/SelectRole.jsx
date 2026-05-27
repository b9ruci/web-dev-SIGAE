import { useNavigate } from "react-router-dom";

function SelectRole() {

  const navigate = useNavigate();

  const roles = [
    "Administrador",
    "Docente",
    "Apoderado",
  ];

  const handleSelectRole = (role) => {

    localStorage.setItem(
      "activeRole",
      role
    );

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

          {roles.map((role) => (

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