import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Container, Table, Alert, Form, Button } from 'react-bootstrap';

const GestionUsuarios = () => {
  const [usuarios, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    consultaUsuarios();
  }, []);

  const consultaUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Profiles')
      .select('id, name, role')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error al cargar los usuarios:', error.message);
      setError('Error al cargar la lista de usuarios. Revisa permisos de SELECT.');
    } else {
      setUsers(data);
    }
    setLoading(false);
  };

  const gestionCambioRole = async (userId, newRole) => {
    if (newRole !== 'administrador' && newRole !== 'user') return;

    if (!window.confirm(`¿Estás seguro de que quieres cambiar el rol de este usuario a '${newRole}'?`)) {
      return;
    }

    const { error } = await supabase
      .from('Profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error al actualizar el rol:', error.message);
      alert(`Error al actualizar el rol: ${error.message}. Recuerda que solo los administradores pueden cambiar roles.`);
    } else {
      // Actualiza el estado local
      setUsers(usuarios.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
      alert('Rol actualizado con éxito.');
    }
  };

  // --- Renderizado Condicional ---
  if (loading) return <Container className="my-5"><p>Cargando usuarios...</p></Container>;
  if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container className="my-5">
      <h3 className="mb-4">Gestión de Usuarios</h3>

      <div className="table-responsive">
        <Table striped bordered hover className="text-start">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Rol Actual</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => (
              <tr key={user.id}>
                <td>{user.id.substring(0, 8)}...</td>
                <td>{user.name || 'N/A'}</td>
                <td>
                  {user.role === 'administrador'
                    ? <span className="text-primary fw-bold">Administrador</span>
                    : user.role === 'user'
                      ? <span className="text-secondary">Usuario</span>
                      : 'Sin rol'
                  }
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={user.role}
                    onChange={(e) => gestionCambioRole(user.id, e.target.value)}
                    style={{ width: '120px' }}
                  >
                    <option value="user">Usuario</option>
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