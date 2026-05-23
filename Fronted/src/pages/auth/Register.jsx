import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {

  const [rol, setRol] =
    useState("Administrador");

  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Usuario registrado");
  };

  return (
    <div className="login-container">

      <form
        className="login-form"
        onSubmit={handleSubmit}
      >

        <h1>Registrar Cuenta</h1>

        <select
          value={rol}
          onChange={(e) =>
            setRol(e.target.value)
          }
        >
          <option>
            Administrador
          </option>

          <option>
            Docente
          </option>

          <option>
            Apoderado
          </option>

          <option>
            Estudiante
          </option>
        </select>

        <input
          type="text"
          placeholder="Nombre completo"
          required
        />

        <input
          type="text"
          placeholder="RUT"
          required
        />

        <input
          type="email"
          placeholder="Correo"
          required
        />

        <input
          type="text"
          placeholder="Teléfono"
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          required
        />

        {rol === "Docente" && (
          <>
            <input
              type="text"
              placeholder="Especialidad"
            />

            <input
              type="number"
              placeholder="Carga horaria"
            />
          </>
        )}

        {rol === "Apoderado" && (
          <input
            type="text"
            placeholder="Dirección"
          />
        )}

        {rol === "Estudiante" && (
          <>
            <input
              type="text"
              placeholder="Curso"
            />

            <input
              type="text"
              placeholder="Estado académico"
            />
          </>
        )}

        <button type="submit">
          Registrar
        </button>

        <div className="login-links">

          <Link to="/">
            Volver al login
          </Link>

        </div>

      </form>
    </div>
  );
}

export default Register;