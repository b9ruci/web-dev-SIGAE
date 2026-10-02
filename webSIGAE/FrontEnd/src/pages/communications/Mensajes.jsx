import { useEffect, useState } from 'react';
import { getConversaciones } from '../services/api';

function Mensajes() {
  const [conversaciones, setConversaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

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
        setError(err.message || 'No se pudieron cargar las conversaciones');
      } finally {
        setCargando(false);
      }
    };

    cargarConversaciones();
  }, []);

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

      {!cargando && !error && conversaciones.length === 0 && (
        <p>
          No hay conversaciones disponibles.
        </p>
      )}

      {!cargando && !error && conversaciones.length > 0 && (
        <div>
          {conversaciones.map((conversacion) => (
            <div
              key={conversacion.Conversacion_Id}
              style={{
                border: '1px solid #ddd',
                padding: '15px',
                marginBottom: '10px',
                borderRadius: '8px'
              }}
            >
              <h3>
                Conversación #{conversacion.Conversacion_Id}
              </h3>

              <p>
                Docente: {conversacion.Docente_Nombre || 'Sin nombre'}
              </p>

              <p>
                Apoderado: {conversacion.Apoderado_Nombre || 'Sin nombre'}
              </p>

              <p>
                Estado:{' '}
                {conversacion.Conversacion_Estado
                  ? 'Activa'
                  : 'Inactiva'}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default Mensajes;