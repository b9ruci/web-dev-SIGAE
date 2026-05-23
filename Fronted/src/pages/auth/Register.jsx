import { useState } from "react";

function Register() {
  const [tipoUsuario, setTipoUsuario] =
    useState("apoderado");

  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] =
    useState("");
  const [direccion, setDireccion] =
    useState("");
  const [password, setPassword] =
    useState("");

  // DOCENTE
  const [especialidad, setEspecialidad] =
    useState("");

  const [cargaHoraria, setCargaHoraria] =
    useState("");

  // FICHA ESTUDIANTE
  const [curso, setCurso] = useState("");

  const [estadoAcademico, setEstadoAcademico] =
    useState("");

  // APODERADO
  const [rutEstudiante, setRutEstudiante] =
    useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log({
      tipoUsuario,
      nombre,
      rut,
      correo,
      telefono,
      direccion,
      password,
      especialidad,
      cargaHoraria,
      curso,
      estadoAcademico,
      rutEstudiante,
    });

    alert("Usuario registrado correctamente");
  };

  return (
    <div className="login-container">
      <form
        className="login-form"
        onSubmit={handleSubmit}
      >
        <h1>Registrar Cuenta</h1>

        <p>
          Sistema de Gestión Académica Escolar
        </p>

        {/* TIPO DE USUARIO */}

        <select
          value={tipoUsuario}
          onChange={(e) =>
            setTipoUsuario(e.target.value)
          }
        >
          <option value="administrador">
            Administrador
          </option>

          <option value="docente">
            Docente
          </option>

          <option value="apoderado">
            Apoderado
          </option>

          <option value="ficha-estudiante">
            Ficha de Estudiante
          </option>
        </select>

        {/* DATOS GENERALES */}

        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) =>
            setNombre(e.target.value)
          }
          required
        />

        <input
          type="text"
          placeholder="RUT"
          value={rut}
          onChange={(e) =>
            setRut(e.target.value)
          }
          required
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          value={correo}
          onChange={(e) =>
            setCorreo(e.target.value)
          }
          required
        />

        <input
          type="text"
          placeholder="Número telefónico"
          value={telefono}
          onChange={(e) =>
            setTelefono(e.target.value)
          }
          required
        />

        {/* ADMINISTRADOR */}

        {tipoUsuario === "administrador" && (
          <>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />
          </>
        )}

        {/* DOCENTE */}

        {tipoUsuario === "docente" && (
          <>
            <input
              type="text"
              placeholder="Especialidad"
              value={especialidad}
              onChange={(e) =>
                setEspecialidad(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Carga horaria máxima"
              value={cargaHoraria}
              onChange={(e) =>
                setCargaHoraria(
                  e.target.value
                )
              }
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />
          </>
        )}

        {/* APODERADO */}

        {tipoUsuario === "apoderado" && (
          <>
            <input
              type="text"
              placeholder="Dirección"
              value={direccion}
              onChange={(e) =>
                setDireccion(
                  e.target.value
                )
              }
            />

            <input
              type="text"
              placeholder="RUT del estudiante asociado"
              value={rutEstudiante}
              onChange={(e) =>
                setRutEstudiante(
                  e.target.value
                )
              }
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />
          </>
        )}

        {/* FICHA DE ESTUDIANTE */}

        {tipoUsuario ===
          "ficha-estudiante" && (
          <>
            <input
              type="text"
              placeholder="Curso asociado"
              value={curso}
              onChange={(e) =>
                setCurso(e.target.value)
              }
            />

            <select
              value={estadoAcademico}
              onChange={(e) =>
                setEstadoAcademico(
                  e.target.value
                )
              }
            >
              <option value="">
                Estado académico
              </option>

              <option value="activo">
                Activo
              </option>

              <option value="suspendido">
                Suspendido
              </option>

              <option value="retirado">
                Retirado
              </option>
            </select>
          </>
        )}

        <button type="submit">
          Registrar Cuenta
        </button>
      </form>
    </div>
  );
}

export default Register;