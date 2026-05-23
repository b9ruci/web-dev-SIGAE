import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {

  const [tipoUsuario, setTipoUsuario] =
    useState("apoderado");

  return (
    <div className="login-container">

      <form className="login-form">

        <h1>Registro de Usuario</h1>

        <p>
          Complete el formulario para registrarse
        </p>

        {/* SELECT TIPO */}

        <select
          value={tipoUsuario}
          onChange={(e) =>
            setTipoUsuario(e.target.value)
          }
        >
          <option value="apoderado">
            Apoderado
          </option>

          <option value="docente">
            Docente
          </option>

          <option value="administrador">
            Administrador
          </option>

          <option value="estudiante">
            Estudiante
          </option>
        </select>

        {/* CAMPOS GENERALES */}

        <input
          type="text"
          placeholder="Nombre Completo"
        />

        <input
          type="text"
          placeholder="RUT"
        />

        <div className="double-input">

          <input
            type="email"
            placeholder="Correo Electrónico"
          />

          <input
            type="text"
            placeholder="Teléfono"
          />

        </div>

        {/* APODERADO */}

        {tipoUsuario === "apoderado" && (
          <>
            <select>
              <option>
                Relación con el estudiante
              </option>

              <option>Madre</option>
              <option>Padre</option>
              <option>Tutor Legal</option>
            </select>

            <input
              type="text"
              placeholder="Nombre del estudiante"
            />
          </>
        )}

        {/* DOCENTE */}

        {tipoUsuario === "docente" && (
          <>
            <input
              type="text"
              placeholder="Especialidad"
            />

            <input
              type="number"
              placeholder="Carga Horaria Máxima"
            />
          </>
        )}

        {/* ESTUDIANTE */}

        {tipoUsuario === "estudiante" && (
          <>
            <input
              type="text"
              placeholder="Curso"
            />

            <select>
              <option>
                Estado Académico
              </option>

              <option>Activo</option>
              <option>Retirado</option>
              <option>Suspendido</option>
            </select>
          </>
        )}

        {/* PASSWORD */}

        <input
          type="password"
          placeholder="Contraseña"
        />

        <input
          type="password"
          placeholder="Confirmar Contraseña"
        />

        <button type="submit">
          Registrar Usuario
        </button>

        <div className="login-links">

          <Link to="/">
            ¿Ya tiene una cuenta? Iniciar sesión
          </Link>

        </div>

      </form>
    </div>
  );
}

export default Register;