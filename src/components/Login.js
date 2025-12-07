import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const Login = () => {
  const [datosFormulario, setDatosFormulario] = useState({
    email: '',
    password: '',
  });

  const [cargaDatos, setCargaDatos] = useState(false);
  const [message, setMessage] = useState('');

  const cambiosFormulario = (e) => {
    const { name, value } = e.target;
    setDatosFormulario({ ...datosFormulario, [name]: value });
  };

  // ✅ Validación propia en JavaScript (no del navegador)
  const validarFormulario = () => {
    setMessage(''); // limpiamos mensaje previo

    const { email, password } = datosFormulario;

    if (!email) {
      setMessage('El correo electrónico es obligatorio.');
      return false;
    }

    // Validar formato básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('El correo electrónico no tiene un formato válido.');
      return false;
    }

    if (!password) {
      setMessage('La contraseña es obligatoria.');
      return false;
    }

    if (password.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }

    return true;
  };

  const controlSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // ⛔ Primero validamos con nuestra lógica JS
    const esValido = validarFormulario();
    if (!esValido) return;

    setCargaDatos(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: datosFormulario.email,
      password: datosFormulario.password,
    });

    setCargaDatos(false);

    if (error) {
      console.error('Error de inicio de sesión:', error.message);
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('¡Inicio de sesión exitoso!');
      // La página se actualizará automáticamente gracias al listener en App.js
    }
  };

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: 'auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
      }}
    >
      <h2>Iniciar Sesión</h2>
      <form onSubmit={controlSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="text"          
            id="email"
            name="email"
            value={datosFormulario.email}
            onChange={cambiosFormulario}
            /* quitamos required para que no valide el navegador automáticamente */
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={datosFormulario.password}
            onChange={cambiosFormulario}
            /* sin required: validamos en JS */
          />
        </div>
        <button type="submit" disabled={cargaDatos}>
          {cargaDatos ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>
      </form>
      {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
    </div>
  );
};

export default Login;
