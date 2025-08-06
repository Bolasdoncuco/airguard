const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  ubicacion: {
    lat: Number,
    long: Number,
    ciudad: String,
    pais: String,
  },
  createdAt: { type: Date, default: Date.now }
}); 
module.exports = mongoose.model('User', userSchema);


// Este archivo define el esquema de un usuario en MongoDB usando Mongoose.
// El esquema incluye campos para el email, contraseña (opcional por ahora) y la fecha de creación del usuario.
// El campo email es único y requerido, lo que significa que no puede haber dos usuarios con el mismo email.
// El modelo se exporta para ser utilizado en otras partes de la aplicación, como en las rutas de autenticación.
// Esto permite crear, leer, actualizar y eliminar usuarios en la base de datos MongoDB.