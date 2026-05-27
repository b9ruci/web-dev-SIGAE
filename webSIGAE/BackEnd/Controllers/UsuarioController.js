const db = require('../config/db');
const bcrypt = require('bcrypt');

// Obtener todos los usuarios
const getUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM usuario');
        // Ocultar las contraseñas antes de enviar
        const usuarios = rows.map(usuario => {
            const { Usuario_Contraseña, ...resto } = usuario;
            return resto;
        });
        res.json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
};

// Obtener un usuario por su ID
const getUsuarioById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM usuario WHERE Usuario_Id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        const { Usuario_Contraseña, ...usuario } = rows[0];
        res.json(usuario);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener el usuario' });
    }
};

// Crear un nuevo usuario
const createUsuario = async (req, res) => {
    const {
        Usuario_RUT,
        Usuario_Telefono,
        Usuario_Nombre_Completo,
        Usuario_Correo,
        Usuario_Estado_Cuenta,
        Usuario_Contraseña,
        Usuario_Foto_Perfil,
        Es_Docente,
        Docente_Carga_Horaria_Maxima,
        Docente_Especialidad,
        Es_Administrador,
        Administrador_Tipo,
        Es_Apoderado,
        Apoderado_Direccion
    } = req.body;

    // Validar campos obligatorios
    if (!Usuario_RUT || !Usuario_Telefono || !Usuario_Nombre_Completo || !Usuario_Correo || !Usuario_Contraseña) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios (RUT, teléfono, nombre, correo, contraseña)' });
    }

    try {
        // Verificar si ya existe el RUT o correo
        const [existe] = await db.query(
            'SELECT Usuario_Id FROM usuario WHERE Usuario_RUT = ? OR Usuario_Correo = ?',
            [Usuario_RUT, Usuario_Correo]
        );
        if (existe.length > 0) {
            return res.status(400).json({ mensaje: 'Ya existe un usuario con ese RUT o correo electrónico' });
        }

        // Encriptar contraseña
        const hash = await bcrypt.hash(Usuario_Contraseña, 10);

        // Insertar en la base de datos
        const [resultado] = await db.query(
            `INSERT INTO usuario (
                Usuario_RUT, Usuario_Telefono, Usuario_Nombre_Completo, Usuario_Correo,
                Usuario_Estado_Cuenta, Usuario_Contraseña, Usuario_Foto_Perfil,
                Es_Docente, Docente_Carga_Horaria_Maxima, Docente_Especialidad,
                Es_Administrador, Administrador_Tipo, Es_Apoderado, Apoderado_Direccion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Usuario_RUT,
                Usuario_Telefono,
                Usuario_Nombre_Completo,
                Usuario_Correo,
                Usuario_Estado_Cuenta !== undefined ? Usuario_Estado_Cuenta : 1,
                hash,
                Usuario_Foto_Perfil || null,
                Es_Docente || false,
                Docente_Carga_Horaria_Maxima || null,
                Docente_Especialidad || null,
                Es_Administrador || false,
                Administrador_Tipo || null,
                Es_Apoderado || false,
                Apoderado_Direccion || null
            ]
        );

        // Obtener el usuario recién creado
        const [nuevoUsuario] = await db.query('SELECT * FROM usuario WHERE Usuario_Id = ?', [resultado.insertId]);
        const { Usuario_Contraseña: pwd, ...usuarioSinPwd } = nuevoUsuario[0];
        res.status(201).json(usuarioSinPwd);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear el usuario' });
    }
};

// Actualizar un usuario existente
const updateUsuario = async (req, res) => {
    const { id } = req.params;
    const datosActualizar = req.body;

    // Evitar que se modifique el ID
    delete datosActualizar.Usuario_Id;

    let { Usuario_Contraseña, ...otrosDatos } = datosActualizar;

    try {
        // Verificar que el usuario existe
        const [existe] = await db.query('SELECT * FROM usuario WHERE Usuario_Id = ?', [id]);
        if (existe.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // Si hay nueva contraseña, encriptarla
        let hash = null;
        if (Usuario_Contraseña) {
            hash = await bcrypt.hash(Usuario_Contraseña, 10);
        }

        // Construir la consulta dinámica
        let campos = [];
        let valores = [];

        for (const [campo, valor] of Object.entries(otrosDatos)) {
            campos.push(`${campo} = ?`);
            valores.push(valor);
        }

        if (hash) {
            campos.push(`Usuario_Contraseña = ?`);
            valores.push(hash);
        }

        if (campos.length === 0) {
            return res.status(400).json({ mensaje: 'No hay campos para actualizar' });
        }

        valores.push(id);
        const query = `UPDATE usuario SET ${campos.join(', ')} WHERE Usuario_Id = ?`;
        await db.query(query, valores);

        // Obtener el usuario actualizado
        const [actualizado] = await db.query('SELECT * FROM usuario WHERE Usuario_Id = ?', [id]);
        const { Usuario_Contraseña: pwd, ...usuarioSinPwd } = actualizado[0];
        res.json(usuarioSinPwd);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar el usuario' });
    }
};

// Eliminar un usuario (borrado físico)
const deleteUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const [resultado] = await db.query('DELETE FROM usuario WHERE Usuario_Id = ?', [id]);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error(error);
        // Si hay error de clave foránea, lo capturamos
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ mensaje: 'No se puede eliminar el usuario porque tiene registros relacionados (citas, conversaciones, etc.)' });
        }
        res.status(500).json({ mensaje: 'Error al eliminar el usuario' });
    }
};

module.exports = {
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario
};