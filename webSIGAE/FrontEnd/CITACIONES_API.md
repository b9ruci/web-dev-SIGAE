# Contrato API — Módulo de Citaciones (CU74–CU79 / RF48–RF53)

El frontend (`src/pages/communications/Citaciones.jsx`, `HistorialCitaciones.jsx` y
`src/components/citaciones/`) consume estos endpoints desde `src/services/api.js`.
Los nombres de las funciones siguen los mensajes de los diagramas de secuencia.
**El backend aún no los implementa.**

Todas las respuestas de error usan `{ "mensaje": "..." }`; el frontend muestra ese texto tal cual.

| Función frontend | Método y ruta | CU |
| --- | --- | --- |
| `getCitaciones(rol)` | `GET /api/citaciones?rol=Docente\|Apoderado` | CU78 |
| `getCitacionesPendientes(rol)` | `GET /api/citaciones/pendientes?rol=...` | CU75 |
| `getDetalleCitacion(id)` | `GET /api/citaciones/:id` | CU76, CU77 |
| `crearCitacion(datos)` | `POST /api/citaciones` | CU74 |
| `confirmarCitacion(id)` | `PATCH /api/citaciones/:id/confirmar` | CU75 |
| `cancelarCitacion(id, motivo)` | `PATCH /api/citaciones/:id/cancelar` | CU76 |
| `reprogramarCitacion(id, datos)` | `PATCH /api/citaciones/:id/reprogramar` | CU77 |
| `getHistorialCitaciones(estudianteId)` | `GET /api/citaciones/estudiante/:id/historial` | CU79 |

`rol` es el rol activo del usuario (uno con rol "Docente y Apoderado" ve una agenda distinta según el rol elegido).

## Objeto citación

Columnas de la tabla `citacion` más los nombres unidos por JOIN:

```json
{
  "Citacion_Id": 33,
  "Citacion_Fecha": "2026-06-20",
  "Citacion_Tramo_Horario": "17:00 - 17:30",
  "Citacion_Motivo": "Bullying",
  "Citacion_Modalidad": "Presencial",
  "Citacion_Estado": "Pendiente de confirmación",
  "Citacion_Fecha_Confirmacion": null,
  "Citacion_Motivo_Cancelacion": null,
  "Citacion_Observaciones_Posteriores": null,
  "Estudiante_Id": 222222222,
  "Estudiante_Nombre_Completo": "…",
  "Curso_Nombre": "…",
  "Apoderado_Usuario_Id": 4,
  "Apoderado_Nombre": "…",
  "Docente_Usuario_Id": 3,
  "Docente_Nombre": "…",
  "Requiere_Confirmacion_De": "Apoderado"
}
```

- `Citacion_Estado`: `"Pendiente de confirmación"`, `"Confirmada"` o `"Cancelada"` (igual que el dump).
- `Requiere_Confirmacion_De` (opcional): `"Apoderado"` o `"Docente"`. Tras una reprogramación (CU77)
  debe confirmar la contraparte de quien reprogramó. Si se omite, el frontend asume `"Apoderado"`.
- Tramos válidos: bloques de 30 min entre 08:00 y 18:00 con el formato `"HH:MM - HH:MM"`.
- Modalidades válidas: `"Presencial"`, `"Online"`.

## Respuestas esperadas

- **Listas** (`GET /api/citaciones`, `/pendientes`): un arreglo de citaciones, o bien
  `200 { "mensaje": "No existen citaciones…", "citaciones": [] }` cuando no hay registros
  (CU78 Exc. 1 / CU75 Exc. 1).
- **Detalle**: la citación, o `{ "citacion": {...} }`. `404` si no existe o no pertenece al usuario (CU76/CU77 Exc. 1).
- **Crear**, body `{ Estudiante_Id, Citacion_Fecha, Citacion_Tramo_Horario, Citacion_Motivo, Citacion_Modalidad }`:
  - `201 { mensaje }`: se registra como `"Pendiente de confirmación"`.
  - `400 { mensaje, errores? }`: datos inválidos (Exc. 1). `errores` puede venir por campo
    (`estudianteId`, `fecha`, `tramo`, `motivo`, `modalidad`).
  - `409 { mensaje }`: sin disponibilidad para el docente o el apoderado en esa fecha y tramo (Exc. 2).
- **Confirmar**: `200 { mensaje }`. Actualiza a `"Confirmada"`, registra `Citacion_Fecha_Confirmacion`
  e inserta en `historial` (fecha y hora). Si algo falla, `500 { mensaje }` (Exc. 2).
- **Cancelar**, body `{ Citacion_Motivo_Cancelacion }`: `200 { mensaje }`. Actualiza a `"Cancelada"`
  e inserta en `historial`. Si el motivo está vacío, `400` (Exc. 2).
- **Reprogramar**, body `{ Citacion_Fecha, Citacion_Tramo_Horario }`: `200 { mensaje }`. Vuelve a
  `"Pendiente de confirmación"` y fija `Requiere_Confirmacion_De`. `409` si hay conflicto de horario (Exc. 2).
- **Historial**: `{ "citaciones": [ { ...citación, "historial": [ ... ] } ] }`, ordenado por fecha.
  El historial también puede venir plano en `{ citaciones, historial }` (cada registro con `Citacion_Id`).
  Campos del historial: `Historial_Fecha_Registro`, `Historial_Hora_Registro`, `Historial_Descripcion_Cambio`,
  `Historial_Atributo_Modificado`, `Historial_Valor_Anterior`, `Historial_Valor_Nuevo` y,
  opcionalmente, `Usuario_Responsable_Nombre`. Sin registros: `200 { mensaje, citaciones: [] }` (Exc. 1).
  Error: `500 { mensaje }` (Exc. 2).

## Permisos

- Docente: solo sus citaciones (`Docente_Usuario_Id`). Crea citaciones solo para estudiantes de sus cursos que tengan apoderado.
- Apoderado: solo sus citaciones (`Apoderado_Usuario_Id`) y el historial de sus estudiantes asociados.
- Administrador / Super Admin: solo lectura del historial de cualquier estudiante (CU79).
