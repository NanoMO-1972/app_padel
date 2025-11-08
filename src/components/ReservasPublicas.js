import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Container, Row, Col, Table, Alert, Form } from 'react-bootstrap';

const ReservasPublicas = () => {
  const [pistas, setPistas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);

  const horarios = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];  

  useEffect(() => {
    const consultaBBDD = async () => {
      setLoading(true);
      setError(null);

      const { data: datosPistas, error: pistasError } = await supabase
        .from('Pistas')
        .select('*')
        .order('id', { ascending: true });

      const { data: datosReservas, error: reservasError } = await supabase
        .from('Reservas')
        .select('*')
        .eq('fecha', fechaSeleccionada);

      if (pistasError || reservasError) {
        console.error('Error al cargar datos:', pistasError || reservasError);
        setError('Error al cargar las pistas y las reservas.');
      } else {
        setPistas(datosPistas);
        setReservas(datosReservas);
      }
      setLoading(false);
    };

    consultaBBDD();
  }, [fechaSeleccionada]);

  const verificarReserva = (pistaId, hora) => {
    return reservas.find(reserva => 
      reserva.pista_id === pistaId && reserva.hora_inicio.substring(0, 5) === hora
    );
  };

  if (loading) return <p>Cargando disponibilidad...</p>;
// Asumiendo que tienes una variable 'error' en este componente también
if (error) return <Alert variant="danger">{error}</Alert>; 


  return (
    // 1. Contenedor principal con margen
    <Container className="my-5">
      <h2 className="mb-4">Disponibilidad de Pistas</h2>
      
      {/* 2. Selector de Fecha: Usando Form.Group y Form.Control */}
      <Row className="justify-content-center">
    {/* Usamos Col para limitar el ancho: 
      - En pantallas pequeñas (sin prefijo), ocupa 6 de 12 columnas (la mitad).
      - En pantallas medianas y grandes (md), ocupa 3 de 12 columnas (un cuarto).
    */}
      <Col xs={6} md={3}> 
        <Form.Group className="mb-3 text-center" controlId="fechaReserva">
          <Form.Label>Selecciona una fecha:</Form.Label>
          <Form.Control 
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)} 
          />
        </Form.Group>
      </Col>
      </Row>
      {/* Mensaje informativo */}
      <p className="mb-4 text-muted">
        Aquí puedes ver la disponibilidad de las pistas. Inicia sesión para hacer una reserva.
      </p>

      {/* 3. Tabla de Horarios: Usando el componente Table */}
      {/* Aplicamos estilos básicos y responsivos */}
      <Table bordered hover responsive className="text-center">
        <thead>
          <tr>
            <th className="bg-light">Hora</th> {/* Clase para dar un color de cabecera */}
            {pistas.map((pista) => (
              <th key={pista.id} className="bg-light">
                {pista.nombre}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {horarios.map((hora) => (
            <tr key={hora}>
              {/* Columna de la hora con negrita */}
              <td className="fw-bold bg-light">{hora}</td>
              
              {pistas.map((pista) => {
                const reservado = verificarReserva(pista.id, hora);
                
                let cellVariant = 'success'; // Verde para libre
                let cellContent = 'Libre';

                if (reservado) {
                  cellVariant = 'danger'; // Rojo para ocupado
                  cellContent = 'Ocupada';
                } 
                // Si no está reservado, se queda con 'success' y 'Libre'

                return (
                  // Usamos Template Literal para aplicar el color de fondo dinámico
                  <td 
                    key={pista.id} 
                    className={`bg-${cellVariant} text-white`}
                    // No es necesario el style de cursor:default, lo maneja Bootstrap
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default ReservasPublicas;