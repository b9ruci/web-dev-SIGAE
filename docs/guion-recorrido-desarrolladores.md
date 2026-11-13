# Guion del recorrido técnico (equipo de desarrollo)

Puntos clave que quedaron fuera del recorrido de usuario: lo que se hace por script y los correos reales con la cuenta de respaldos.

## 1. Crear un Super Administrador por script (desarrollo)

- Los super administradores no se crean desde la aplicación: solo con `scripts/crearSuperAdmin.js`. Así se creó nuestra cuenta en el servidor real.
- Primero, un intento con datos inválidos para mostrar las validaciones (RUT, correo no institucional, contraseña débil):

```bash
cd webSIGAE/BackEnd && node scripts/crearSuperAdmin.js --rut 11111111-2 --nombre "Prueba" --telefono 123 --correo prueba@gmail.com
```

- Luego, con datos válidos (RUT válido que no exista; la contraseña se pide por consola y no se muestra):

```bash
cd webSIGAE/BackEnd && node scripts/crearSuperAdmin.js --rut <RUT válido> --nombre "Cuenta Prueba" --telefono 912345678 --correo prueba.sigae@colegiojc.cl
```

- Ingresar con esa cuenta: pide el código de activación (en desarrollo aparece en el recuadro amarillo) y luego entra con el menú completo de Super Administrador.
- Repetir el comando con el mismo RUT o correo: se rechaza porque ya existe.

## 2. Expiración del token de sesión por script (desarrollo, CU13)

- Con una sesión abierta del Super Admin de prueba (`5682711-0`), vencer su sesión en la base:

```bash
sudo mariadb sigae -e "UPDATE sesion s JOIN usuario u ON u.Usuario_Id = s.Usuario_Id SET s.Sesion_Fecha_Expiracion = NOW() - INTERVAL 1 MINUTE WHERE u.Usuario_RUT = '5682711-0' AND s.Sesion_Estado = 1;"
```

- Hacer clic en cualquier sección: el sistema rechaza la sesión y lleva a la pantalla de sesión expirada. Es lo mismo que pasa tras 30 minutos sin actividad.

## 3. Respaldo de la base por script (servidor real)

- Por SSH en la EC2, como el usuario de pm2 (dueño del `.env`):

```bash
cd /opt/sigae/web-dev-SIGAE/webSIGAE/BackEnd && sudo -u <usuario-pm2> /usr/bin/node scripts/enviarRespaldo.js
```

- La consola termina con `Enviado a respaldosigae@colegiojc.cl`.
- Abrir `respaldosigae@colegiojc.cl`: llega el correo "Respaldo SIGAE" con `sigae_AAAAMMDD_HHMM.sql.gz`, el LEEME, la fecha y hora de Chile, el SHA-256 y las instrucciones de carga en caso de contingencia.
- Mostrar el respaldo diario automático de días anteriores en la misma bandeja.

## 4. Correos reales con nuestra cuenta (servidor real)

Nuestro Super Administrador del servidor real tiene como correo `respaldosigae@colegiojc.cl`, así que todos sus códigos llegan a esa bandeja.

- **Recuperar contraseña (CU14):** cerrar sesión → **¿Olvidó su contraseña?** → RUT → **Enviar código**. Llega "Código para recuperar tu contraseña - SIGAE" desde `noreply@colegiojc.cl`. Ingresar el código y la contraseña nueva → entrar con ella.
- **Reglas del código:** el botón **Reenviar código** espera 60 segundos; al reenviar, el código anterior deja de servir. Cada código vence a los 10 minutos.
- **Cambiar contraseña desde el perfil (CU16):** Mi Perfil › **Cambiar Contraseña**, con la contraseña actual.
- **Sin recuadro amarillo:** en el servidor real el código solo llega al correo, a diferencia de desarrollo.

## 5. Acciones reales de Super Administrador fuera de la marcha blanca (servidor real)

- **Respaldo del cierre de período:** Gestión Académica › **Cierre de Período** › **Descargar respaldo**. La pantalla confirma *"Se envió una copia del respaldo a respaldosigae@colegiojc.cl"* y el Excel llega a esa bandeja. Solo está disponible con el cierre iniciado, y descargarlo no cambia nada.
- **Iniciar cierre** e **Iniciar nuevo período:** son acciones reales y no se pueden deshacer. Se ejecutan solo cuando el colegio lo decida, nunca como demostración.
