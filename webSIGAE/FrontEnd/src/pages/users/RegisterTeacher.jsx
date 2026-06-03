import { useState } from "react";

function RegisterTeacher() {
  const [formData, setFormData] = useState({
    rut: "",
    telefono: "",
    nombre: "",
    correo: "",
    password: "",
    estado: "Activo",
    cargaHoraria: "",
    especialidad: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/api/usuarios", {
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
          Usuario_Estado_Cuenta: formData.estado === "Activo",
          Es_Docente: true,
          Docente_Carga_Horaria_Maxima: formData.cargaHoraria,
          Docente_Especialidad: formData.especialidad,
          Es_Administrador: false,
          Es_Apoderado: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.mensaje);
      }
      alert("Docente registrado correctamente");
    } catch (error) {
      alert(error.message);
    }
  };

  // Formulario básico (puedes agregar estilos después)
  return (
    <div style={{ maxWidth: "500px", margin: "auto", padding: "1rem" }}>
      <h2>Registrar Docente</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="RUT" value={formData.rut} onChange={(e) => setFormData({ ...formData, rut: e.target.value })} required />
        <br />
        <input type="text" placeholder="Nombre completo" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
        <br />
        <input type="tel" placeholder="Teléfono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} required />
        <br />
        <input type="email" placeholder="Correo institucional" value={formData.correo} onChange={(e) => setFormData({ ...formData, correo: e.target.value })} required />
        <br />
        <input type="password" placeholder="Contraseña" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
        <br />
        <input type="text" placeholder="Carga horaria máxima" value={formData.cargaHoraria} onChange={(e) => setFormData({ ...formData, cargaHoraria: e.target.value })} required />
        <br />
        <input type="text" placeholder="Especialidad" value={formData.especialidad} onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })} required />
        <br />
        <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })}>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
        <br />
        <button type="submit">Registrar Docente</button>
      </form>
    </div>
  );
}

export default RegisterTeacher;