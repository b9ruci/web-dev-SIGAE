bash#!/bin/bash
set -e

echo "=== Instalando MySQL ==="
sudo apt-get update -q
sudo apt-get install -y -q mariadb-server

echo "=== Iniciando MySQL ==="
sudo service mariadb start

echo "=== Configurando usuario BD ==="
sudo mariadb -u root -e "
  CREATE DATABASE IF NOT EXISTS sigae;
  CREATE USER IF NOT EXISTS 'sigae'@'127.0.0.1' IDENTIFIED BY 'sigae123';
  GRANT ALL PRIVILEGES ON sigae.* TO 'sigae'@'127.0.0.1';
  FLUSH PRIVILEGES;
"

echo "=== Importando base de datos ==="
if [ -f /workspaces/web-dev-SIGAE/webSIGAE/Database/SIGAE.sql ]; then
  sudo mariadb -u root sigae < /workspaces/web-dev-SIGAE/webSIGAE/Database/SIGAE.sql
  echo "✅ SQL importado"
else
  echo "⚠️  SIGAE.sql no encontrado, saltando importación"
fi

echo "=== Instalando dependencias Backend ==="
cd /workspaces/web-dev-SIGAE/webSIGAE/BackEnd
npm install

echo "=== Instalando dependencias Frontend ==="
cd /workspaces/web-dev-SIGAE/webSIGAE/FrontEnd
npm install

echo "=== Creando .env ==="
cat > /workspaces/web-dev-SIGAE/webSIGAE/BackEnd/.env << 'ENVEOF'
JWT_SECRET=un_secreto_muy_largo_y_seguro
PORT=3000
DB_HOST=127.0.0.1
DB_USER=sigae
DB_PASSWORD=sigae123
DB_NAME=sigae
FRONTEND_URL=http://localhost:5173
ENVEOF

echo "=== Hasheando contraseñas ==="
cd /workspaces/web-dev-SIGAE/webSIGAE/BackEnd
node -e "
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', user: 'sigae',
    password: 'sigae123', database: 'sigae'
  });
  const [users] = await conn.execute('SELECT Usuario_Id, Usuario_Contraseña FROM usuario');
  for (const u of users) {
    if (u['Usuario_Contraseña'].startsWith('\$2b\$')) continue;
    const hash = await bcrypt.hash(u['Usuario_Contraseña'], 10);
    await conn.execute('UPDATE usuario SET Usuario_Contraseña = ? WHERE Usuario_Id = ?', [hash, u.Usuario_Id]);
    console.log('Hasheado usuario:', u.Usuario_Id);
  }
  await conn.end();
  console.log('✅ Listo!');
})();
"

echo ""
echo "✅ Setup completado. Ya puedes presionar F5."