export default function HorarioDocente() {
  const isError = window.location.pathname.includes('999');
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Mi Horario (Vista Docente)</h2>
      {isError ? (
        <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>Aviso: No tienes asignaturas programadas para este semestre.</div>
      ) : (
        <div style={{ color: 'green', border: '1px solid green', padding: '10px' }}>✓ Horario cargado: Lunes (Matemáticas), Miércoles (Física).</div>
      )}
    </div>
  );
}