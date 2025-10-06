import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Container, Table, Button, Alert } from 'react-bootstrap';

const PanelProfesor = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clases, setClases] = useState([]);
  const [pistas, setPistas] = useState([]);
  
  // Eliminados: States para el modal de nueva clase (ya no se usa aquí)
  // Eliminados: horarios y funciones gestionCerrar/gestionMostrar

  useEffect(() => {
    const consultaDatoProfesor = async () => {
      setLoading(true);
      setError(null);

      // CORRECCIÓN: Usando { user } para obtener el usuario
      const { data: { user: usuario } } = await supabase.auth.getUser();
      
      if (!usuario) {
        setLoading(false);
        return;
      }
      
      // 1. Obtener Pistas (para mostrar el nombre)
      const { data: pistasDatos, error: pistaError } = await supabase
        .from('Pistas')
        .select('id, nombre') // Solo necesitamos ID y Nombre
        .order('id', { ascending: true });

      // 2. Obtener Clases (Reservas) del Profesor
      const { data: clasesDatos, error: claseError } = await supabase
        .from('Reservas')
        .select('id, fecha, hora_inicio, pista_id')
        .eq('user_id', usuario.id)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true });
        
      if (pistaError || claseError) {
        console.error('Error consultando los datos del profesor', pistaError || claseError);
        setError('Error al cargar los datos del profesor.');
      } else {
        setPistas(pistasDatos);
        setClases(clasesDatos);
      }
      setLoading(false);
    };
    consultaDatoProfesor();
  }, []);

  // Eliminada: gestionCrearClase

  const gestionBorrarClase = async (claseId) => {
    if (!window.confirm("¿Estás seguro de que quieres cancelar esta clase?")) {
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('Reservas')
      .delete()
      .eq('id', claseId);
  
    if (error) {
      console.error("Error cancelando la clase:", error.message);
      setError('Error al cancelar la clase.');
    }  else {
      setClases(clases.filter(clase => clase.id !== claseId ));
      setError(null); // Corregido: Usar null, no 'null' string
    }
    setLoading(false);
  };
  
  // Función auxiliar para obtener el nombre de la pista
  const obtenerNombrePista = (pistaId) => {
    const pista = pistas.find(p => p.id === pistaId);
    return pista ? pista.nombre : `Pista ${pistaId}`;
  };

  if (loading) return <p>Cargando panel de profesor...</p>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
      <Container className="my-5">
      <h2 className="mb-4">Panel de Profesor</h2>
      <h3>Mis Clases Programadas</h3>
      {clases.length === 0 ? (
        <Alert variant="secondary">No tienes clases programadas.</Alert>
      ) : (
        <Table bordered hover responsive className="text-center">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Pista</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clases.map((clase) => (
              <tr key={clase.id}>
                <td>{clase.fecha}</td>
                <td>{clase.hora_inicio.substring(0, 5)}</td>
                <td>{obtenerNombrePista(clase.pista_id)}</td>
                <td>
                  <Button variant="danger" size="sm" onClick={() => gestionBorrarClase(clase.id)}>
                    Cancelar Clase
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default PanelProfesor;