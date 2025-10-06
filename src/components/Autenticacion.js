import React, { useState } from 'react';
import Login from './Login';
import Registro from './Registro'; 

const Autenticacion = () => {
  const [vistaLogin, setVistaLogin] = useState(true);

  return (
    <div>
      {vistaLogin ? (
        <Login />
      ) : (
        <Registro />
      )}
      <p style={{ marginTop: '20px' }}>
        {vistaLogin ? (
          <>
            ¿No tienes una cuenta?{' '}
            <button onClick={() => setVistaLogin(false)}>Regístrate</button>
          </>
        ) : (
          <>
            ¿Ya tienes una cuenta?{' '}
            <button onClick={() => setVistaLogin(true)}>Inicia Sesión</button>
          </>
        )}
      </p>
    </div>
  );
};

export default Autenticacion;