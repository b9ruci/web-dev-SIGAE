import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registrarApoderado } from "../../services/api";
import { validarRut, validarCorreo } from "../../utils/validaciones";


function RegisterGuardian() {


  const navigate = useNavigate();



  const [formData, setFormData] = useState({

    nombre:"",
    rut:"",
    correo:"",
    telefono:"",
    direccion:"",
    password:"",
    estado:"Activo",

  });


  const [errores, setErrores] = useState({});
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState(null);


  const validarCampo = (name, value) => {
    switch (name) {
      case "rut":
        return value && !validarRut(value)
          ? "RUT inválido. Formato esperado: 12345678-9"
          : "";
      case "correo":
        return value && !validarCorreo(value)
          ? "Ingrese un correo electrónico válido"
          : "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrores({ ...errores, [name]: validarCampo(name, value) });
  };




  const handleSubmit = async(e)=>{


    e.preventDefault();

    const nuevosErrores = {
      rut: validarCampo("rut", formData.rut),
      correo: validarCampo("correo", formData.correo),
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


          <input
            type="text"
            name="nombre"
            placeholder="Nombre completo"
            value={formData.nombre}
            onChange={handleChange}
            required
          />



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



          <input
            type="text"
            name="telefono"
            placeholder="Número telefónico"
            value={formData.telefono}
            onChange={handleChange}
            required
          />



          <input
            type="text"
            name="direccion"
            placeholder="Dirección particular"
            value={formData.direccion}
            onChange={handleChange}
            required
          />



          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
          />



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
