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

  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // ============================
  // CARGAR CONVERSACIONES
  // ============================

  useEffect(() => {
    cargarConversaciones();
  }, []);

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

  // ============================
  // ABRIR CONVERSACIÓN
  // ============================

  const abrirConversacion = async (conversacion) => {
    try {
      setConversacionSeleccionada(conversacion);
      setCargandoMensajes(true);
      setError('');

      const data = await getMensajesConversacion(
        conversacion.Conversacion_Id
      );

      console.log('Mensajes:', data);

      setMensajes(data?.mensajes || []);

      // Marcar mensajes recibidos como leídos
      try {
        await marcarMensajesLeidos(
          conversacion.Conversacion_Id
        );
      } catch (errorLectura) {
        console.error(
          'Error al marcar mensajes como leídos:',
          errorLectura
        );
      }

    } catch (err) {
      console.error('Error al cargar mensajes:', err);

      setError(
        err.message || 'No se pudieron cargar los mensajes'
      );
    } finally {
      setCargandoMensajes(false);
    }
  };

  // ============================
  // ENVIAR MENSAJE
  // ============================

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();

    if (!nuevoMensaje.trim()) {
      return;
    }

    if (!conversacionSeleccionada) {
      return;
    }

    try {
      setEnviando(true);
      setError('');

      await enviarMensaje(
        conversacionSeleccionada.Conversacion_Id,
        nuevoMensaje.trim()
      );

      setNuevoMensaje('');

      // Volver a cargar los mensajes
      const data = await getMensajesConversacion(
        conversacionSeleccionada.Conversacion_Id
      );

      setMensajes(data?.mensajes || []);

    } catch (err) {
      console.error('Error al enviar mensaje:', err);

      setError(
        err.message || 'No se pudo enviar el mensaje'
      );
    } finally {
      setEnviando(false);
    }
  };

  // ============================
  // VOLVER A CONVERSACIONES
  // ============================

  const volverConversaciones = () => {
    setConversacionSeleccionada(null);
    setMensajes([]);
    setNuevoMensaje('');
    setError('');
  };

  // ============================
  // RENDER
  // ============================

  return (
    <div className="page-container">

      <h1>Mensajes</h1>

      {error && (
        <div
          style={{
            background: '#ffe5e5',
            color: '#b00020',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}
        >
          Error: {error}
        </div>
      )}

      {/* ============================
          LISTA DE CONVERSACIONES
      ============================ */}

      {!conversacionSeleccionada && (
        <>
          {cargandoConversaciones && (
            <p>Cargando conversaciones...</p>
          )}

          {!cargandoConversaciones &&
            conversaciones.length === 0 && (
              <p>
                No hay conversaciones disponibles.
              </p>
            )}

          {!cargandoConversaciones &&
            conversaciones.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {conversaciones.map((conversacion) => (
                  <button
                    key={conversacion.Conversacion_Id}
                    onClick={() =>
                      abrirConversacion(conversacion)
                    }
                    style={{
                      textAlign: 'left',
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '10px',
                      padding: '16px',
                      cursor: 'pointer'
                    }}
                  >

                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: '16px',
                        marginBottom: '8px'
                      }}
                    >
                      Conversación #
                      {conversacion.Conversacion_Id}
                    </div>

                    <div>
                      Docente:{' '}
                      {conversacion.Docente_Nombre ||
                        'Sin nombre'}
                    </div>

                    <div>
                      Apoderado:{' '}
                      {conversacion.Apoderado_Nombre ||
                        'Sin nombre'}
                    </div>

                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '14px',
                        color: '#666'
                      }}
                    >
                      {conversacion.Ultimo_Mensaje
                        ? conversacion.Ultimo_Mensaje
                        : 'Sin mensajes todavía'}
                    </div>

                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '13px'
                      }}
                    >
                      Estado:{' '}
                      {conversacion.Conversacion_Estado
                        ? 'Activa'
                        : 'Inactiva'}
                    </div>

                  </button>
                ))}
              </div>
            )}
        </>
      )}

      {/* ============================
          CONVERSACIÓN ABIERTA
      ============================ */}

      {conversacionSeleccionada && (
        <div>

          {/* CABECERA */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '20px'
            }}
          >

            <button
              onClick={volverConversaciones}
              style={{
                padding: '8px 14px',
                cursor: 'pointer'
              }}
            >
              ← Volver
            </button>

            <div>
              <h2 style={{ margin: 0 }}>
                Conversación #
                {conversacionSeleccionada.Conversacion_Id}
              </h2>

              <p
                style={{
                  margin: '5px 0',
                  color: '#666'
                }}
              >
                {conversacionSeleccionada.Docente_Nombre}
                {' ↔ '}
                {conversacionSeleccionada.Apoderado_Nombre}
              </p>
            </div>

          </div>

          {/* MENSAJES */}

          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: '10px',
              padding: '20px',
              minHeight: '350px',
              maxHeight: '500px',
              overflowY: 'auto',
              background: '#f7f7f7'
            }}
          >

            {cargandoMensajes && (
              <p>Cargando mensajes...</p>
            )}

            {!cargandoMensajes &&
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

            {!cargandoMensajes &&
              mensajes.map((mensaje) => (
                <div
                  key={mensaje.Mensaje_Id}
                  style={{
                    marginBottom: '12px',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '8px'
                  }}
                >

                  <div
                    style={{
                      fontWeight: 'bold',
                      marginBottom: '5px'
                    }}
                  >
                    {mensaje.Mensaje_Remitente_Rol}
                  </div>

                  <div>
                    {mensaje.Mensaje_Contenido}
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      color: '#888',
                      marginTop: '6px'
                    }}
                  >
                    {mensaje.Mensaje_Fecha_Envio}{' '}
                    {mensaje.Mensaje_Hora_Envio}
                  </div>

                </div>
              ))}

          </div>

          {/* FORMULARIO ENVIAR */}

          {conversacionSeleccionada.Conversacion_Estado ? (
            <form
              onSubmit={handleEnviarMensaje}
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '15px'
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
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />

              <button
                type="submit"
                disabled={enviando || !nuevoMensaje.trim()}
                style={{
                  padding: '12px 20px',
                  cursor: 'pointer'
                }}
              >
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>

            </form>
          ) : (
            <p
              style={{
                marginTop: '15px',
                color: '#777'
              }}
            >
              Esta conversación está cerrada.
            </p>
          )}

        </div>
      )}

    </div>
  );
}

export default Mensajes;