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

  const controlSubmit = async (e) => {
    e.preventDefault();
    setCargaDatos(true);
    setMessage('');

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
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={controlSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={datosFormulario.email}
            onChange={cambiosFormulario}
            required
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
            required
          />
        </div>
        <button type="submit" disabled={cargaDatos}>
          {cargaDatos ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;