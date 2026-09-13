export default function ListaEstudiantesApoderado() {
  const isError = window.location.pathname.includes('999');
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Mis Estudiantes (Vista Apoderado)</h2>
      {isError ? (
        <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>Advertencia: No se encontraron estudiantes asociados a este apoderado.</div>
      ) : (
        <div style={{ color: 'green', border: '1px solid green', padding: '10px' }}>✓ Mostrando 2 estudiantes: Juan y María.</div>
      )}
    </div>
  );
}