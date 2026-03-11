```javascript
// authController.js
const User = require('../models/User'); // Importar el modelo de Usuario
const crypto = require('crypto'); // Importar la librería crypto para la generación de tokens
const nodemailer = require('nodemailer'); // Importar nodemailer para el envío de emails

// Registrar un nuevo usuario
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    // Validación de email
    if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ message: 'Email no válido' });
    }

    // Validación de contraseña
    if (password.length < 8) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El email ya está en uso' });
        }
        
        // Crear y guardar el nuevo usuario
        const user = new User({ name, email, password });
        await user.save();

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error registrando el usuario', error });
    }
};

// Iniciar sesión
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        // Aquí agregar lógica para la sesión del usuario
        res.status(200).json({ message: 'Inicio de sesión exitoso' });
    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión', error });
    }
};

// Recuperar contraseña
exports.resetPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Generar un token seguro para la recuperación de contraseña
        const token = crypto.randomBytes(32).toString('hex');
        
        // Aquí se debería guardar el token en la base de datos junto con su vencimiento

        // Enviar email de recuperación
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            to: user.email,
            subject: 'Recuperación de Contraseña',
            text: `Para restablecer tu contraseña, haz clic en el siguiente enlace: 
            http://localhost:3000/reset/${token}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ message: 'Error al enviar el email' });
            }
            res.status(200).json({ message: 'Email enviado con instrucciones' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al procesar la solicitud', error });
    }
};

// Cerrar sesión
exports.logout = (req, res) => {
    // Aquí agregamos la lógica para cerrar sesión, como eliminar el token de sesión
    res.status(200).json({ message: 'Sesión cerrada exitosamente' });
};
```

```javascript
// User.js (modelo)
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Se puede agregar un campo para almacenar el token de recuperación y su fecha de expiración
});

module.exports = mongoose.model('User', UserSchema);
```

```javascript
// authRoutes.js
const express = require('express');
const { register, login, resetPassword, logout } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);          // Ruta para registro de usuario
router.post('/login', login);                // Ruta para iniciar sesión
router.post('/reset', resetPassword);        // Ruta para recuperar contraseña
router.post('/logout', logout);              // Ruta para cerrar sesión

module.exports = router;
```

```javascript
// test/authController.test.js
const request = require('supertest');
const app = require('../app'); // Importar la aplicación Express
const User = require('../models/User');

describe('Auth Controller Tests', () => {
    beforeAll(async () => {
        await User.deleteMany({}); // Limpiar la base de datos antes de las pruebas
    });

    // Caso de Prueba 1: Registro de Usuario
    it('should register a user successfully', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Juan',
                email: 'juan@example.com',
                password: 'Contraseña123'
            });
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Usuario registrado exitosamente');
    });

    // Caso de Prueba 2: Intentar registrar un usuario existente
    it('should return an error for existing email', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Juan',
                email: 'juan@example.com',
                password: 'Contraseña123'
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('El email ya está en uso');
    });

    // Caso de Prueba 3: Validación de formato de email incorrecto
    it('should return an error for invalid email', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Juan',
                email: 'not-an-email',
                password: 'Contraseña123'
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Email no válido');
    });

    // Caso de Prueba 4: Validación de contraseña débil
    it('should return an error for weak password', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Juan',
                email: 'juan@example.com',
                password: '12345'
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('La contraseña debe tener al menos 8 caracteres');
    });

    // Caso de Prueba 5: Inicio de Sesión
    it('should log in successfully', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Juan',
                email: 'juan@example.com',
                password: 'Contraseña123'
            });
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'juan@example.com',
                password: 'Contraseña123'
            });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Inicio de sesión exitoso');
    });
});
```

### Comments
- **Controller Functions**: Each controller function is clearly documented, detailing their responsibilities and outputs.
- **Model Definition**: User schema is defined with necessary fields and validation.
- **Route Definitions**: API endpoints are set up logically for user authentication.
- **Unit Tests**: Includes tests for registration and login functionalities, serving as a safeguard against regressions.

### Note:
Ensure that the testing framework is set up correctly in your environment and that your database is accessible when running these tests.