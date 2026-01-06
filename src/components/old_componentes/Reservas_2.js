import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Container, Row, Col, Table, Button, Alert, Form } from 'react-bootstrap';

const Reservas = () => {
  // --- Estados ---
  const [pistas, setPistas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [roleUsuario, setRoleUsuario] = useState(null);

  // Inicializa con la fecha actual en formato 'YYYY-MM-DD'
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);

  const horarios = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  // --- useEffect: Carga de Datos y Perfil del Usuario ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // 1. Obtener Sesión y Perfil del Usuario
      const { data: { user: usuario } } = await supabase.auth.getUser();

      if (usuario) {
        setUserId(usuario.id);
        
        const { data: profile, error: profileError } = await supabase
          .from('Profiles')
          .select('role')
          .eq('id', usuario.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error al cargar el perfil:', profileError);
        }

        if (profile) {
          setRoleUsuario(profile.role);
        } else {
          // Asigna 'user' por defecto si no tiene un rol explícito
          setRoleUsuario('user'); 
        }
      } else {
        setUserId(null); 
        setRoleUsuario(null);
      }

      // 2. Obtener Pistas
      const { data: datosPistas, error: errorPistas } = await supabase
        .from('Pistas')
        .select('*')
        .order('id', { ascending: true });

      // 3. Obtener Reservas para la Fecha Seleccionada
      const { data: datosReservas, error: errorReservas } = await supabase
        .from('Reservas')
        .select('*')
        .eq('fecha', fechaSeleccionada);

      if (errorPistas || errorReservas) {
        console.error('Error al cargar datos:', errorPistas || errorReservas);
        setError('Error al cargar las pistas y las reservas');
      } else {
        setPistas(datosPistas);
        setReservas(datosReservas);
      }
      setLoading(false);
    };

    fetchData();
  }, [fechaSeleccionada]);

  // --- Función Auxiliar: Verificar Reserva ---
  const verificarReserva = (pistaId, hora) => {
    return reservas.find(reserva =>
      reserva.pista_id === pistaId && reserva.hora_inicio.substring(0, 5) === hora && reserva.fecha === fechaSeleccionada
    );
  };

  // --- Función: Gestión de Reservas (Crear) ---
  const gestionReservas = async (pistaId, hora) => {
    if (!userId) {
      alert('Debes iniciar sesión para hacer una reserva.');
      return;
    }
    
    // 1. Verificación de Límite de Reserva (Usuario Normal: 1 / Profesor: 3)
    let limiteDiario = 0;
    let mensajeLimite = '';

    if (roleUsuario === 'profesor') {
        limiteDiario = 3;
        mensajeLimite = `Ya has reservado ${limiteDiario} clases este día.`;
    } else if (roleUsuario === 'user') {
        limiteDiario = 1;
        mensajeLimite = 'Solo puedes reservar una hora al dia.';
    }

    if (limiteDiario > 0) {
        const { data: reservasUsuario, error: errorConsulta } = await supabase
            .from('Reservas')
            .select('id')
            .eq('user_id', userId)
            .eq('fecha', fechaSeleccionada);

        if (errorConsulta) {
            console.error('Error recuperando las reservas del usuario:', errorConsulta.message);
            return;
        }

        if (reservasUsuario.length >= limiteDiario) {
            alert(mensajeLimite);
            return;
        }
    }
    
    // 2. Comprobación de que la celda no esté ya reservada por nadie
    const reservaCelda = verificarReserva(pistaId, hora);

    if (reservaCelda) {
        if (reservaCelda.user_id === userId) {
            alert(`Ya tienes reservada la pista ${pistaId} a las ${hora}.`);
            return;
        } else {
            // Ocupada por otro usuario (incluido otro profesor/admin)
            alert('Esta hora ya está ocupada por otra reserva.');
            return;
        }
    }

    if (!window.confirm(`¿Quieres reservar la pista ${pistaId} el día ${fechaSeleccionada} a las ${hora}?`)) {
      return;
    }

    // 3. Calcular hora de fin (asumiendo 1 hora)
    const [parteHora, parteMinuto] = hora.split(':');
    const horaFin = `${String(parseInt(parteHora, 10) + 1).padStart(2, '0')}:${parteMinuto}`;

    // 4. Insertar la reserva
    const { data, error } = await supabase
      .from('Reservas')
      .insert({
        pista_id: pistaId,
        user_id: userId, // Debe coincidir con auth.uid() para pasar RLS
        hora_inicio: hora,
        fecha: fechaSeleccionada,
        hora_fin: horaFin,
      })
      .select();

    if (error) {
      console.error('Error al hacer la reserva:', error.message);
      setError('No se pudo completar la reserva. (Verifique los permisos RLS)');
    } else {
      // Actualiza el estado local para reflejar la nueva reserva sin recargar
      setReservas([...reservas, data[0]]);
    }
  };

  // --- Función: Cancelar Reserva ---
  const cancelarReserva = async (reservaId) => {
    if (!window.confirm("¿Estás seguro de que quieres cancelar esta reserva?")) {
      return;
    }

    const { error } = await supabase
      .from('Reservas')
      .delete()
      .eq('id', reservaId);

    if (error) {
      console.error('Error al cancelar la reserva:', error.message);
      setError('No se pudo cancelar la reserva');
    } else {
      // Elimina la reserva del estado local
      setReservas(reservas.filter(reserva => reserva.id !== reservaId));
    }
  };

  // --- Renderizado Condicional de Estado ---
  if (loading) return <p>Cargando horarios...</p>;
  if (error) return <Alert variant='danger'>{error}</Alert>;

  // --- JSX (Renderizado de la Tabla) ---
  return (
    <Container className="my-5">
      <h2 className="mb-4 text-center">Reservar Pista</h2>

      {/* Selector de Fecha centrado y con ancho limitado */}
      <Row className="justify-content-center">
        <Col xs={12} md={4}>
          <Form.Group className="mb-3" controlId="fechaReserva">
            <Form.Label>Selecciona una fecha:</Form.Label>
            <Form.Control
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      <p className="text-center text-muted">
        {roleUsuario === 'profesor' ? 'Clic para añadir una CLASE (Límite: 3/día)' : 'Clic para hacer una RESERVA (Límite: 1/día)'}
      </p>

      {/* Tabla Responsiva */}
      <div className="table-responsive">
        <Table bordered hover responsive className="text-center">
          {/* THead: Cabecera de la Tabla */}
          <thead>
            <tr>
              <th className="bg-light">Hora</th>
              {pistas.map((pista) => (
                <th key={pista.id} className="bg-light">{pista.nombre}</th>
              ))}
            </tr>
          </thead>
          {/* TBody: Cuerpo de la Tabla */}
          <tbody>
            {horarios.map((hora) => (
              <tr key={hora}>
                <td className="fw-bold bg-light">{hora}</td>
                {pistas.map((pista) => {
                  const reservaExistente = verificarReserva(pista.id, hora);
                  const verificarReservaUsuario = reservaExistente && reservaExistente.user_id === userId;

                  let cellVariant = 'success'; // Libre (Verde)
                  let cellContent = 'Libre';
                  let isClickable = true;

                  if (reservaExistente) {
                    if (verificarReservaUsuario) {
                      cellVariant = 'secondary'; // Tu reserva (Gris)
                      cellContent = (
                        <>
                          Tu reserva
                          <br />
                          <Button
                            variant="danger"
                            size="sm"
                            // Detiene la propagación para que el clic del botón no active el clic de la celda (gestionReservas)
                            onClick={(e) => { e.stopPropagation(); cancelarReserva(reservaExistente.id); }}
                            className="mt-1"
                          >
                            Cancelar
                          </Button>
                        </>
                      );
                    } else {
                      cellVariant = 'danger'; // Ocupada (Rojo)
                      cellContent = 'Ocupada';
                      isClickable = false; // No se puede hacer clic
                    }
                  }

                  return (
                    <td
                      key={pista.id}
                      onClick={isClickable ? () => gestionReservas(pista.id, hora) : undefined}
                      className={`bg-${cellVariant} text-white`}
                      style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
};

export default Reservas;