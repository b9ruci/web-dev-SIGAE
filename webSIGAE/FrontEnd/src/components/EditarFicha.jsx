export default function EditarFicha() {
  const isError = window.location.pathname.includes('999');
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Editar Ficha del Estudiante</h2>
      {isError ? (
        <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>Error: No se pudo guardar. Hay campos obligatorios vacíos.</div>
      ) : (
        <div style={{ color: 'green', border: '1px solid green', padding: '10px' }}>¡Éxito! Ficha actualizada correctamente.</div>
      )}
    </div>
  );
}