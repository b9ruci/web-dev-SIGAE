const handleSubmit = async (e) => {

  e.preventDefault();

  try {

    const res = await fetch(
      "http://localhost:3000/api/usuarios",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Usuario_RUT: formData.rut,
          Usuario_Telefono: formData.telefono,
          Usuario_Nombre_Completo: formData.nombre,
          Usuario_Correo: formData.correo,
          Usuario_Contraseña: formData.password,
          Usuario_Estado_Cuenta:
            formData.estado === "Activo",

          Es_Apoderado: true,
          Apoderado_Direccion:
            formData.direccion,

          Es_Docente: false,
          Es_Administrador: false,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.mensaje);
    }

    alert(
      "Apoderado registrado correctamente"
    );

  } catch (error) {

    alert(error.message);
  }
};