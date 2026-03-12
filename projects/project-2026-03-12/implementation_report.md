```javascript
// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Definición del esquema de usuario
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); // Validación simple de email
            },
            message: props => `${props.value} no es un email válido!`
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8 // Validación de longitud mínima
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

// Middleware para encriptar la contraseña antes de guardar el usuario
userSchema.pre('save', async function(next) {
    if (this.isModified('password') || this.isNew) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Método para comparar contraseña
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

```javascript
// src/controllers/authController.js
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configuración del transporte de correos
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Ajustar al servicio de correo deseado
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Registro de usuario
exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        if (error.code === 11000) { // Código de error para duplicados
            return res.status(400).json({ message: 'Email ya está en uso' });
        }
        res.status(500).json({ message: 'Error al registrar usuario', error });
    }
};

// Inicio de sesión
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        // Lógica para establecer sesión
        res.status(200).json({ message: 'Inicio de sesión exitoso' });
    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión', error });
    }
};

// Recuperación de contraseña
exports.resetPassword = async (req, res) => {
    const { email } = req.body;
    const token = crypto.randomBytes(32).toString('hex');

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
        await user.save();

        // Envío del correo de recuperación
        const mailOptions = {
            to: email,
            from: process.env.EMAIL_USER,
            subject: 'Solicitud de recuperación de contraseña',
            text: `Para restablecer su contraseña, haga clic en el siguiente enlace: 
            http://localhost:3000/reset/${token}`
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email de recuperación enviado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al procesar la recuperación de contraseña', error });
    }
};
```

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../src/app'); // Asegúrate de exportar la app de Express
const User = require('../src/models/User');

describe('Autenticación de Usuario', () => {
    beforeAll(async () => {
        await User.deleteMany(); // Limpia la base de datos antes de los tests
    });

    it('debe registrar un nuevo usuario', async () => {
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

    it('no debe permitir el registro con el mismo email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Juan',
                email: 'juan@example.com',
                password: 'Contraseña123'
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Email ya está en uso');
    });

    it('debe iniciar sesión con credenciales correctas', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Juan',
                email: 'juan@example.com',
                password: 'Contraseña123'
            });
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'juan@example.com',
                password: 'Contraseña123'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Inicio de sesión exitoso');
    });

    it('debe rechazar el inicio de sesión con credenciales incorrectas', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'juan@example.com',
                password: 'ContraseñaIncorrecta'
            });
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Credenciales inválidas');
    });

    it('debe enviar un email de recuperación de contraseña', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Juan',
                email: 'juan@example.com',
                password: 'Contraseña123'
            });
        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({ email: 'juan@example.com' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Email de recuperación enviado');
    });
});
```

```json
// .env
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
MONGO_URI=mongodb://localhost:27017/your_db_name
PORT=3000
```

### Notas Clave:
- El código implementa un sistema de autenticación de usuario básico que incluye funcionalidades para registrar, iniciar sesión y recuperar contraseñas.
- Las contraseñas se almacenan de forma segura utilizando bcrypt, y se utiliza nodemailer para enviar correos electrónicos de recuperación.
- Se implementan pruebas unitarias para verificar el registro de usuarios, inicio de sesión y la función de recuperación de contraseña.
- Asegúrate de revisar y adaptar las configuraciones en el archivo `.env` con tus datos reales de correo y conexión a la base de datos.