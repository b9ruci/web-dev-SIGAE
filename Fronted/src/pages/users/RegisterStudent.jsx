import { useState } from "react";

function RegisterStudent() {

  const [formData, setFormData] = useState({
    nombre: "",
    rut: "",
    curso: "",
    estadoAcademico: "Activo",
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
      "Ficha estudiantil registrada correctamente"
    );
  };

  return (

    <div className="page-container">

      <div className="form-card">

        <h1>
          Registrar Ficha Estudiantil
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

          <select
            name="curso"
            value={formData.curso}
            onChange={handleChange}
            required
          >

            <option value="">
              Seleccione un curso
            </option>

            <option value="1A">
              1°A
            </option>

            <option value="1B">
              1°B
            </option>

            <option value="2A">
              2°A
            </option>

          </select>

          <select
            name="estadoAcademico"
            value={formData.estadoAcademico}
            onChange={handleChange}
          >

            <option value="Activo">
              Activo
            </option>

            <option value="Retirado">
              Retirado
            </option>

            <option value="Suspendido">
              Suspendido
            </option>

          </select>

          <button type="submit">
            Registrar Estudiante
          </button>

        </form>

      </div>

    </div>
  );
}

export default RegisterStudent;