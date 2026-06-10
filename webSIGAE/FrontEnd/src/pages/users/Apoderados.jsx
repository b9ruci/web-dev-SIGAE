import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getApoderados,
  getEstudiantesSinApoderado,
  asignarApoderado,
} from "../../services/api";

function Apoderados() {
  const { usuario } = useAuth();
  const esAdmin =
    usuario?.roles?.includes("Administrador") ||
    usuario?.administradorTipo === "SuperAdmin";

  const [apoderados, setApoderados]           = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [busqueda, setBusqueda]               = useState("");

  // Modal
  const [apoderadoSeleccionado, setApoderadoSeleccionado] = useState(null);
  const [estudiantesSinApo, setEstudiantesSinApo]         = useState([]);
  const [estudiantesDelApo, setEstudiantesDelApo]         = useState([]);
  const [seleccionados, setSeleccionados]                 = useState([]);
  const [loadingModal, setLoadingModal]                   = useState(false);
  const [errorModal, setErrorModal]                       = useState(null);
  const [resultado, setResultado]                         = useState(null);

  useEffect(() => {
    cargarApoderados();
  }, []);

  const cargarApoderados = async () => {
    setLoading(true);
    try {
      const data = await getApoderados();
      setApoderados(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener los estudiantes ya asociados a un apoderado
  const cargarEstudiantesDelApoderado = async (apoderadoId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/estudiantes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return Array.isArray(data)
        ? data.filter((e) => e.Apoderado_Usuario_Id === apoderadoId)
        : [];
    } catch {
      return [];
    }
  };

  const abrirModal = async (apoderado) => {
    setApoderadoSeleccionado(apoderado);
    setSeleccionados([]);
    setErrorModal(null);
    setResultado(null);
    setLoadingModal(true);
    try {
      const [sinApo, delApo] = await Promise.all([
        getEstudiantesSinApoderado(),
        cargarEstudiantesDelApoderado(apoderado.Usuario_Id),
      ]);
      setEstudiantesSinApo(sinApo);
      setEstudiantesDelApo(delApo);
    } catch (error) {
      setErrorModal("Error al cargar estudiantes");
    } finally {
      setLoadingModal(false);
    }
  };

  const cerrarModal = () => {
    setApoderadoSeleccionado(null);
    setSeleccionados([]);
    setErrorModal(null);
    setResultado(null);
  };

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAsignar = async () => {
    if (seleccionados.length === 0) {
      setErrorModal("Selecciona al menos un estudiante para asignar.");
      return;
    }
    setLoadingModal(true);
    setErrorModal(null);
    try {
      const res = await asignarApoderado({
        apoderadoId  : apoderadoSeleccionado.Usuario_Id,
        estudianteIds: seleccionados,
      });
      setResultado(res);
      // Recargar listas dentro del modal para reflejar los cambios
      const [sinApo, delApo] = await Promise.all([
        getEstudiantesSinApoderado(),
        cargarEstudiantesDelApoderado(apoderadoSeleccionado.Usuario_Id),
      ]);
      setEstudiantesSinApo(sinApo);
      setEstudiantesDelApo(delApo);
      setSeleccionados([]);
    } catch (error) {
      setErrorModal(error.message || "Error al asignar estudiantes");
    } finally {
      setLoadingModal(false);
    }
  };

  const apoderadosFiltrados = apoderados.filter((u) => {
    const txt = busqueda.toLowerCase();
    return (
      !busqueda ||
      u.Usuario_Nombre_Completo?.toLowerCase().includes(txt) ||
      u.Usuario_RUT?.toLowerCase().includes(txt)
    );
  });

  if (loading) {
    return (
      <div className="usuarios-container">
        <p>Cargando apoderados...</p>
      </div>
    );
  }

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>Gestión de Apoderados</h1>
        <p>Asocia estudiantes a los apoderados registrados en el sistema</p>
      </div>

      {/* Buscador */}
      <div className="usuarios-filtros">
        <input
          type="text"
          className="usuarios-search"
          placeholder="Buscar por nombre o RUT..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      {apoderadosFiltrados.length === 0 ? (
        <div className="usuarios-empty">No se encontraron apoderados registrados</div>
      ) : (
        <table className="tabla-usuarios">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Estado</th>
              {esAdmin && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {apoderadosFiltrados.map((u, idx) => (
              <tr key={u.Usuario_Id}>
                <td>{idx + 1}</td>
                <td>{u.Usuario_Nombre_Completo}</td>
                <td>{u.Usuario_RUT}</td>
                <td>{u.Apoderado_Correo_Natural || "—"}</td>
                <td>{u.Usuario_Telefono || "—"}</td>
                <td>
                  {u.Usuario_Estado_Cuenta ? (
                    <span className="badge-activo">Activo</span>
                  ) : (
                    <span className="badge-inactivo">Inactivo</span>
                  )}
                </td>
                {esAdmin && (
                  <td>
                    <button
                      className="btn-roles"
                      onClick={() => abrirModal(u)}
                    >
                      Asignar Estudiantes
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── MODAL ── */}
      {apoderadoSeleccionado && (
        <div
          style={{
            position       : "fixed",
            inset          : 0,
            background     : "rgba(0,0,0,0.45)",
            display        : "flex",
            alignItems     : "center",
            justifyContent : "center",
            zIndex         : 1000,
          }}
        >
          <div
            className="form-card"
            style={{ width: "540px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}
          >
            {/* Encabezado modal */}
            <h2 style={{ marginBottom: "4px" }}>Asignar Estudiantes</h2>
            <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "0.95rem" }}>
              Apoderado:{" "}
              <strong>{apoderadoSeleccionado.Usuario_Nombre_Completo}</strong>
            </p>

            {loadingModal ? (
              <p style={{ color: "#64748b" }}>Cargando estudiantes...</p>
            ) : (
              <>
                {/* Estudiantes ya asociados */}
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Estudiantes ya asociados ({estudiantesDelApo.length})
                  </h3>
                  {estudiantesDelApo.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                      Este apoderado aún no tiene estudiantes asignados.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {estudiantesDelApo.map((e) => (
                        <div
                          key={e.Estudiante_Id}
                          style={{
                            background    : "#f0fdf4",
                            border        : "1px solid #bbf7d0",
                            borderRadius  : "6px",
                            padding       : "8px 12px",
                            fontSize      : "0.9rem",
                            display       : "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>{e.Estudiante_Nombre_Completo}</span>
                          <span style={{ color: "#64748b" }}>{e.Estudiante_RUT}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divisor */}
                <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", marginBottom: "20px" }} />

                {/* Estudiantes disponibles para asignar */}
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Estudiantes sin apoderado ({estudiantesSinApo.length})
                  </h3>
                  {estudiantesSinApo.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                      No hay estudiantes sin apoderado asignado.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "220px", overflowY: "auto" }}>
                      {estudiantesSinApo.map((e) => {
                        const marcado = seleccionados.includes(e.Estudiante_Id);
                        return (
                          <div
                            key={e.Estudiante_Id}
                            onClick={() => toggleSeleccion(e.Estudiante_Id)}
                            style={{
                              background    : marcado ? "#eff6ff" : "#f8fafc",
                              border        : `1px solid ${marcado ? "#93c5fd" : "#e2e8f0"}`,
                              borderRadius  : "6px",
                              padding       : "8px 12px",
                              fontSize      : "0.9rem",
                              display       : "flex",
                              justifyContent: "space-between",
                              alignItems    : "center",
                              cursor        : "pointer",
                              userSelect    : "none",
                              transition    : "all 0.15s",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <input
                                type="checkbox"
                                checked={marcado}
                                onChange={() => toggleSeleccion(e.Estudiante_Id)}
                                onClick={(ev) => ev.stopPropagation()}
                              />
                              <div>
                                <div style={{ fontWeight: marcado ? 600 : 400 }}>
                                  {e.Estudiante_Nombre_Completo}
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                                  {e.Estudiante_RUT} · {e.Curso_Nombre}
                                </div>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize    : "0.75rem",
                                padding     : "2px 8px",
                                borderRadius: "999px",
                                background  : e.Estudiante_Estado_Academico === "Regular" ? "#dcfce7" : "#fef9c3",
                                color       : e.Estudiante_Estado_Academico === "Regular" ? "#166534" : "#854d0e",
                              }}
                            >
                              {e.Estudiante_Estado_Academico}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Feedback de resultado */}
                {resultado && (
                  <div
                    style={{
                      background  : "#f0fdf4",
                      border      : "1px solid #bbf7d0",
                      borderRadius: "6px",
                      padding     : "10px 14px",
                      marginBottom: "16px",
                      fontSize    : "0.9rem",
                      color       : "#166534",
                    }}
                  >
                    ✓ {resultado.asignados} estudiante(s) asignado(s) correctamente.
                    {resultado.omitidos > 0 && (
                      <span style={{ color: "#92400e" }}>
                        {" "}· {resultado.omitidos} ya estaban asignados (omitidos).
                      </span>
                    )}
                  </div>
                )}

                {/* Error */}
                {errorModal && (
                  <p style={{ color: "#dc2626", marginBottom: "12px", fontSize: "0.9rem" }}>
                    {errorModal}
                  </p>
                )}

                {/* Acciones */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn-primario"
                    onClick={handleAsignar}
                    disabled={loadingModal || seleccionados.length === 0}
                  >
                    {loadingModal
                      ? "Asignando..."
                      : `Asignar ${seleccionados.length > 0 ? `(${seleccionados.length})` : ""}`}
                  </button>
                  <button className="btn-desactivar" onClick={cerrarModal}>
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Apoderados;
