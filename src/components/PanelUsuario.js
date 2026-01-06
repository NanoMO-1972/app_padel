import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Container, Form, Button, Alert } from 'react-bootstrap';

const PanelUsuario = () => {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState({ name: '' });
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const consultaPerfil = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Carga el nombre del perfil
        const { data: perfilDatos, error: perfilError } = await supabase
          .from('Profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        if (perfilDatos) {
          setPerfil(perfilDatos);
        } else {
          console.error('Error al cargar el perfil:', perfilError);
          setError('No se pudo cargar el perfil.');
        }

        // Carga el correo electrónico
        setEmail(user.email);
      }
      setLoading(false);
    };

    consultaPerfil();
  }, []);

  const gestionActualizarNombre = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('Profiles')
      .update({ name: perfil.name })
      .eq('id', user.id);

    if (error) {
      console.error('Error al actualizar el nombre:', error);
      setError('Error al actualizar el nombre.');
    } else {
      setSuccess('Nombre actualizado con éxito!');
    }
    setLoading(false);
  };

  const gestionActualizarEmail = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ email });
    
    if (error) {
      console.error('Error al actualizar el correo:', error);
      setError('Error al actualizar el correo electrónico.');
    } else {
      setSuccess('Correo electrónico actualizado con éxito.');
    }
    setLoading(false);
  };

  const gestionActualizarPassword = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error('Error al actualizar la contraseña:', error);
      setError('Error al actualizar la contraseña.');
    } else {
      setNewPassword('');
      setSuccess('Contraseña actualizada con éxito!');
    }
    setLoading(false);
  };

  if (loading) {
    return <p>Cargando perfil...</p>;
  }

  return (
    <Container className="my-5">
      <h2 className="mb-4">Mi Perfil</h2>
      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Formulario para cambiar el nombre */}
      <Form onSubmit={gestionActualizarNombre} className="mb-4">
        <Form.Group className="mb-3">
          <Form.Label>Nombre</Form.Label>
          <Form.Control
            type="text"
            value={perfil.name || ''}
            onChange={(e) => setPerfil({ ...perfil, name: e.target.value })}
            placeholder="Tu nombre"
          />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Nombre'}
        </Button>
      </Form>

      <hr />

      {/* Formulario para cambiar el email */}
      <Form onSubmit={gestionActualizarEmail} className="mb-4">
        <h3>Actualizar Correo Electrónico</h3>
        <Form.Group className="mb-3">
          <Form.Label>Correo Electrónico</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nuevo correo electrónico"
          />
        </Form.Group>
        <Button variant="info" type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Actualizar Correo'}
        </Button>
      </Form>

      <hr />

      {/* Formulario para cambiar la contraseña */}
      <Form onSubmit={gestionActualizarPassword}>
        <h3>Cambiar Contraseña</h3>
        <Form.Group className="mb-3">
          <Form.Label>Nueva Contraseña</Form.Label>
          <Form.Control
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña"
          />
        </Form.Group>
        <Button variant="warning" type="submit" disabled={loading}>
          {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
        </Button>
      </Form>
    </Container>
  );
};

export default PanelUsuario;