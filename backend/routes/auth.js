const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html) => {
  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log('Correo enviado a', to);
  } catch (error) {
    console.error('Error al enviar correo:', error);
    if (error.response && error.response.body) {
      console.error('SendGrid response body:', error.response.body);
    }
    throw error;
  }
};

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });

    res.status(200).json({ userId: user._id });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});



router.post('/register', async (req, res) => {
  const { nombre, email, password, location } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      nombre,
      email,
      password: hashedPassword,
      ubicacion: location,
      fecha_creacion: new Date(),
    });

    await user.save();

    res.status(201).json({ userId: user._id });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

//Resetear contraseña
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = Date.now() + 1000 * 60 * 15;

  user.resetToken = token;
  user.resetTokenExpires = tokenExpiry;
  await user.save();

  const resetLink = `https://tuapp.com/reset-password/${token}`;

  await sendEmail(
    email,
    'Recupera tu contraseña',
    `<p>Hola, haz clic en el siguiente enlace para restablecer tu contraseña:</p>
     <a href="${resetLink}">${resetLink}</a>
     <p>Este enlace es válido por 15 minutos.</p>`
  );

  res.json({ message: 'Correo de recuperación enviado' });
});


module.exports = router;