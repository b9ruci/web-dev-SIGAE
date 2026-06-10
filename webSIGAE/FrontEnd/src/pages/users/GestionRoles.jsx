import { useEffect, useState } from "react";

function GestionRoles() {

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

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
            Authorization: `Bearer ${token}`
          }
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

  const actualizarRoles = async (usuario) => {

    try {

      const token = localStorage.getItem("token");

      const body = {

        Es_Administrador:
          usuario.Es_Administrador,

        Es_Docente:
          usuario.Es_Docente,

        Es_Apoderado:
          usuario.Es_Apoderado,

        Administrador_Tipo:
          usuario.Administrador_Tipo

      };

      const res = await fetch(
        `http://localhost:3000/api/usuarios/${usuario.Usuario_Id}/roles`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        }
      );

      const data = await res.json();

      alert(data.mensaje);

    } catch (error) {

      console.error(error);

      alert("Error al actualizar roles");

    }

  };

  const toggleRol = (
    id,
    campo
  ) => {

    setUsuarios((prev) =>
      prev.map((u) =>
        u.Usuario_Id === id
          ? {
              ...u,
              [campo]:
                u[campo] ? 0 : 1
            }
          : u
      )
    );

  };

  if (loading) {

    return <h2>Cargando usuarios...</h2>;

  }

  return (

    <div className="page-container">

      <h1>Gestión de Roles</h1>

      <table>

        <thead>

          <tr>

            <th>ID</th>

            <th>Nombre</th>

            <th>Administrador</th>

            <th>Docente</th>

            <th>Apoderado</th>

            <th>Guardar</th>

          </tr>

        </thead>

        <tbody>

          {usuarios.map((usuario) => (

            <tr
              key={usuario.Usuario_Id}
            >

              <td>
                {usuario.Usuario_Id}
              </td>

              <td>
                {
                  usuario.Usuario_Nombre_Completo
                }
              </td>

              <td>

                <input
                  type="checkbox"
                  checked={
                    !!usuario.Es_Administrador
                  }
                  onChange={() =>
                    toggleRol(
                      usuario.Usuario_Id,
                      "Es_Administrador"
                    )
                  }
                />

              </td>

              <td>

                <input
                  type="checkbox"
                  checked={
                    !!usuario.Es_Docente
                  }
                  onChange={() =>
                    toggleRol(
                      usuario.Usuario_Id,
                      "Es_Docente"
                    )
                  }
                />

              </td>

              <td>

                <input
                  type="checkbox"
                  checked={
                    !!usuario.Es_Apoderado
                  }
                  onChange={() =>
                    toggleRol(
                      usuario.Usuario_Id,
                      "Es_Apoderado"
                    )
                  }
                />

              </td>

              <td>

                <button
                  onClick={() =>
                    actualizarRoles(
                      usuario
                    )
                  }
                >
                  Guardar
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

export default GestionRoles;