import 'bootstrap/dist/css/bootstrap.min.css';

// React y hooks
import React, { useState, useEffect } from 'react';

// Cliente Supabase (capa de datos / autenticación)
import { supabase } from './components/supabaseClient';

// Componentes (vistas)
import Reservas from './components/Reservas';
import PanelAdministrador from './components/PanelAdministrador';
import ReservasPublicas from './components/ReservasPublicas';
import Autenticacion from './components/Autenticacion';
import PerfilUsuario from './components/PerfilUsuario';
import PanelProfesor from './components/PanelProfesor';

// Estilo general de la aplicación (hero + parallax)
const heroContenedor = {
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundAttachment: 'fixed',
  minHeight: '100vh',
  color: '#333',
};

// Estilo del contenido principal para mejorar legibilidad
const contenedorFondo = {
  backgroundColor: 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
};

function App() {
  // Estados principales de la aplicación
  const [datosSesion, setDatosSesion] = useState(null);       // Sesión de Supabase
  const [perfilUsuario, setPerfilUsuario] = useState(null);  // Perfil del usuario
  const [loading, setLoading] = useState(true);              // Control de carga inicial
  const [vistaActual, setVistaActual] = useState('reservas');// Vista actual

  // Variables derivadas
  const usuarioId = datosSesion?.user.id || null;
  const usuarioRole = perfilUsuario?.role || 'usuario';

  // Obtención inicial de sesión y cambios de autenticación
  useEffect(() => {
    // Función centralizada para sincronizar sesión y perfil
    const consultaPerfilUsuario = async (sesionActual) => {
      setDatosSesion(sesionActual);

      let perfil = null;

      // Si hay sesión, se obtiene el perfil del usuario desde la BD
      if (sesionActual) {
        const { data: datoPerfil } = await supabase
          .from('Profiles')
          .select('role,name')
          .eq('id', sesionActual.user.id)
          .single();

        // Rol por defecto como medida de seguridad
        perfil = datoPerfil || { role: 'usuario' };
      }

      setPerfilUsuario(perfil);
      setLoading(false);
    };

    // Comprobación de sesión al cargar la aplicación
    supabase.auth.getSession().then(({ data: { sesion } }) => {
      consultaPerfilUsuario(sesion);
    });

    // Listener de cambios de autenticación (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sesion) => {
        consultaPerfilUsuario(sesion);
      }
    );

    // Limpieza del listener al desmontar el componente
    return () => subscription.unsubscribe();
  }, []);

  // Cierre de sesión
  const Logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error al cerrar sesión:', error.message);
    setVistaActual('reservas');
  };

  // Pantalla de carga mientras se obtiene sesión y perfil
  if (loading) {
    return <div className="text-center my-5">Cargando...</div>;
  }

  // Navegación dinámica según rol
  const renderBotonesNavegacion = () => {
    // El administrador tiene su propio panel
    if (!datosSesion || usuarioRole === 'administrador') return null;

    const opcionesNav = [];

    if (usuarioRole === 'profesor') {
      opcionesNav.push({ key: 'reservas', label: 'Reservar / Crear Clase' });
      opcionesNav.push({ key: 'panelProfesor', label: 'Mis Clases' });
    } else if (usuarioRole === 'usuario') {
      opcionesNav.push({ key: 'reservas', label: 'Reservas' });
    }

    opcionesNav.push({ key: 'perfil', label: 'Mi Perfil' });

    return (
      <div className="text-center" style={{ marginBottom: '20px' }}>
        {opcionesNav.map(item => (
          <button
            key={item.key}
            onClick={() => setVistaActual(item.key)}
            style={{
              marginRight: '10px',
              padding: '8px',
              border: vistaActual === item.key ? '2px solid #007bff' : '1px solid #ccc',
              backgroundColor: vistaActual === item.key ? '#e9f3ff' : 'white',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {item.label}
          </button>
        ))}
        <button
          onClick={Logout}
          style={{
            padding: '8px',
            border: '1px solid red',
            backgroundColor: '#dc3545',
            color: 'white',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    );
  };

  // Renderizado del contenido principal según sesión y rol
  const renderContenido = () => {
    // Usuario no autenticado
    if (!datosSesion) {
      return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Autenticacion />
          <hr style={{ margin: '40px 0' }} />
          <ReservasPublicas />
        </div>
      );
    }

    // Administrador
    if (usuarioRole === 'administrador') {
      return (
        <div className="text-center" style={{ padding: '20px' }}>
          <PanelAdministrador />
          <button
            onClick={Logout}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '5px',
              marginTop: '15px',
              cursor: 'pointer'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      );
    }

    // Usuario normal y profesor
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {renderBotonesNavegacion()}
        <hr />
        {vistaActual === 'reservas' && <Reservas usuarioId={usuarioId} usuarioRole={usuarioRole} />}
        {vistaActual === 'perfil' && <PerfilUsuario />}
        {vistaActual === 'panelProfesor' && usuarioRole === 'profesor' && (
          <PanelProfesor usuarioId={usuarioId} />
        )}
        {vistaActual !== 'reservas' && vistaActual !== 'perfil' && vistaActual !== 'panelProfesor' && (
          <div
            style={{
              color: 'blue',
              padding: '15px',
              border: '1px solid blue',
              borderRadius: '5px',
              textAlign: 'center'
            }}
          >
            Selecciona una opción de navegación.
          </div>
        )}
      </div>
    );
  };

  // Estructura general de la aplicación
  return (
    <div className="App text-center" style={heroContenedor}>
      <header
        style={{
          ...contenedorFondo,
          borderBottom: '1px solid #ccc',
          margin: '0 auto',
          marginBottom: '20px'
        }}
      >
        <h1 style={{ color: '#007bff' }}>Club de Pádel</h1>
        {datosSesion && (
          <p>
            Bienvenido, {perfilUsuario?.name} ({perfilUsuario?.role.toUpperCase()})
          </p>
        )}
      </header>
      <main style={{ ...contenedorFondo, maxWidth: '1200px', margin: '0 auto' }}>
        {renderContenido()}
      </main>
    </div>
  );
}

export default App;

