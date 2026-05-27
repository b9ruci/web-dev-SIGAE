import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const SelectRole = () => {
  const { usuario, seleccionarRol } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = (rol) => {
    seleccionarRol(rol);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">
          Selecciona un Rol
        </h1>

        <div className="space-y-4">
          {usuario?.roles?.map((rol) => (
            <button
              key={rol}
              onClick={() => handleSelectRole(rol)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
            >
              {rol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectRole;