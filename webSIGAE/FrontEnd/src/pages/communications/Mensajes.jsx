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

  const [cargando, setCargando] = useState(true);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);

  const [error, setError] = useState('');
  const [errorMensajes, setErrorMensajes] = useState('');

  const [contenido, setContenido] = useState('');
  const [enviando, setEnviando] = useState(false);

  // --------------------------------------------------
  // Cargar conversaciones
  // --------------------------------------------------

  useEffect(() => {
    const cargarConversaciones = async () => {
      try {
        setCargando(true);
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
        setCargando(false);
      }
    };

    cargarConversaciones();
  }, []);

  // --------------------------------------------------
  // Abrir conversación
  // --------------------------------------------------

  const abrirConversacion = async (conversacion) => {
    try {
      setConversacionSeleccionada(conversacion);
      setCargandoMensajes(true);
      setErrorMensajes('');
      setMensajes([]);

      const data = await getMensajesConversacion(
        conversacion.Conversacion_Id
      );

      console.log('Mensajes de la conversación:', data);

      setMensajes(data?.mensajes || []);

      // Intentamos marcar como leídos.
      // Si es administrador, el backend simplemente
      // devuelve actualizados = 0.
      try {
        await marcarMensajesLeidos(
          conversacion.Conversacion_Id
        );
      } catch (errorLeidos) {
        console.warn(
          'No se pudieron marcar los mensajes como leídos:',
          errorLeidos
        );
      }

    } catch (err) {
      console.error('Error al cargar mensajes:', err);

      setErrorMensajes(
        err.message || 'No se pudieron cargar los mensajes'
      );
    } finally {
      setCargandoMensajes(false);
    }
  };

  // --------------------------------------------------
  // Enviar mensaje
  // --------------------------------------------------

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();

    if (!conversacionSeleccionada) {
      return;
    }

    const texto = contenido.trim();

    if (!texto) {
      return;
    }

    try {
      setEnviando(true);
      setErrorMensajes('');

      await enviarMensaje(
        conversacionSeleccionada.Conversacion_Id,
        texto
      );

      setContenido('');

      // Volvemos a cargar los mensajes para mostrar
      // inmediatamente el mensaje recién enviado.
      const data = await getMensajesConversacion(
        conversacionSeleccionada.Conversacion_Id
      );

      setMensajes(data?.mensajes || []);

    } catch (err) {
      console.error('Error al enviar mensaje:', err);

      setErrorMensajes(
        err.message || 'No se pudo enviar el mensaje'
      );
    } finally {
      setEnviando(false);
    }
  };

  // --------------------------------------------------
  // Volver a la lista
  // --------------------------------------------------

  const cerrarConversacion = () => {
    setConversacionSeleccionada(null);
    setMensajes([]);
    setContenido('');
    setErrorMensajes('');
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="page-container">

      <h1>
        Mensajes
      </h1>

      {cargando && (
        <p>
          Cargando conversaciones...
        </p>
      )}

      {error && (
        <p>
          Error: {error}
        </p>
      )}

      {!cargando && !error && (
        <>
          {!conversacionSeleccionada ? (
            <>
              {conversaciones.length === 0 ? (
                <p>
                  No hay conversaciones disponibles.
                </p>
              ) : (
                <div>
                  {conversaciones.map((conversacion) => (
                    <div
                      key={conversacion.Conversacion_Id}
                      onClick={() =>
                        abrirConversacion(conversacion)
                      }
                      style={{
                        border: '1px solid #ddd',
                        padding: '15px',
                        marginBottom: '10px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <h3>
                        Conversación #{conversacion.Conversacion_Id}
                      </h3>

                      <p>
                        <strong>Docente:</strong>{' '}
                        {conversacion.Docente_Nombre ||
                          'Sin nombre'}
                      </p>

                      <p>
                        <strong>Apoderado:</strong>{' '}
                        {conversacion.Apoderado_Nombre ||
                          'Sin nombre'}
                      </p>

                      <p>
                        <strong>Estado:</strong>{' '}
                        {conversacion.Conversacion_Estado
                          ? 'Activa'
                          : 'Inactiva'}
                      </p>

                      {conversacion.Ultimo_Mensaje && (
                        <p>
                          <strong>Último mensaje:</strong>{' '}
                          {conversacion.Ultimo_Mensaje}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>

              {/* -------------------------------------- */}
              {/* Cabecera conversación                   */}
              {/* -------------------------------------- */}

              <div
                style={{
                  borderBottom: '1px solid #ddd',
                  paddingBottom: '15px',
                  marginBottom: '15px'
                }}
              >

                <button
                  type="button"
                  onClick={cerrarConversacion}
                  style={{
                    marginBottom: '15px',
                    padding: '8px 12px',
                    cursor: 'pointer'
                  }}
                >
                  ← Volver a conversaciones
                </button>

                <h2>
                  Conversación #
                  {conversacionSeleccionada.Conversacion_Id}
                </h2>

                <p>
                  <strong>Docente:</strong>{' '}
                  {conversacionSeleccionada.Docente_Nombre ||
                    'Sin nombre'}
                </p>

                <p>
                  <strong>Apoderado:</strong>{' '}
                  {conversacionSeleccionada.Apoderado_Nombre ||
                    'Sin nombre'}
                </p>

                <p>
                  <strong>Estado:</strong>{' '}
                  {conversacionSeleccionada.Conversacion_Estado
                    ? 'Activa'
                    : 'Inactiva'}
                </p>

              </div>

              {/* -------------------------------------- */}
              {/* Error de mensajes                       */}
              {/* -------------------------------------- */}

              {errorMensajes && (
                <p>
                  Error: {errorMensajes}
                </p>
              )}

              {/* -------------------------------------- */}
              {/* Cargando mensajes                       */}
              {/* -------------------------------------- */}

              {cargandoMensajes && (
                <p>
                  Cargando mensajes...
                </p>
              )}

              {/* -------------------------------------- */}
              {/* Lista de mensajes                      */}
              {/* -------------------------------------- */}

              {!cargandoMensajes && (
                <div
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '15px',
                    minHeight: '250px'
                  }}
                >

                  {mensajes.length === 0 ? (
                    <p>
                      No hay mensajes en esta conversación.
                    </p>
                  ) : (
                    mensajes.map((mensaje) => (
                      <div
                        key={mensaje.Mensaje_Id}
                        style={{
                          marginBottom: '12px',
                          padding: '10px',
                          border: '1px solid #eee',
                          borderRadius: '8px'
                        }}
                      >

                        <p>
                          <strong>
                            {mensaje.Mensaje_Remitente_Rol ||
                              'Usuario'}
                          </strong>
                        </p>

                        <p>
                          {mensaje.Mensaje_Contenido}
                        </p>

                        <small>
                          {mensaje.Mensaje_Fecha_Envio}{' '}
                          {mensaje.Mensaje_Hora_Envio}
                        </small>

                      </div>
                    ))
                  )}

                </div>
              )}

              {/* -------------------------------------- */}
              {/* Formulario para enviar                  */}
              {/* -------------------------------------- */}

              {conversacionSeleccionada.Conversacion_Estado ? (
                <form onSubmit={handleEnviarMensaje}>

                  <textarea
                    value={contenido}
                    onChange={(e) =>
                      setContenido(e.target.value)
                    }
                    placeholder="Escribe un mensaje..."
                    maxLength={5000}
                    rows={4}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      padding: '10px',
                      boxSizing: 'border-box',
                      marginBottom: '10px'
                    }}
                    disabled={enviando}
                  />

                  <button
                    type="submit"
                    disabled={
                      enviando ||
                      !contenido.trim()
                    }
                    style={{
                      padding: '10px 16px',
                      cursor:
                        enviando ||
                        !contenido.trim()
                          ? 'not-allowed'
                          : 'pointer'
                    }}
                  >
                    {enviando
                      ? 'Enviando...'
                      : 'Enviar mensaje'}
                  </button>

                </form>
              ) : (
                <p>
                  Esta conversación está cerrada y no permite
                  enviar nuevos mensajes.
                </p>
              )}

            </div>
          )}
        </>
      )}

    </div>
  );
}

export default Mensajes;