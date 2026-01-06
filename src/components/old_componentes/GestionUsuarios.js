import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Container, Table, Alert, Form } from 'react-bootstrap';

// Roles permitidos en el sistema (regla de negocio centralizada)
const ROLES_VALIDOS = ['usuario', 'profesor', 'administrador'];

const GestionUsuarios = () => {
  // Estados del componente
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carga inicial de usuarios al montar el componente
  useEffect(() => {
    obtenerUsuarios();
  }, []);

  // Obtiene la lista de usuarios desde la tabla Profiles
  const obtenerUsuarios = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('Profiles')
      .select('id, name, role')
      .order('name', { ascending: true });

    if (error) {
      console.error(error);
      setError('Error al cargar usuarios. Revisa las políticas de acceso.');
    } else {
      setUsuarios(data);
    }

    setLoading(false);
  };

  // Cambia el rol de un usuario (UPDATE)
  const cambiarRol = async (userId, nuevoRol) => {
    // Validación defensiva en frontend
    if (!ROLES_VALIDOS.includes(nuevoRol)) return;

    const confirmar = window.confirm(
      `¿Seguro que quieres asignar el rol "${nuevoRol}" a este usuario?`
    );
    if (!confirmar) return;

    const { error } = await supabase
      .from('Profiles')
      .update({ role: nuevoRol })
      .eq('id', userId);

    if (error) {
      console.error(error);
      alert('No se pudo actualizar el rol. Verifica tus permisos.');
      return;
    }

    // Actualización del estado local sin recargar datos
    setUsuarios(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, role: nuevoRol } : user
      )
    );
  };

  // Renderizado condicional según estado
  if (loading) {
    return (
      <Container className="my-5">
        <p>Cargando usuarios...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h3 className="mb-4">Gestión de Usuarios</h3>

      <div className="table-responsive">
        <Table striped bordered hover className="text-start">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Rol actual</th>
              <th>Cambiar rol</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(user => (
              <tr key={user.id}>
                <td>{user.id.substring(0, 8)}...</td>
                <td>{user.name || 'N/A'}</td>
                <td>
                  {user.role === 'administrador' && (
                    <span className="text-primary fw-bold">Administrador</span>
                  )}
                  {user.role === 'profesor' && (
                    <span className="text-success fw-bold">Profesor</span>
                  )}
                  {user.role === 'usuario' && (
                    <span className="text-secondary">Usuario</span>
                  )}
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={user.role}
                    onChange={(e) => cambiarRol(user.id, e.target.value)}
                    style={{ width: '160px' }}
                  >
                    <option value="usuario">Usuario</option>
                    <option value="profesor">Profesor</option>
                    <option value="administrador">Administrador</option>
                  </Form.Select>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
};

export default GestionUsuarios;
