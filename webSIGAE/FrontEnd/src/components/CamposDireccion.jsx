import { validarDireccion } from "../utils/validaciones";

// Campos de la dirección particular (calle, número, depto/casa opcional y comuna).
// Se usa en el registro de todo usuario y en la ficha del estudiante (Incremento 3).
export const CAMPOS_DIRECCION = ["calle", "numero", "depto", "comuna"];

const DEFINICION = [
  { name: "calle",  placeholder: "Calle (ej: Avenida Concha y Toro)", maxLength: 100, required: true },
  { name: "numero", placeholder: "Número (ej: 134)",                  maxLength: 7,   required: true },
  { name: "depto",  placeholder: "Depto./Casa (opcional)",            maxLength: 20,  required: false },
  { name: "comuna", placeholder: "Comuna (ej: Puente Alto)",          maxLength: 60,  required: true },
];

// Mensaje de error de un campo de dirección considerando el resto de la dirección
export function errorCampoDireccion(name, value, datos) {
  return validarDireccion({ ...datos, [name]: value })[name] || "";
}

function CamposDireccion({ valores, errores = {}, onChange }) {
  return DEFINICION.map((campo) => (
    <div key={campo.name}>
      <input
        type="text"
        name={campo.name}
        placeholder={campo.placeholder}
        maxLength={campo.maxLength}
        value={valores[campo.name] || ""}
        onChange={onChange}
        className={errores[campo.name] ? "input-invalid" : ""}
        required={campo.required}
      />
      {errores[campo.name] && <span className="input-error-msg">{errores[campo.name]}</span>}
    </div>
  ));
}

export default CamposDireccion;
