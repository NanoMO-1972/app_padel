import React, { useState } from 'react';
import Login from './Login';
import Registro from './Registro';

const Autenticacion = () => {
  // Controla qué vista de autenticación se muestra
  const [vistaLogin, setVistaLogin] = useState(true);

  return (
    <div>
      {/* Renderizado condicional del formulario */}
      {vistaLogin ? <Login /> : <Registro />}

      <p style={{ marginTop: '20px' }}>
        {vistaLogin ? (
          <>
            ¿No tienes una cuenta?{' '}
            <button onClick={() => setVistaLogin(false)}>
              Regístrate
            </button>
          </>
        ) : (
          <>
            ¿Ya tienes una cuenta?{' '}
            <button onClick={() => setVistaLogin(true)}>
              Inicia Sesión
            </button>
          </>
        )}
      </p>
    </div>
  );
};

export default Autenticacion;
