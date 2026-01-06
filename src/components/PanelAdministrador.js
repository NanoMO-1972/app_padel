import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  Container,
  Table,
  Button,
  Form,
  Alert,
  Modal,
  Tab,
  Tabs,
} from 'react-bootstrap';

const PanelAdministrador = () => {
  // =====================
  // Estados generales
  // =====================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vistaActualAdministrador, setVistaActualAdministrador] = useState('usuarios');

  // =====================
  // Gestión de usuarios
  // =====================
  const [usuarios, setUsuarios] = useState([]);
  const [modalRole, setModalRole] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [nuevoRole, setNuevoRole] = useState('');
  const rolesUsuario = ['usuario', 'profesor', 'administrador'];

  // =====================
  // Gestión de pistas
  // =====================
  const [pistas, setPistas] = useState([]);
  const [modalPistas, setModalPistas] = useState(false);
  const [pistaSeleccionada, setPistaSeleccionada] = useState(null);
  const [formularioPista, setFormularioPista] = useState({ nombre: '' });
  const [editarPista, setEditarPista] = useState(false);

  // =====================
  // Gestión de reservas
  // =====================
  const [reservas, setReservas] = useState([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [modalCancelacionReservas, setModalCancelacionReservas] = useState(false);

  // =====================
  // Consultas
  // =====================
  const consultaUsuarios = async () => {
    const { data, error } = await supabase
      .from('Profiles')
      .select('id, email, name, role')
      .order('name');

    if (error) setError('Error al cargar usuarios');
    else setUsuarios(data);
  };

  const consultaPistas = async () => {
    const { data, error } = await supabase
      .from('Pistas')
      .select('id, nombre, esta_activa')
      .order('nombre');

    if (error) setError('Error al cargar pistas');
    else setPistas(data);
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
      setError('Error al cargar reservas');
    } else {
      setReservas(
        data.map(r => ({
          ...r,
          nombreUsuario: r.user_id?.name || 'N/A',
          nombrePista: r.pista_id?.nombre || 'N/A',
        }))
      );
    }
  };

  // =====================
  // Carga dinámica
  // =====================
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError(null);

      if (vistaActualAdministrador === 'usuarios') await consultaUsuarios();
      if (vistaActualAdministrador === 'pistas') await consultaPistas();
      if (vistaActualAdministrador === 'reservas') await consultaReservas();

      setLoading(false);
    };

    cargarDatos();
  }, [vistaActualAdministrador]);

  // =====================
  // Gestión de usuarios
  // =====================
  const mostrarModalRole = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setNuevoRole(usuario.role);
    setModalRole(true);
  };

  const cambioRole = async () => {
    if (!rolesUsuario.includes(nuevoRole)) return;

    await supabase
      .from('Profiles')
      .update({ role: nuevoRole })
      .eq('id', usuarioSeleccionado.id);

    setUsuarios(prev =>
      prev.map(u =>
        u.id === usuarioSeleccionado.id ? { ...u, role: nuevoRole } : u
      )
    );
    setModalRole(false);
  };

  // =====================
  // Gestión de pistas
  // =====================
  const cerrarModalPista = () => {
    setModalPistas(false);
    setPistaSeleccionada(null);
    setFormularioPista({ nombre: '' });
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
    setFormularioPista({ nombre: pista.nombre });
    setModalPistas(true);
  };

  const guardarPista = async () => {
    if (!formularioPista.nombre) return;

    if (editarPista && pistaSeleccionada) {
      await supabase
        .from('Pistas')
        .update({ nombre: formularioPista.nombre })
        .eq('id', pistaSeleccionada.id);
    } else {
      await supabase
        .from('Pistas')
        .insert([{ nombre: formularioPista.nombre, esta_activa: true }]);
    }

    consultaPistas();
    cerrarModalPista();
  };

  const eliminarPista = async (id) => {
    if (!window.confirm('¿Eliminar esta pista?')) return;

    await supabase.from('Pistas').delete().eq('id', id);
    setPistas(prev => prev.filter(p => p.id !== id));
  };

  const cambiarEstadoPista = async (pista) => {
    const nuevoEstado = !pista.esta_activa;

    await supabase
      .from('Pistas')
      .update({ esta_activa: nuevoEstado })
      .eq('id', pista.id);

    setPistas(prev =>
      prev.map(p =>
        p.id === pista.id ? { ...p, esta_activa: nuevoEstado } : p
      )
    );
  };

  // =====================
  // Gestión de reservas
  // =====================
  const cancelarReserva = async () => {
    await supabase
      .from('Reservas')
      .delete()
      .eq('id', reservaSeleccionada.id);

    setReservas(prev => prev.filter(r => r.id !== reservaSeleccionada.id));
    setModalCancelacionReservas(false);
  };

  // =====================
  // Renderizados
  // =====================
  const renderUsuarios = () => (
    <>
      <h3 className="mb-4">Gestión de Usuarios</h3>
      <Table bordered hover responsive className="text-center">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td>{u.name || 'Sin nombre'}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <Button size="sm" onClick={() => mostrarModalRole(u)}>
                  Cambiar rol
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );

  const renderPistas = () => (
    <>
      <h3 className="mb-4">Gestión de Pistas</h3>

      <Button className="mb-3" onClick={modalCrearPistaNueva}>
        Añadir Nueva Pista
      </Button>

      <Table bordered hover responsive className="text-center">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pistas.map(p => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>
                <Button
                  size="sm"
                  variant={p.esta_activa ? 'success' : 'danger'}
                  onClick={() => cambiarEstadoPista(p)}
                >
                  {p.esta_activa ? 'Activa' : 'Inactiva'}
                </Button>
              </td>
              <td>
                <Button size="sm" variant="warning" onClick={() => modalEditarPista(p)}>
                  Editar
                </Button>{' '}
                <Button size="sm" variant="danger" onClick={() => eliminarPista(p.id)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );

  const renderReservas = () => (
    <>
      <h3 className="mb-4">Gestión de Reservas</h3>
      <Table bordered hover responsive className="text-center">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Pista</th>
            <th>Fecha</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map(r => (
            <tr key={r.id}>
              <td>{r.nombreUsuario}</td>
              <td>{r.nombrePista}</td>
              <td>{r.fecha}</td>
              <td>{r.hora_inicio}</td>
              <td>{r.hora_fin}</td>
              <td>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setReservaSeleccionada(r);
                    setModalCancelacionReservas(true);
                  }}
                >
                  Cancelar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );

  // =====================
  // Render principal
  // =====================
  return (
    <Container className="my-5">
      <h2 className="mb-4">Panel de Administración</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Tabs
        activeKey={vistaActualAdministrador}
        onSelect={setVistaActualAdministrador}
        className="mb-4"
      >
        <Tab eventKey="usuarios" title="Usuarios" />
        <Tab eventKey="pistas" title="Pistas" />
        <Tab eventKey="reservas" title="Reservas" />
      </Tabs>

      {loading && <p>Cargando...</p>}
      {!loading && vistaActualAdministrador === 'usuarios' && renderUsuarios()}
      {!loading && vistaActualAdministrador === 'pistas' && renderPistas()}
      {!loading && vistaActualAdministrador === 'reservas' && renderReservas()}

      {/* Modal cambiar rol */}
      <Modal show={modalRole} onHide={() => setModalRole(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Cambiar Rol para {usuarioSeleccionado?.name || 'Usuario'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Select
            value={nuevoRole}
            onChange={(e) => setNuevoRole(e.target.value)}
          >
            {rolesUsuario.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalRole(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={cambioRole}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal crear / editar pista */}
      <Modal show={modalPistas} onHide={cerrarModalPista} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editarPista ? 'Editar Pista' : 'Añadir Nueva Pista'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la pista</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formularioPista.nombre}
                onChange={(e) =>
                  setFormularioPista({ ...formularioPista, nombre: e.target.value })
                }
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModalPista}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={guardarPista}>
            {editarPista ? 'Guardar Cambios' : 'Añadir Pista'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal cancelar reserva */}
      <Modal
        show={modalCancelacionReservas}
        onHide={() => setModalCancelacionReservas(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar cancelación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Cancelar la reserva de {reservaSeleccionada?.nombreUsuario}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalCancelacionReservas(false)}>
            No
          </Button>
          <Button variant="danger" onClick={cancelarReserva}>
            Sí, cancelar
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default PanelAdministrador;
