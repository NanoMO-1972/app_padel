import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  Container, Table, Button, Form, Alert, Modal, Tab, Tabs,
  DropdownButton, Dropdown
} from 'react-bootstrap';

const PanelAdministrador = () => {

// --- Estados Generales ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados para Gestión de Usuarios ---
  const [usuarios, setUsuarios] = useState([]);
  const [ModalRole, setModalRole] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [nuevoRole, setNuevoRole] = useState('');
  const roleUsuario = ['usuario', 'profesor', 'administrador'];

  // --- Estados para Gestión de Pistas ---
  const [pistas, setPistas] = useState([]);
  const [ModalPistas, setModalPistas] = useState(false);
  const [pistaSeleccionada, setPistaSeleccionada] = useState(null);
  const [formularioPista, setFormularioPista] = useState({ nombre: '' }); // <-- Usamos 'nombre'
  const [editarPista, setEditarPista] = useState(false);

  // --- Estados para Gestión de Reservas ---
  const [reservas, setReservas] = useState([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [ModalCancelacionReservas, setModalCancelacionReservas] = useState(false);

  // --- Estado para la Vista Actual del Admin ---
  const [vistaActualAdministrador, setVistaActualAdministrador] = useState('usuarios');

// --- Funciones de Modal de Usuario ---
  const cerrarModalRole = () => {
    setModalRole(false);
    setUsuarioSeleccionado(null);
    setNuevoRole('');
  };
  const mostrarModalRole = (user) => {
    setUsuarioSeleccionado(user);
    setNuevoRole(user.role || 'user');
    setModalRole(true);
  };

  // --- Funciones de Modal y Form de Pista ---
  const cerrarModalPista = () => {
    setModalPistas(false);
    setPistaSeleccionada(null);
    setFormularioPista({ id: null, nombre: '' });
    setEditarPista(false);
  };
  const modalCrearPistaNueva = () => {
    setEditarPista(false);
    setFormularioPista({ nombre: '' });
    setModalPistas(true);
  };
  const modalEditarPista = (pista) => {
    setEditarPista(true);
    setPistaSeleccionada(pista);
    setFormularioPista({ id: pista.id, 
                         nombre: pista.nombre }); // <-- Usamos 'nombre'
    setModalPistas(true);
  };
  const cambiosFormularioPistas = (e) => {
    setFormularioPista({ ...formularioPista, [e.target.name]: e.target.value });
  };

  // --- Funciones de Modal de Reserva ---
  const cerrarModalCancelacionReservas = () => {
    setModalCancelacionReservas(false);
    setReservaSeleccionada(null);
  };
  const modalCancelacionReservas = (reserva) => {
    setReservaSeleccionada(reserva);
    setModalCancelacionReservas(true);
  };

  // --- Funciones de Consulta de Datos ---
  const consultaUsuarios = async () => {
    const { data, error } = await supabase
      .from('Profiles')
      .select('id, name, role')
      .order('name');
    if (error) {
      console.error('Error cargando usuarios:', error);
      setError('Error al cargar la lista de usuarios.');
    } else {
      setUsuarios(data);
    }
  };

  const consultaPistas = async () => {
    const { data, error } = await supabase
      .from('Pistas')
      .select('id, nombre, esta_activa') // <-- Solo 'nombre' y 'esta_activa'
      .order('nombre'); // <-- Usamos 'nombre'
    if (error) {
      console.error('Error en la consulta de pistas:', error);
      setError('Error al cargar la lista de pistas.');
    } else {
      setPistas(data);
    }
  };

  const consultaReservas = async () => {
    const { data, error } = await supabase
      .from('Reservas')
      .select(`
        id,
        fecha,
        hora_inicio,
        hora_fin,
        user_id:Profiles(name), 
        pista_id:Pistas(nombre)
      `)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) {
      console.error('Error al cargar la reservas:', error);
      setError('Error al cargar las reservas.');
      
    } else {
      const reservasExtendida = data.map(reserva => ({
    // Nota: cambié 'reservas' por 'reserva' aquí para evitar confusión con el array
    ...reserva,
    // Accede a la clave foránea 'user_id' para obtener el campo 'name'
    nombreUsuario: reserva.user_id?.name || 'N/A', 
    
    // Accede a la clave foránea 'pista_id' para obtener el campo 'nombre'
    nombrePista: reserva.pista_id?.nombre || 'N/A', 
}));
    setReservas(reservasExtendida);
      
    }
  };
  
  // --- Efecto Principal para cargar datos ---
  useEffect(() => {
    const cargaDatos = async () => {
      setLoading(true);
      setError(null);
      try {
        if (vistaActualAdministrador === 'usuarios') await consultaUsuarios();
        if (vistaActualAdministrador === 'pistas') await consultaPistas();
        if (vistaActualAdministrador === 'reservas') await consultaReservas();
      } catch (error) {
        console.error("Ocurrió un error al cargar los datos del panel.", error);
        setError("Ocurrió un error al cargar los datos del panel.");
      } finally {
        setLoading(false);
      }
    };
    cargaDatos();
  }, [vistaActualAdministrador]);   
  
  // --- Funciones de Actualización/Creación/Eliminación ---
  
    // Gestión de Usuarios
    const cambioRole = async () => {
      if (!usuarioSeleccionado || !nuevoRole) return;
      setLoading(true);
      const { error } = await supabase
        .from('Profiles')
        .update({ role: nuevoRole })
        .eq('id', usuarioSeleccionado.id);
      if (error) {
        console.error('Error al actualizar el rol del usuario.:', error);
        setError('Error al actualizar el rol del usuario.');
      } else {
        setUsuarios(usuarios.map(usuario =>
          usuario.id === usuarioSeleccionado.id ? { ...usuario, role: nuevoRole } : usuario
        ));
        setError(null);
        cerrarModalRole();
      }
      setLoading(false);
    };

    // Gestión de Pistas
      const guardarPista = async () => {
        if (!formularioPista.nombre) {
          setError("El nombre de la pista es obligatorio.");
          return;
        }
        setLoading(true);
        setError(null);
    
        let errorConsulta = null;
        if (editarPista && pistaSeleccionada) {
          console.log('Intento de UPDATE. ID de Pista:', pistaSeleccionada.id); // <-- ¡Verifica este valor!
          console.log('Nuevo Nombre:', formularioPista.nombre);
          const { error } = await supabase
            .from('Pistas')
            .update({ nombre: formularioPista.nombre, esta_activa: true })
            .eq('id', pistaSeleccionada.id);
          errorConsulta = error;
        } else {
          const { error } = await supabase
            .from('Pistas')
            .insert([{ nombre: formularioPista.nombre, esta_activa: true }]);
          errorConsulta = error;
        }
        if (errorConsulta) {
          console.error('Error guardando la pista:', errorConsulta);
          setError(editarPista ? 'Error al actualizar la pista.' : 'Error al crear la pista.');
        } else {
          consultaPistas();
          cerrarModalPista();
        }
        setLoading(false);
      };
    
      const cambiaEstadoPista = async (pistaSeleccionada) => {
        setLoading(true);
        setError(null);
        const nuevoEstado = !pistaSeleccionada.esta_activa;
        const { error } = await supabase
          .from('Pistas')
          .update({ esta_activa: nuevoEstado })
          .eq('id', pistaSeleccionada.id);
        if (error) {
          console.error('Error cambiando el estado de la pista:', error);
          setError('Error al cambiar el estado de la pista.');
        } else {
          setPistas(pistas.map(pista =>
            pista.id === pistaSeleccionada.id ? { ...pista, esta_activa: nuevoEstado } : pista
          ));
        }
        setLoading(false);
      };
    
      const modalBorrarPista = async (borrarPistaId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta pista? Esta acción no se puede deshacer.')) {
          return;
        }
        setLoading(true);
        setError(null);
        const { error } = await supabase
          .from('Pistas')
          .delete()
          .eq('id', borrarPistaId);
        if (error) { 
          console.error('Error eliminando la pista:', error);
          setError('Error al eliminar la pista.');
        } else {
          setPistas(pistas.filter(pista => pista.id !== borrarPistaId));
        }
        setLoading(false);
      };
  
    // Gestión de Reservas
      const cancelarReservas = async () => {
        if (!reservaSeleccionada) return;
        setLoading(true);
        const { error } = await supabase
          .from('Reservas')
          .delete()
          .eq('id', reservaSeleccionada.id);
        if (error) {
          console.error('Error al cancelar la reserva:', error);
          setError('Error al cancelar la reserva.');
        } else {
          setReservas(reservas.filter(reserva => reserva.id !== reservaSeleccionada.id));
          setError(null);
          cerrarModalCancelacionReservas();
        }
        setLoading(false);
      };  

      // --- Renderizado del Componente ---

  const contenidoRenderizado = () => {
    // ...
    // Secciones de renderizado:
    // User
    if (vistaActualAdministrador === 'usuarios') {
      return (
        <>
          <h3 className="mb-4">Gestion de Usuarios</h3>
          <Table bordered hover responsive className="text-center mt-4">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol Actual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.name || 'Sin nombre'}</td>
                  <td>{usuario.email || 'Sin email'}</td>
                  <td>{usuario.role || 'user'}</td>
                  <td>
                    <Button variant="info" size="sm" onClick={() => mostrarModalRole (usuario)}>
                      Cambiar Rol
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      );
    }  
    // Pistas     
    if (vistaActualAdministrador === 'pistas') {
      return (
        <>
          <h3 className="mb-4">Gestion de Pistas</h3>
          <Button variant="primary" onClick={modalCrearPistaNueva} className="mb-4">
            Añadir Nueva Pista
          </Button>
          <Table bordered hover responsive className="text-center mt-4">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pistas.map((pista) => (
                <tr key={pista.id}>
                  <td>{pista.nombre}</td>
                  <td>
                    <Button
                      variant={pista.esta_activa ? "success" : "danger"}
                      size="sm"
                      onClick={() => cambiaEstadoPista(pista)}
                    >
                      {pista.esta_activa ? "Activa" : "Inactiva"}
                    </Button>
                  </td>
                  <td>
                    <Button variant="warning" size="sm" onClick={() => modalEditarPista(pista)} className="me-2">
                      Editar
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => modalBorrarPista(pista.id)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      );
    };
  
    // Reservas
    if (vistaActualAdministrador === 'reservas') {
      return (
        <>
          <h3 className="mb-4">Gestion de Reservas</h3>
          <Table bordered hover responsive className="text-center mt-4">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Pista</th>
                <th>Fecha</th>
                <th>Hora Inicio</th>
                <th>Hora Fin</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((reserva) => (
                <tr key={reserva.id}>
                  <td>{reserva.nombreUsuario}</td>
                  <td>{reserva.nombrePista}</td>
                  <td>{reserva.fecha}</td>
                  <td>{reserva.hora_inicio}</td>
                  <td>{reserva.hora_fin}</td>
                  <td>
                    <Button variant="danger" size="sm" onClick={() => modalCancelacionReservas(reserva)}>
                      Cancelar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      );
    }
  };

  // --- Renderizado del Componente ---
  return (
    <Container className="my-5">
      <h2 className="mb-4">Panel de Administración</h2>
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      <Tabs activeKey={vistaActualAdministrador} onSelect={(k) => setVistaActualAdministrador(k)} className="mb-4">
        <Tab eventKey="usuarios" title="Usuarios" />
        <Tab eventKey="pistas" title="Pistas" />
        <Tab eventKey="reservas" title="Reservas" />
      </Tabs>
      <main>
        {loading ? (
          <p>Cargando {vistaActualAdministrador === 'usuarios' ? 'usuarios' : vistaActualAdministrador === 'pistas' ? 'pistas' : 'reservas'}...</p>
        ) : (
          contenidoRenderizado()
        )}
      </main>

{/* Modal para cambiar rol de usuario (ya definido arriba) */}
      <Modal show={ModalRole} onHide={cerrarModalRole} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cambiar Rol para {usuarioSeleccionado?.nombre || 'Usuario'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nuevo Rol</Form.Label>
              <Form.Control as="select" value={nuevoRole} onChange={(e) => setNuevoRole(e.target.value)}>
                {roleUsuario.map(role => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModalRole}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={cambioRole} disabled={loading}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Añadir/Editar Pista */}
      <Modal show={ModalPistas} onHide={cerrarModalPista} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editarPista ? 'Editar Pista' : 'Añadir Nueva Pista'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la Pista</Form.Label>
              <Form.Control
                type="text"
                name="nombre" // <-- Usamos 'nombre'
                value={formularioPista.nombre}
                onChange={cambiosFormularioPistas}
                required
              />
            </Form.Group>
            {/* Campo para la descripción si la añades más tarde */}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModalPista}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={guardarPista} disabled={loading}>
            {editarPista ? 'Guardar Cambios' : 'Añadir Pista'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Confirmar Cancelación de Reserva */}
      <Modal show={ModalCancelacionReservas} onHide={cerrarModalCancelacionReservas} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Cancelación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que quieres cancelar esta reserva para el {reservaSeleccionada?.nombreUsuario} el {reservaSeleccionada?.fecha} en la pista {reservaSeleccionada?.nombrePista}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModalCancelacionReservas}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={cancelarReservas} disabled={loading}>
            Confirmar Cancelación
          </Button>
        </Modal.Footer>
      </Modal>
      
    </Container>
  );
  
  };   
  
  
    

  
export default PanelAdministrador;