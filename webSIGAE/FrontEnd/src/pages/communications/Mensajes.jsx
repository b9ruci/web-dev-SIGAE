import { useEffect, useState } from 'react';

import {
  getConversaciones,
  getMensajesConversacion,
  enviarMensaje,
  marcarMensajesLeidos
} from '../../services/api';

function Mensajes() {
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionSeleccionada, setConversacionSeleccionada] = useState(null);
  const [mensajes, setMensajes] = useState([]);

  const [nuevoMensaje, setNuevoMensaje] = useState('');

  const [cargandoConversaciones, setCargandoConversaciones] = useState(true);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [error, setError] = useState('');
  const [errorMensaje, setErrorMensaje] = useState('');

  // ─────────────────────────────────────────
  // Cargar conversaciones
  // ─────────────────────────────────────────

  const cargarConversaciones = async () => {
    try {
      setCargandoConversaciones(true);
      setError('');

      const data = await getConversaciones();

      console.log('Conversaciones:', data);

      setConversaciones(data || []);

    } catch (err) {
      console.error('Error al cargar conversaciones:', err);

      setError(
        err.message || 'No se pudieron cargar las conversaciones'
      );
    } finally {
      setCargandoConversaciones(false);
    }
  };

  // ─────────────────────────────────────────
  // Cargar mensajes de una conversación
  // ─────────────────────────────────────────

  const seleccionarConversacion = async (conversacion) => {
    try {
      setConversacionSeleccionada(conversacion);
      setMensajes([]);
      setErrorMensaje('');
      setCargandoMensajes(true);

      const data = await getMensajesConversacion(
        conversacion.Conversacion_Id
      );

      console.log('Mensajes:', data);

      setMensajes(data?.mensajes || []);

      // Marcar como leídos
      await marcarMensajesLeidos(
        conversacion.Conversacion_Id
      );

      // Actualizar estado visual del último mensaje
      setConversaciones((prev) =>
        prev.map((item) =>
          item.Conversacion_Id === conversacion.Conversacion_Id
            ? {
                ...item,
                Estado_Ultimo_Mensaje: 'Leído'
              }
            : item
        )
      );

    } catch (err) {
      console.error('Error al cargar mensajes:', err);

      setErrorMensaje(
        err.message || 'No se pudieron cargar los mensajes'
      );
    } finally {
      setCargandoMensajes(false);
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

      // Actualizar la última conversación
      setConversaciones((prev) =>
        prev.map((item) =>
          item.Conversacion_Id ===
          conversacionSeleccionada.Conversacion_Id
            ? {
                ...item,
                Ultimo_Mensaje: contenido,
                Estado_Ultimo_Mensaje: 'No leído'
              }
            : item
        )
      );

    } catch (err) {
      console.error('Error al enviar mensaje:', err);

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
    cargarConversaciones();
  }, []);

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
          gridTemplateColumns: '320px 1fr',
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
              padding: '15px',
              borderBottom: '1px solid #ddd',
              fontWeight: 'bold'
            }}
          >
            Conversaciones
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
              conversaciones.length === 0 && (
                <p style={{ padding: '15px' }}>
                  No hay conversaciones disponibles.
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
                        marginBottom: '6px'
                      }}
                    >
                      {conversacion.Docente_Nombre ||
                        'Docente sin nombre'}
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        color: '#666',
                        marginBottom: '6px'
                      }}
                    >
                      Apoderado:{' '}
                      {conversacion.Apoderado_Nombre ||
                        'Sin nombre'}
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

                    {conversacion.Estado_Ultimo_Mensaje ===
                      'No leído' && (
                      <div
                        style={{
                          marginTop: '7px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        Nuevo mensaje
                      </div>
                    )}

                  </button>
                );
              })}

          </div>
        </div>

        {/* ─────────────────────────────── */}
        {/* CHAT */}
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

          {!conversacionSeleccionada ? (

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
                  {conversacionSeleccionada.Docente_Nombre}
                </div>

                <div
                  style={{
                    fontSize: '14px',
                    color: '#666'
                  }}
                >
                  Apoderado:{' '}
                  {conversacionSeleccionada.Apoderado_Nombre}
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
                      No hay mensajes todavía.
                    </p>
                  )}

                {mensajes.map((mensaje) => {

                  const esDocente =
                    mensaje.Mensaje_Remitente_Rol ===
                    'Docente';

                  return (
                    <div
                      key={mensaje.Mensaje_Id}
                      style={{
                        display: 'flex',
                        justifyContent: esDocente
                          ? 'flex-start'
                          : 'flex-end',
                        marginBottom: '12px'
                      }}
                    >

                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          background: esDocente
                            ? '#e5e7eb'
                            : '#dbeafe'
                        }}
                      >

                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginBottom: '4px'
                          }}
                        >
                          {mensaje.Mensaje_Remitente_Rol}
                        </div>

                        <div>
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
                          {mensaje.Mensaje_Hora_Envio}
                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>

              {/* FORMULARIO */}

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

            </>
          )}

        </div>

      </div>

    </div>
  );
}

export default Mensajes;