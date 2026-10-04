import { hhmm } from "../../utils/horarios";

const describir = (c) => (c.lineas?.[0] ? `${c.titulo} (${c.lineas[0]})` : c.titulo);

/**
 * Notificación flotante (esquina superior derecha) que advierte los topes de
 * horario: clases que ocurren al mismo tiempo.
 */
export default function AvisoTopes({ topes, onCerrar }) {
  if (!topes.length) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed", top: 20, right: 20, zIndex: 1000,
        width: "min(380px, calc(100vw - 32px))",
        background: "#fff", borderRadius: 10,
        border: "1px solid #fecaca", borderLeft: "5px solid #dc2626",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        padding: "0.9rem 1rem",
        animation: "slideInRight 0.22s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <strong style={{ color: "#991b1b" }}>
          ⚠ {topes.length === 1 ? "Tope de horario detectado" : `${topes.length} topes de horario detectados`}
        </strong>
        <button
          type="button"
          onClick={onCerrar}
          title="Cerrar aviso"
          style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1rem", color: "#6b7280", lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      <p style={{ margin: "0.35rem 0 0.5rem", fontSize: "0.82rem", color: "#4b5563" }}>
        Hay clases asignadas al mismo tiempo. Contacta a la administración para corregir el horario.
      </p>

      <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem", color: "#374151", maxHeight: 180, overflowY: "auto" }}>
        {topes.map(({ dia, clases: [a, b] }) => (
          <li key={`${a.id}-${b.id}`} style={{ marginBottom: 4 }}>
            <strong>{dia}</strong>: {describir(a)} {hhmm(a.horaInicio)}–{hhmm(a.horaFin)}
            {" y "}
            {describir(b)} {hhmm(b.horaInicio)}–{hhmm(b.horaFin)}
          </li>
        ))}
      </ul>
    </div>
  );
}
