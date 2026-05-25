import { useState } from "react";

function RegisterTeacher() {

  const [formData, setFormData] = useState({
    nombre: "",
    rut: "",
    correo: "",
    telefono: "",
    password: "",
    especialidad: "",
    cargaHoraria: "",
    estado: "Activo",
  });

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {

    e.preventDefault();

    console.log(formData);

    alert(
      "Docente registrado correctamente"
    );
  };

  return (

    <div className="page-container">

      <div className="form-card">

        <h1>
          Registrar Docente
        </h1>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="nombre"
            placeholder="Nombre completo"
            value={formData.nombre}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="rut"
            placeholder="RUT"
            value={formData.rut}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="correo"
            placeholder="Correo institucional"
            value={formData.correo}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="telefono"
            placeholder="Número telefónico"
            value={formData.telefono}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="especialidad"
            placeholder="Especialidad"
            value={formData.especialidad}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="cargaHoraria"
            placeholder="Carga horaria máxima"
            value={formData.cargaHoraria}
            onChange={handleChange}
            required
          />

          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
          >

            <option value="Activo">
              Activo
            </option>

            <option value="Inactivo">
              Inactivo
            </option>

          </select>

          <button type="submit">
            Registrar Docente
          </button>

        </form>

      </div>

    </div>
  );
}

export default RegisterTeacher;