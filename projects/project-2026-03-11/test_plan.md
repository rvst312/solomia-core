# Plan de Pruebas para el Sistema de Autenticación de Usuario

**1. Objetivo de las Pruebas:**
Verificar que el sistema de autenticación de usuario funcione correctamente, asegurando que los usuarios puedan registrarse, iniciar sesión, cerrar sesión y recuperar contraseñas.

---

**2. Casos de Prueba Unitarios:**

### Caso de Prueba 1: Registro de Usuario
- **Descripción:** Verificar que un usuario pueda registrarse exitosamente.
- **Entrada:** Nombre: "Juan", Email: "juan@example.com", Contraseña: "Contraseña123".
- **Salida Esperada:** Usuario registrado exitosamente en la base de datos.
- **Condición:** El registro debe ser único (mismo email no permitido).

### Caso de Prueba 2: Inicio de Sesión
- **Descripción:** Verificar que un usuario pueda iniciar sesión con credenciales correctas.
- **Entrada:** Email: "juan@example.com", Contraseña: "Contraseña123".
- **Salida Esperada:** Sesión iniciada y redirigido al panel principal.

### Caso de Prueba 3: Validación de Contraseña
- **Descripción:** Verificar que el sistema valide correctamente el formato de la contraseña.
- **Entrada:** Contraseña: "12345".
- **Salida Esperada:** Mensaje de error: "La contraseña debe tener al menos 8 caracteres".

### Caso de Prueba 4: Validación de Formato de Email
- **Descripción:** Verificar que un formato de email inválido sea rechazado.
- **Entrada:** Email: "not-an-email".
- **Salida Esperada:** Mensaje de error: "Email no válido".

---

**3. Casos de Prueba de Integración:**

### Caso de Prueba 1: Registro + Envío de Confirmación de Email
- **Descripción:** Verificar que después de un registro exitoso, se envíe un email de confirmación.
- **Acciones:**
  1. Registrar un nuevo usuario.
  2. Comprobar la bandeja de entrada del email.
- **Salida Esperada:** Email enviado con un enlace de confirmación.

### Caso de Prueba 2: Inicio de Sesión + Actualización de Estado de Sesión
- **Descripción:** Verificar que el inicio de sesión actualice el estado de sesión del usuario.
- **Acciones:**
  1. Iniciar sesión con un usuario válido.
  2. Comprobar el estado de sesión en la base de datos.
- **Salida Esperada:** Estado de sesión actualizado a "activo".

### Caso de Prueba 3: Recuperación de Contraseña + Envío de Email
- **Descripción:** Verificar que al solicitar la recuperación de contraseña se envíe un email con instrucciones.
- **Acciones:**
  1. Solicitar recuperar contraseña para un usuario conocido.
  2. Comprobar bandeja de entrada del email.
- **Salida Esperada:** Email con enlace para restablecer contraseña.

---

**4. Casos de Prueba E2E (Final a Final):**

### Caso de Prueba 1: Flujo Completo de Registro a Inicio de Sesión
- **Descripción:** Verificar que un usuario pueda registrarse y luego iniciar sesión con éxito.
- **Pasos:**
  1. Acceder a la página de registro.
  2. Completar el formulario con datos válidos.
  3. Confirmar el registro a través del email.
  4. Acceder a la página de inicio de sesión.
  5. Ingresar con las credenciales del nuevo usuario.
- **Salida Esperada:** El usuario es redirigido al panel principal después de iniciar sesión.

### Caso de Prueba 2: Recuperación de Contraseña
- **Descripción:** Verificar el proceso de recuperación de contraseña.
- **Pasos:**
  1. Acceder a la página de inicio de sesión.
  2. Hacer clic en "¿Olvidaste tu contraseña?".
  3. Ingresar el email registrado.
  4. Seguir el enlace recibido en el email para crear una nueva contraseña.
- **Salida Esperada:** El usuario puede iniciar sesión con la nueva contraseña.

---

**5. Pruebas Manuales:**

### Prueba Manual 1: Validación de Mensajes de Error
- **Descripción:** Comprobar que se muestren mensajes de error correctos en escenarios de registro y inicio de sesión fallidos.
- **Pasos:**
  1. Intentar registrarse con un email ya existente.
  2. Intentar iniciar sesión con un email no registrado.
  3. Ingresar una contraseña incorrecta.
- **Salida Esperada:** Mensajes de error claros y específicos.

### Prueba Manual 2: Probar Escalabilidad
- **Descripción:** Verificar el rendimiento del sistema al registrar múltiples usuarios simultáneamente.
- **Pasos:**
  1. Realizar registros concurrentes (por ejemplo, 100 usuarios).
  2. Medir el tiempo de respuesta del sistema.
- **Salida Esperada:** El sistema debe manejar múltiples registros sin fallas.

---

**6. Herramientas y Tecnología:**
- **Lenguaje de Pruebas:** JavaScript / Java
- **Framework de Pruebas Unitarias:** JUnit / Mocha
- **Herramientas de Pruebas E2E:** Selenium / Cypress
- **Sistema de seguimiento de errores:** Jira

---

**7. Consideraciones de Seguridad:**
- Utilizar tokens seguros para operaciones críticas como la recuperación de contraseña.
- Implementar validaciones rigurosas para entradas de usuario, con especial atención a la seguridad en los campos de email y contraseñas.
- Asegurarse de que la comunicación a través del sistema de autenticación se realice sobre HTTPS.

---

Este plan de pruebas proporciona un marco integral para asegurar que el sistema de autenticación de usuarios esté bien cubierto desde los puntos de vista funcional, de integración y de seguridad. Con una buena implementación de este plan, se asegurará que se mantenga un alto estándar de calidad y satisfacción del usuario en las funcionalidades críticas del sistema.