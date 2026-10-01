import { categoriaCitacion, etiquetaCategoria } from "../../utils/citaciones";

// CU78: estado visible de la citación (pendiente, futura, confirmada o cancelada)
function EstadoCitacionBadge({ citacion }) {
  return (
    <span className={`cit-badge cit-badge-${categoriaCitacion(citacion)}`} title={citacion.Citacion_Estado}>
      {etiquetaCategoria(citacion)}
    </span>
  );
}

export default EstadoCitacionBadge;
