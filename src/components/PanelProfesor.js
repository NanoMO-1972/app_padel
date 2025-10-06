import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
// Volvemos a importar Container para usar el espaciado lateral estándar de Bootstrap
import { Container, Table, Button, Alert } from 'react-bootstrap';

const PanelProfesor = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clases, setClases] = useState([]);
  const [pistas, setPistas] = useState([]);

  // Estado para la confirmación visual de la cancelación
  const [claseACancelar, setClaseACancelar] = useState(null);


  useEffect(() => {
    const consultaDatoProfesor = async () => {
      setLoading(true);
      setError(null);

      // Utilizamos la propiedad de desestructuración para obtener el usuario
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

  // 1. Prepara la cancelación
  const iniciarBorrado = (clase) => {
    setClaseACancelar(clase);
    setError(null);
  };

  // 2. Ejecuta la cancelación
  const confirmarBorrado = async () => {
    if (!claseACancelar) return;

    setLoading(true);
    const claseId = claseACancelar.id;

    const { error } = await supabase
      .from('Reservas')
      .delete()
      .eq('id', claseId);

    setClaseACancelar(null); // Cierra la confirmación

    if (error) {
      console.error("Error cancelando la clase:", error.message);
      setError('Error al cancelar la clase.');
    } else {
      // Actualiza la lista eliminando la clase
      setClases(clases.filter(clase => clase.id !== claseId));
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
      <h2 className="mb-4 text-center">Panel de Profesor</h2>
      <h3 className="text-center">Mis Clases Programadas</h3>

      {claseACancelar && (
        // Centramos la alerta con un ancho máximo para que se vea mejor
        <div className="d-flex justify-content-center">
          <Alert variant="warning" className="text-center my-3" style={{ maxWidth: '500px' }}>
            ¿Estás seguro de que quieres **cancelar** la clase del día **{claseACancelar.fecha}** a las **{claseACancelar.hora_inicio?.substring(0, 5) || 'N/A'}**?
            <div className="mt-2">
              <Button variant="danger" onClick={confirmarBorrado} className="me-2">Sí, Cancelar</Button>
              <Button variant="secondary" onClick={() => setClaseACancelar(null)}>No, Mantener</Button>
            </div>
          </Alert>
        </div>
      )}

      {clases.length === 0 ? (
        <Alert variant="secondary" className="text-center">No tienes clases programadas.</Alert>
      ) : (
        // Usamos el div table-responsive para la correcta adaptación móvil
        <div className="table-responsive">
          {/* CAMBIO CLAVE: Quitamos bordered, usamos striped y hover con size="sm" */}
          <Table bordered hover responsive className="text-center vertical-align:middle">
            <thead>
              {/* Alineación a la izquierda para el contenido, excepto el botón */}
              <tr>
                <th className="bg-light">Fecha</th>
                <th className="bg-light">Hora</th>
                <th className="bg-light">Pista</th>
                <th className="bg-light text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clases.map((clase) => (
                <tr key={clase.id}>
                  <td className="text-center">{clase.fecha}</td>
                  <td className="text-center">{clase.hora_inicio?.substring(0, 5) || 'N/A'}</td>
                  <td className="text-center">{obtenerNombrePista(clase.pista_id)}</td>
                  {/* Centramos la columna del botón */}
                  <td className="text-center">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => iniciarBorrado(clase)}
                      disabled={!!claseACancelar}
                    >
                      Cancelar Clase
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
};

export default PanelProfesor;
