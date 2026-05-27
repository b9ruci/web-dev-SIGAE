SELECT Usuario_Id, Usuario_Correo, Usuario_Contraseña,
       Usuario_Nombre_Completo, Usuario_Estado_Cuenta,
       Es_Administrador, Es_Docente, Es_Apoderado
FROM usuario
WHERE Usuario_Correo = ?

INSERT INTO sesion (
  Sesion_Token_Acceso,
  Sesion_Fecha_Inicio,
  Sesion_Fecha_Expiracion,
  Sesion_Direccion_IP,
  Sesion_Dispositivo,
  Sesion_Token_Expiracion,
  Usuario_Id
) VALUES (?, NOW(), ?, ?, ?, ?, ?);