import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function Usuarios() {

  const { usuario } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const [roles, setRoles] = useState({
    Es_Administrador: false,
    Es_Docente: false,
    Es_Apoderado: false,
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {

    try {

      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:3000/api/usuarios",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setUsuarios(data);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }
  };

  const eliminarUsuario = async (id) => {

    if (!window.confirm("¿Eliminar usuario?")) {
      return;
    }

    try {

      const token = localStorage.getItem("token");

      await fetch(
        `http://localhost:3000/api/usuarios/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      cargarUsuarios();

    } catch (error) {

      console.error(error);

    }
  };

  const abrirRoles = (usuario) => {

    setUsuarioSeleccionado(usuario);

    setRoles({
      Es_Administrador: !!usuario.Es_Administrador,
      Es_Docente: !!usuario.Es_Docente,
      Es_Apoderado: !!usuario.Es_Apoderado,
    });
  };

  const guardarRoles = async () => {

    try {

      const token = localStorage.getItem("token");

      await fetch(
        `http://localhost:3000/api/usuarios/${usuarioSeleccionado.Usuario_Id}/roles`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(roles),
        }
      );

      setUsuarioSeleccionado(null);

      cargarUsuarios();

      alert("Roles actualizados");

    } catch (error) {

      console.error(error);

      alert("Error al actualizar roles");

    }
  };

  if (loading) {
    return <h2>Cargando...</h2>;
  }

  return (

    <div className="page-container">

      <h1>Usuarios</h1>

      <table>

        <thead>

          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>RUT</th>
            <th>Roles</th>
            <th>Acciones</th>
          </tr>

        </thead>

        <tbody>

          {usuarios.map((usuarioFila) => (

            <tr key={usuarioFila.Usuario_Id}>

              <td>{usuarioFila.Usuario_Id}</td>

              <td>
                {usuarioFila.Usuario_Nombre_Completo}
              </td>

              <td>
                {usuarioFila.Usuario_RUT}
              </td>

              <td>

                {usuarioFila.Es_Administrador ? "Administrador " : ""}
                {usuarioFila.Es_Docente ? "Docente " : ""}
                {usuarioFila.Es_Apoderado ? "Apoderado" : ""}

              </td>

              <td>

                <button
                  onClick={() =>
                    eliminarUsuario(
                      usuarioFila.Usuario_Id
                    )
                  }
                >
                  Eliminar
                </button>

                {usuario?.administradorTipo === "SuperAdmin" && (

                  <button
                    onClick={() =>
                      abrirRoles(usuarioFila)
                    }
                  >
                    Gestionar Roles
                  </button>

                )}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {usuarioSeleccionado && (

        <div className="form-card">

          <h2>
            Roles de {usuarioSeleccionado.Usuario_Nombre_Completo}
          </h2>

          <label>

            <input
              type="checkbox"
              checked={roles.Es_Administrador}
              onChange={(e) =>
                setRoles({
                  ...roles,
                  Es_Administrador: e.target.checked,
                })
              }
            />

            Administrador

          </label>

          <br />

          <label>

            <input
              type="checkbox"
              checked={roles.Es_Docente}
              onChange={(e) =>
                setRoles({
                  ...roles,
                  Es_Docente: e.target.checked,
                })
              }
            />

            Docente

          </label>

          <br />

          <label>

            <input
              type="checkbox"
              checked={roles.Es_Apoderado}
              onChange={(e) =>
                setRoles({
                  ...roles,
                  Es_Apoderado: e.target.checked,
                })
              }
            />

            Apoderado

          </label>

          <br />
          <br />

          <button onClick={guardarRoles}>
            Guardar
          </button>

          <button
            onClick={() =>
              setUsuarioSeleccionado(null)
            }
          >
            Cancelar
          </button>

        </div>

      )}

    </div>

  );
}

export default Usuarios;