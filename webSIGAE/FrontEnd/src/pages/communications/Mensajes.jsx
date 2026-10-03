import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import {
  getConversaciones,
  getMensajesConversacion,
  enviarMensaje,
  marcarMensajesLeidos,
  getContactosMensajeria,
  iniciarConversacion
} from '../../services/api';

// CU73 / RF47: mensajería interna entre docentes y apoderados
function Mensajes() {
  const { usuario, rolActivo } = useAuth();
  const rol = rolActivo || usuario?.roles?.[0];

  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionSeleccionada, setConversacionSeleccionada] = useState(null);
  const [mensajes, setMensajes] = useState([]);

  const [nuevoMensaje, setNuevoMensaje] = useState('');

  const [cargandoConversaciones, setCargandoConversaciones] = useState(true);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [error, setError] = useState('');
  const [errorMensaje, setErrorMensaje] = useState('');

  // Nueva conversación (selección de contacto válido)
  const [mostrarContactos, setMostrarContactos] = useState(false);
  const [contactos, setContactos] = useState([]);
  const [cargandoContactos, setCargandoContactos] = useState(false);
  const [errorContactos, setErrorContactos] = useState('');
  const [iniciando, setIniciando] = useState(null);

  // ─────────────────────────────────────────
  // Cargar conversaciones
  // ─────────────────────────────────────────

  const cargarConversaciones = useCallback(async () => {
    try {
      setCargandoConversaciones(true);
      setError('');

      const data = await getConversaciones(rol);
      const lista = Array.isArray(data) ? data : [];

      setConversaciones(lista);
      return lista;

    } catch (err) {
      setError(
        err.message || 'No se pudieron cargar las conversaciones'
      );
      return [];
    } finally {
      setCargandoConversaciones(false);
    }
  }, [rol]);

  // ─────────────────────────────────────────
  // Cargar mensajes de una conversación
  // ─────────────────────────────────────────

  const seleccionarConversacion = async (conversacion) => {
    try {
      setConversacionSeleccionada(conversacion);
      setMostrarContactos(false);
      setMensajes([]);
      setErrorMensaje('');
      setCargandoMensajes(true);

      const data = await getMensajesConversacion(
        conversacion.Conversacion_Id
      );

      setMensajes(data?.mensajes || []);

      // Marcar como leídos los mensajes recibidos
      if (conversacion.No_Leidos > 0) {
        await marcarMensajesLeidos(conversacion.Conversacion_Id);

        setConversaciones((prev) =>
          prev.map((item) =>
            item.Conversacion_Id === conversacion.Conversacion_Id
              ? { ...item, No_Leidos: 0 }
              : item
          )
        );
      }

    } catch (err) {
      setErrorMensaje(
        err.message || 'No se pudieron cargar los mensajes'
      );
    } finally {
      setCargandoMensajes(false);
    }
  };

  // ─────────────────────────────────────────
  // Nueva conversación
  // ─────────────────────────────────────────

  const abrirContactos = async () => {
    setMostrarContactos(true);
    setConversacionSeleccionada(null);
    setErrorContactos('');
    setCargandoContactos(true);

    try {
      const data = await getContactosMensajeria(rol);
      setContactos(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorContactos(
        err.message || 'No se pudieron cargar los contactos'
      );
    } finally {
      setCargandoContactos(false);
    }
  };

  const handleIniciarConversacion = async (contacto) => {
    try {
      setIniciando(contacto.Contacto_Id);
      setErrorContactos('');

      const data = await iniciarConversacion(contacto.Contacto_Id, rol);
      const lista = await cargarConversaciones();

      const conversacion = lista.find(
        (c) => c.Conversacion_Id === data?.conversacionId
      );

      if (conversacion) {
        await seleccionarConversacion(conversacion);
      }

    } catch (err) {
      setErrorContactos(
        err.message || 'No se pudo iniciar la conversación'
      );
    } finally {
      setIniciando(null);
    }
  };

  // ─────────────────────────────────────────
  // Enviar mensaje
  // ─────────────────────────────────────────

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();

    if (!conversacionSeleccionada) {
      return;
    }

    const contenido = nuevoMensaje.trim();

    if (!contenido) {
      return;
    }

    try {
      setEnviando(true);
      setErrorMensaje('');

      await enviarMensaje(
        conversacionSeleccionada.Conversacion_Id,
        contenido
      );

      setNuevoMensaje('');

      // Volver a cargar los mensajes
      const data = await getMensajesConversacion(
        conversacionSeleccionada.Conversacion_Id
      );

      setMensajes(data?.mensajes || []);

      // Actualizar la vista previa de la conversación
      setConversaciones((prev) =>
        prev.map((item) =>
          item.Conversacion_Id ===
          conversacionSeleccionada.Conversacion_Id
            ? { ...item, Ultimo_Mensaje: contenido }
            : item
        )
      );

    } catch (err) {
      // Excepción 2: error al enviar o guardar el mensaje
      setErrorMensaje(
        err.message || 'No se pudo enviar el mensaje'
      );
    } finally {
      setEnviando(false);
    }
  };

  // ─────────────────────────────────────────
  // Carga inicial
  // ─────────────────────────────────────────

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarConversaciones();
  }, [cargarConversaciones]);

  const miRol = conversacionSeleccionada?.Mi_Rol || rol;
  const conversacionCerrada =
    conversacionSeleccionada &&
    !conversacionSeleccionada.Conversacion_Estado;

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <div
      style={{
        padding: '24px',
        height: 'calc(100vh - 120px)',
        boxSizing: 'border-box'
      }}
    >

      <h1 style={{ marginBottom: '20px' }}>
        Mensajes
      </h1>

      {error && (
        <div
          style={{
            padding: '12px',
            marginBottom: '15px',
            borderRadius: '8px',
            background: '#fee2e2',
            color: '#991b1b'
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 320px) 1fr',
          gap: '20px',
          height: 'calc(100% - 70px)'
        }}
      >

        {/* ─────────────────────────────── */}
        {/* LISTA DE CONVERSACIONES */}
        {/* ─────────────────────────────── */}

        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '10px',
            overflow: 'hidden',
            background: '#fff'
          }}
        >

          <div
            style={{
              padding: '12px 15px',
              borderBottom: '1px solid #ddd',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            Conversaciones

            <button
              type="button"
              className="btn-primary"
              onClick={abrirContactos}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              + Nueva
            </button>
          </div>

          <div
            style={{
              overflowY: 'auto',
              height: 'calc(100% - 55px)'
            }}
          >

            {cargandoConversaciones && (
              <p style={{ padding: '15px' }}>
                Cargando conversaciones...
              </p>
            )}

            {!cargandoConversaciones &&
              !error &&
              conversaciones.length === 0 && (
                <p style={{ padding: '15px' }}>
                  No hay conversaciones. Usa "+ Nueva" para iniciar una.
                </p>
              )}

            {!cargandoConversaciones &&
              conversaciones.map((conversacion) => {

                const seleccionada =
                  conversacionSeleccionada?.Conversacion_Id ===
                  conversacion.Conversacion_Id;

                return (
                  <button
                    key={conversacion.Conversacion_Id}
                    type="button"
                    onClick={() =>
                      seleccionarConversacion(conversacion)
                    }
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      borderBottom: '1px solid #eee',
                      padding: '15px',
                      cursor: 'pointer',
                      background: seleccionada
                        ? '#f3f4f6'
                        : '#fff'
                    }}
                  >

                    <div
                      style={{
                        fontWeight: 'bold',
                        marginBottom: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <span>
                        {conversacion.Contacto_Nombre || 'Sin nombre'}
                      </span>

                      {conversacion.No_Leidos > 0 && (
                        <span
                          style={{
                            background: '#2563eb',
                            color: '#fff',
                            borderRadius: '999px',
                            padding: '0 8px',
                            fontSize: '12px',
                            lineHeight: '20px'
                          }}
                          title="Mensajes sin leer"
                        >
                          {conversacion.No_Leidos}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        color: '#666',
                        marginBottom: '6px'
                      }}
                    >
                      {conversacion.Mi_Rol === 'Docente'
                        ? 'Apoderado'
                        : 'Docente'}
                      {!conversacion.Conversacion_Estado && ' · Cerrada'}
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        color: '#555',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {conversacion.Ultimo_Mensaje ||
                        'Sin mensajes'}
                    </div>

                  </button>
                );
              })}

          </div>
        </div>

        {/* ─────────────────────────────── */}
        {/* CHAT / CONTACTOS */}
        {/* ─────────────────────────────── */}

        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '10px',
            overflow: 'hidden',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column'
          }}
        >

          {mostrarContactos ? (

            <>
              <div
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #ddd',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                    Nueva conversación
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {rol === 'Docente'
                      ? 'Apoderados de los estudiantes de tus cursos'
                      : 'Docentes que hacen clases a tus estudiantes'}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setMostrarContactos(false)}
                >
                  Cerrar
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>

                {cargandoContactos && <p>Cargando contactos...</p>}

                {errorContactos && (
                  <div
                    style={{
                      padding: '10px',
                      marginBottom: '10px',
                      borderRadius: '8px',
                      background: '#fee2e2',
                      color: '#991b1b'
                    }}
                  >
                    {errorContactos}
                  </div>
                )}

                {!cargandoContactos &&
                  !errorContactos &&
                  contactos.length === 0 && (
                    <p style={{ color: '#777' }}>
                      No existen contactos con una relación docente-apoderado válida.
                    </p>
                  )}

                {!cargandoContactos &&
                  contactos.map((contacto) => (
                    <div
                      key={contacto.Contacto_Id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {contacto.Contacto_Nombre}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {contacto.Contacto_Rol} · {contacto.Estudiantes.join(', ')}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-primary"
                        disabled={iniciando !== null}
                        onClick={() => handleIniciarConversacion(contacto)}
                      >
                        {iniciando === contacto.Contacto_Id
                          ? 'Abriendo...'
                          : 'Escribir'}
                      </button>
                    </div>
                  ))}
              </div>
            </>

          ) : !conversacionSeleccionada ? (

            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#777'
              }}
            >
              Selecciona una conversación para ver los mensajes.
            </div>

          ) : (

            <>
              {/* ENCABEZADO */}

              <div
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #ddd'
                }}
              >

                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}
                >
                  {conversacionSeleccionada.Contacto_Nombre}
                </div>

                <div
                  style={{
                    fontSize: '14px',
                    color: '#666'
                  }}
                >
                  {miRol === 'Docente' ? 'Apoderado' : 'Docente'}
                </div>

              </div>

              {/* MENSAJES */}

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  background: '#f8f9fa'
                }}
              >

                {cargandoMensajes && (
                  <p>
                    Cargando mensajes...
                  </p>
                )}

                {errorMensaje && (
                  <div
                    style={{
                      padding: '10px',
                      marginBottom: '10px',
                      borderRadius: '8px',
                      background: '#fee2e2',
                      color: '#991b1b'
                    }}
                  >
                    {errorMensaje}
                  </div>
                )}

                {!cargandoMensajes &&
                  !errorMensaje &&
                  mensajes.length === 0 && (
                    <p
                      style={{
                        textAlign: 'center',
                        color: '#777'
                      }}
                    >
                      No hay mensajes todavía. Escribe el primero.
                    </p>
                  )}

                {mensajes.map((mensaje) => {

                  // Los mensajes propios van a la derecha
                  const esPropio =
                    mensaje.Mensaje_Remitente_Rol === miRol;

                  return (
                    <div
                      key={mensaje.Mensaje_Id}
                      style={{
                        display: 'flex',
                        justifyContent: esPropio
                          ? 'flex-end'
                          : 'flex-start',
                        marginBottom: '12px'
                      }}
                    >

                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          background: esPropio
                            ? '#dbeafe'
                            : '#e5e7eb'
                        }}
                      >

                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginBottom: '4px'
                          }}
                        >
                          {esPropio ? 'Tú' : mensaje.Mensaje_Remitente_Rol}
                        </div>

                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {mensaje.Mensaje_Contenido}
                        </div>

                        <div
                          style={{
                            marginTop: '5px',
                            fontSize: '11px',
                            color: '#666',
                            textAlign: 'right'
                          }}
                        >
                          {mensaje.Mensaje_Fecha_Envio}{' '}
                          {String(mensaje.Mensaje_Hora_Envio || '').slice(0, 5)}
                          {esPropio && ` · ${mensaje.Mensaje_Estado}`}
                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>

              {/* FORMULARIO */}

              {conversacionCerrada ? (
                <div
                  style={{
                    padding: '15px',
                    borderTop: '1px solid #ddd',
                    color: '#777',
                    textAlign: 'center'
                  }}
                >
                  Esta conversación está cerrada; no se pueden enviar mensajes.
                </div>
              ) : (
                <form
                  onSubmit={handleEnviarMensaje}
                  style={{
                    padding: '15px',
                    borderTop: '1px solid #ddd',
                    display: 'flex',
                    gap: '10px'
                  }}
                >

                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) =>
                      setNuevoMensaje(e.target.value)
                    }
                    placeholder="Escribe un mensaje..."
                    maxLength={5000}
                    disabled={enviando}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '8px'
                    }}
                  />

                  <button
                    type="submit"
                    disabled={
                      enviando ||
                      !nuevoMensaje.trim()
                    }
                    style={{
                      padding: '12px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor:
                        enviando ||
                        !nuevoMensaje.trim()
                          ? 'not-allowed'
                          : 'pointer'
                    }}
                  >
                    {enviando ? 'Enviando...' : 'Enviar'}
                  </button>

                </form>
              )}

            </>
          )}

        </div>

      </div>

    </div>
  );
}

export default Mensajes;
