import { useEffect, useState } from "react";

function Usuarios() {

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {

      const res = await fetch(
        "http://localhost:3000/api/usuarios"
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

      await fetch(
        `http://localhost:3000/api/usuarios/${id}`,
        {
          method: "DELETE",
        }
      );

      cargarUsuarios();

    } catch (error) {

      console.error(error);
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
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>

        </thead>

        <tbody>

          {usuarios.map((usuario) => (

            <tr key={usuario.Usuario_Id}>

              <td>{usuario.Usuario_Id}</td>

              <td>
                {usuario.Usuario_Nombre_Completo}
              </td>

              <td>
                {usuario.Usuario_Correo}
              </td>

              <td>
                {usuario.Usuario_Telefono}
              </td>

              <td>

                <button
                  onClick={() =>
                    eliminarUsuario(
                      usuario.Usuario_Id
                    )
                  }
                >
                  Eliminar
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default Usuarios;