import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registrarApoderado } from "../../services/api";
import {
  validarRut, normalizarRut, validarNombreCompleto, validarCorreo, validarTelefonoChileno,
  validarFortalezaContrasena, validarDireccion, MENSAJE_TELEFONO, MAX_NOMBRE_COMPLETO,
} from "../../utils/validaciones";

const CAMPOS_DIRECCION = ["calle", "numero", "depto", "comuna"];


function RegisterGuardian() {


  const navigate = useNavigate();



  const [formData, setFormData] = useState({

    nombre:"",
    rut:"",
    correo:"",
    telefono:"",
    calle:"",
    numero:"",
    depto:"",
    comuna:"",
    password:"",
    estado:"Activo",

  });


  const [errores, setErrores] = useState({});
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState(null);


  const validarCampo = (name, value, datos = formData) => {
    if (CAMPOS_DIRECCION.includes(name)) {
      return validarDireccion({ ...datos, [name]: value })[name] || "";
    }
    switch (name) {
      case "nombre":
        return value && !validarNombreCompleto(value)
          ? "Ingrese nombre y apellido, solo letras y espacios (ej: Juan Pérez)"
          : "";
      case "rut":
        return value && !validarRut(value)
          ? "RUT inválido. Formato esperado: 12345678-9"
          : "";
      case "correo":
        return value && !validarCorreo(value)
          ? "Ingrese un correo electrónico válido"
          : "";
      case "telefono":
        return value && !validarTelefonoChileno(value) ? MENSAJE_TELEFONO : "";
      case "password":
        return value ? validarFortalezaContrasena(value) : "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const valorNorm = name === "rut" ? normalizarRut(value) : value;
    setFormData({ ...formData, [name]: valorNorm });
    setErrores({ ...errores, [name]: validarCampo(name, valorNorm) });
  };




  const handleSubmit = async(e)=>{


    e.preventDefault();

    const nuevosErrores = {
      nombre: validarCampo("nombre", formData.nombre),
      rut: validarCampo("rut", formData.rut),
      correo: validarCampo("correo", formData.correo),
      telefono: validarCampo("telefono", formData.telefono),
      password: validarCampo("password", formData.password),
      ...validarDireccion(formData),
    };

    if (Object.values(nuevosErrores).some((msg) => msg)) {
      setErrores(nuevosErrores);
      return;
    }

    setLoading(true);
    setError(null);



    try{


      await registrarApoderado(formData);



      alert(
        "Apoderado registrado correctamente"
      );



      navigate("/usuarios");



    }catch(err){



      if(err.data?.requiereAsignacionRol){



        alert(
          err.data.mensaje
        );



        navigate(
          `/gestion-roles/${err.data.usuarioId}`
        );



        return;


      }




      setError(

        err.message ||
        "Error al registrar el apoderado"

      );



    }finally{


      setLoading(false);


    }



  };




  return(


    <div className="page-container">


      <div className="form-card">


        <h1>
          Registrar Apoderado
        </h1>



        {
          error &&
          <p style={{color:"red"}}>
            {error}
          </p>
        }




        <form onSubmit={handleSubmit}>


          <div>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre completo (ej: Juan Pérez)"
              maxLength={MAX_NOMBRE_COMPLETO}
              value={formData.nombre}
              onChange={handleChange}
              className={errores.nombre ? "input-invalid" : ""}
              required
            />
            {errores.nombre && <span className="input-error-msg">{errores.nombre}</span>}
          </div>



          <div>
            <input
              type="text"
              name="rut"
              placeholder="RUT (ej: 12345678-9)"
              value={formData.rut}
              onChange={handleChange}
              className={errores.rut ? "input-invalid" : ""}
              required
            />
            {errores.rut && <span className="input-error-msg">{errores.rut}</span>}
          </div>



          <div>
            <input
              type="email"
              name="correo"
              placeholder="Correo electrónico"
              value={formData.correo}
              onChange={handleChange}
              className={errores.correo ? "input-invalid" : ""}
              required
            />
            {errores.correo && <span className="input-error-msg">{errores.correo}</span>}
          </div>



          <div>
            <input
              type="tel"
              name="telefono"
              placeholder="Número telefónico (ej: 912345678 o +56912345678)"
              value={formData.telefono}
              onChange={handleChange}
              className={errores.telefono ? "input-invalid" : ""}
              required
            />
            {errores.telefono && <span className="input-error-msg">{errores.telefono}</span>}
          </div>



          {[
            { name: "calle",  placeholder: "Calle (ej: Avenida Concha y Toro)", maxLength: 100, required: true },
            { name: "numero", placeholder: "Número (ej: 134)",                  maxLength: 7,   required: true },
            { name: "depto",  placeholder: "Depto./Casa (opcional)",            maxLength: 20,  required: false },
            { name: "comuna", placeholder: "Comuna (ej: Puente Alto)",          maxLength: 60,  required: true },
          ].map((campo) => (
            <div key={campo.name}>
              <input
                type="text"
                name={campo.name}
                placeholder={campo.placeholder}
                maxLength={campo.maxLength}
                value={formData[campo.name]}
                onChange={handleChange}
                className={errores[campo.name] ? "input-invalid" : ""}
                required={campo.required}
              />
              {errores[campo.name] && <span className="input-error-msg">{errores[campo.name]}</span>}
            </div>
          ))}



          <div>
            <input
              type="password"
              name="password"
              placeholder="Contraseña (mín. 8 caracteres, una mayúscula y un número)"
              value={formData.password}
              onChange={handleChange}
              className={errores.password ? "input-invalid" : ""}
              required
            />
            {errores.password && <span className="input-error-msg">{errores.password}</span>}
          </div>



          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
          >

            <option value="Activo">
              Activo
            </option>


            <option value="Inactivo">
              Inactivo
            </option>


          </select>




          <button
            type="submit"
            disabled={loading}
          >

            {
              loading
              ? "Registrando..."
              : "Registrar Apoderado"
            }


          </button>



        </form>



      </div>



    </div>


  );


}


export default RegisterGuardian;
