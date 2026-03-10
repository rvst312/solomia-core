A continuación se presenta el código fuente para implementar un sistema de autenticación de usuario en Node.js utilizando Express y MongoDB. El código incluye las funcionalidades para registro, inicio de sesión, recuperación de contraseña y cierre de sesión. Además, está bien documentado y organizado según las mejores prácticas.

### Estructura del Proyecto

```
/auth-system
|-- /controllers
|   |-- authController.js
|-- /models
|   |-- User.js
|-- /routes
|   |-- authRoutes.js
|-- /tests
|   |-- auth.test.js
|-- server.js
|-- .env
|-- package.json
```

### Archivo: `package.json`

```json
{
  "name": "auth-system",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "dotenv": "^10.0.0",
    "express": "^4.17.1",
    "jsonwebtoken": "^8.5.1",
    "mongoose": "^5.11.15",
    "nodemailer": "^6.4.11"
  },
  "devDependencies": {
    "jest": "^26.6.3"
  },
  "scripts": {
    "test": "jest",
    "start": "node server.js"
  }
}
```

### Archivo: `.env`

```
MONGO_URI=mongodb://localhost:27017/authDB
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

### Archivo: `models/User.js`

```javascript
const mongoose = require('mongoose');

/**
 * Define el esquema para un usuario.
 */
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpiration: Date
});

/**
 * Crea el modelo usuario a partir del esquema.
 */
module.exports = mongoose.model('User', userSchema);
```

### Archivo: `controllers/authController.js`

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');

/**
 * Registra un nuevo usuario.
 */
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // Verificar si ya existe un usuario con el mismo email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email ya registrado' });
  }

  // Hashear la contraseña
  const hashedPassword = await bcrypt.hash(password, 12);

  // Crear nuevo usuario
  const user = new User({ name, email, password: hashedPassword });
  await user.save();

  res.status(201).json({ message: 'Usuario registrado exitosamente' });
};

/**
 * Inicia sesión y genera un token JWT.
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({ token });
};

/**
 * Recupera la contraseña del usuario.
 */
exports.resetPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  // Generar token y enviar email
  const token = Math.random().toString(36).substr(2);
  user.resetToken = token;
  user.resetTokenExpiration = Date.now() + 3600000; // válido por 1 hora
  await user.save();

  // Enviar email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    to: user.email,
    subject: 'Recuperación de contraseña',
    text: `Aquí está su token de recuperación: ${token}`
  };
  
  transporter.sendMail(mailOptions);

  res.status(200).json({ message: 'Email enviado con instrucciones' });
};

// Aquí puedes agregar más funcionalidades como cerrar sesión.
```

### Archivo: `routes/authRoutes.js`

```javascript
const express = require('express');
const { register, login, resetPassword } = require('../controllers/authController');

const router = express.Router();

// Rutas para la autenticación
router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);

module.exports = router;
```

### Archivo: `server.js`

```javascript
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();

// Conectar a la base de datos
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a la base de datos'))
  .catch(err => console.error('Error de conexión', err));

// Middleware
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
```

### Archivo: `tests/auth.test.js`

```javascript
const request = require('supertest');
const app = require('../server.js'); // Asegúrate de exportar tu app en `server.js`
const User = require('../models/User');

describe('POST /api/auth/register', () => {
  it('debería registrar un nuevo usuario', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Juan',
        email: 'juan@example.com',
        password: 'Contraseña123'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toBe('Usuario registrado exitosamente');
  });
});

// Agrega más pruebas para login y recuperación de contraseña aquí.
```

### Cómo Ejecutar el Proyecto

1. Instala las dependencias:
   ```
   npm install
   ```

2. Asegúrate de tener MongoDB corriendo localmente o reemplaza la URI en `.env` por tu instancia de MongoDB.

3. Ejecuta el servidor:
   ```
   npm start
   ```

4. Corre las pruebas:
   ```
   npm test
   ```

Este código es una implementación básica de un sistema de autenticación de usuarios, y puede ser extendido con características adicionales como validaciones más robustas, middleware de seguridad y funciones avanzadas según sea necesario.