import 'bootstrap/dist/css/bootstrap.min.css';

// 2. Importar React y hooks
import React, { useState, useEffect } from 'react';

// 3. Importar cliente de Supabase
import { supabase } from './components/supabaseClient';

// 4. Importar todos los componentes de la aplicación (todos al mismo nivel)
import Reservas from './components/Reservas';
import PanelAdministrador from './components/PanelAdministrador';
import ReservasPublicas from './components/ReservasPublicas';
import Autenticacion from './components/Autenticacion';
import PerfilUsuario from './components/PerfilUsuario';
import PanelProfesor from './components/PanelProfesor';

// Estilo para la Hero Image y el efecto Parallax
const heroContainerStyle = {
  // 💡 CORRECCIÓN: Usando una imagen genérica real para ver el efecto.
  // ¡REEMPLAZA ESTA URL con la imagen de tu club!
  //backgroundImage: "url('https://picsum.photos/1920/1080?random=1&blur=2')", 
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundAttachment: 'fixed', // Efecto parallax
  minHeight: '100vh', // Asegura que cubra al menos toda la pantalla
  color: '#333', // Color de texto por defecto
};

// Estilo para el encabezado y el contenido principal para mejorar la legibilidad
const contentBackgroundStyle = {
  // Fondo semitransparente para que la imagen se vea, pero el texto sea legible
  // Ajuste de 0.9 a 0.85 para más transparencia:
  backgroundColor: 'rgba(255, 255, 255, 0.85)',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
};

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('reservas');

  const userId = session?.user.id || null;
  const userRole = userProfile?.role || 'user';
  const userName = userProfile?.name;

  useEffect(() => {
    const fetchUserAndProfile = async (currentSession) => {
      setSession(currentSession);

      let profile = null;

      if (currentSession) {
        // En el código real, buscaría el perfil en Supabase
        const { data: profileData } = await supabase
          .from('Profiles')
          .select('role,name')
          .eq('id', currentSession.user.id)
          .single();

        profile = profileData || { role: 'user' };
      }

      setUserProfile(profile);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserAndProfile(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        fetchUserAndProfile(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error al cerrar sesión:', error.message);
    setCurrentView('reservas');
  };

  if (loading) {
    return <div className="text-center my-5">Cargando...</div>;
  }

  const renderNavigationButtons = () => {
    if (!session || userRole === 'admin') return null; // Admin tiene botones específicos en su vista

    const navItems = [];

    if (userRole === 'profesor') {
      navItems.push({ key: 'reservas', label: 'Reservar / Crear Clase' });
      navItems.push({ key: 'panelProfesor', label: 'Mis Clases' });
    } else if (userRole === 'user') {
      navItems.push({ key: 'reservas', label: 'Reservas' });
    }

    navItems.push({ key: 'perfil', label: 'Mi Perfil' });

    return (
      <div className="text-center" style={{ marginBottom: '20px' }}>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setCurrentView(item.key)}
            style={{ marginRight: '10px', padding: '8px', border: currentView === item.key ? '2px solid #007bff' : '1px solid #ccc', backgroundColor: currentView === item.key ? '#e9f3ff' : 'white', borderRadius: '5px', cursor: 'pointer' }}
          >
            {item.label}
          </button>
        ))}
        <button onClick={handleLogout} style={{ padding: '8px', border: '1px solid red', backgroundColor: '#dc3545', color: 'white', borderRadius: '5px', cursor: 'pointer' }}>Cerrar Sesión</button>
      </div>
    );
  }

  const renderContent = () => {
    // Si no hay sesión (usuario no logueado)
    if (!session) {
      return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Autenticacion />
          <hr style={{ margin: '40px 0' }} />
          <ReservasPublicas />
        </div>
      );
    }

    // Vista para Administradores (Simple, sin navegación compleja)
    if (userRole === 'admin') {
      return (
        <div className="text-center" style={{ padding: '20px' }}>
          <PanelAdministrador />
          <button onClick={handleLogout} style={{ padding: '10px 20px', border: 'none', backgroundColor: '#dc3545', color: 'white', borderRadius: '5px', marginTop: '15px', cursor: 'pointer' }}>Cerrar Sesión</button>
        </div>
      );
    }

    // Vistas de Usuario Normal y Profesor (con navegación)
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {renderNavigationButtons()}
        <hr />
        {currentView === 'reservas' && <Reservas userId={userId} roleUsuario={userRole} />}
        {currentView === 'perfil' && <PerfilUsuario />}
        {currentView === 'panelProfesor' && userRole === 'profesor' && <PanelProfesor userId={userId} />}

        {currentView !== 'reservas' && currentView !== 'perfil' && currentView !== 'panelProfesor' && (
          <div style={{ color: 'blue', padding: '15px', border: '1px solid blue', borderRadius: '5px', textAlign: 'center' }}>Selecciona una opción de navegación.</div>
        )}
      </div>
    );
  };

  return (
    <div className="App text-center" style={heroContainerStyle}>
      <header style={{ ...contentBackgroundStyle, borderBottom: '1px solid #ccc', margin: '0 auto', marginBottom: '20px' }}>
        <h1 style={{ color: '#007bff' }}> Club de Pádel </h1>
        {session && <p>Bienvenido, {userProfile?.name} ({userProfile?.role.toUpperCase()})</p>}
      </header>
      <main style={{ ...contentBackgroundStyle, maxWidth: '1200px', margin: '0 auto' }}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
