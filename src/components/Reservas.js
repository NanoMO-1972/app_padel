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

        // Uso de .single() para obtener un solo registro de perfil.
        const { data: profile, error: profileError } = await supabase
          .from('Profiles')
          .select('role')
          .eq('id', usuario.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = No rows returned
          console.error('Error al cargar el perfil:', profileError);
        }

        if (profile) {
          setRoleUsuario(profile.role);
        } else {
          setRoleUsuario(null);
        }
      } else {
        setUserId(null);
        setRoleUsuario(null);
      }

      // 2. Obtener Pistas
      const { data: datosPistas, error: errorPistas } = await supabase
        .from('Pistas')
        .select('*')
        .eq('esta_activa', true)
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
      // Comprueba el ID de la pista y la hora exacta (HH:MM)
      reserva.pista_id === pistaId && reserva.hora_inicio.substring(0, 5) === hora && reserva.fecha === fechaSeleccionada
    );
  };

  // --- Función: Gestión de Reservas (Crear) ---
  const gestionReservas = async (pistaId, hora) => {
    if (!userId) {
      alert('Debes iniciar sesión para hacer una reserva.');
      return;
    }

    // 1. Verificar si la celda ya está reservada (usando el estado local)
    const reservaCelda = reservas.find(reserva =>
      reserva.pista_id === pistaId && reserva.hora_inicio.substring(0, 5) === hora
    );

    if (reservaCelda) {
      if (reservaCelda.user_id === userId) {
        return; // Es tu reserva
      } else {
        return; // Ocupada por otro
      }
    }

    //2. Verificar que la pista sigue activa
    const { data: pista, error: errorPista } = await supabase
    .from('Pistas')
    .select('esta_activa')
    .eq('id', pistaId)
    .single();

    if (errorPista || !pista?.esta_activa) {
    alert('La pista no está disponible');
    return;
}

    // 3. Lógica de límite de reserva por usuario (user: 1, profesor: 3)
    if (roleUsuario === 'user' || roleUsuario === 'profesor') {
      const { data: reservasUsuario, error: errorConsulta } = await supabase
        .from('Reservas')
        .select('*')
        .eq('user_id', userId)
        .eq('fecha', fechaSeleccionada);

      if (errorConsulta) {
        console.error('Error recuperando las reservas:', errorConsulta.message);
        return;
      }

      // Define el límite según el rol
      const limite = roleUsuario === 'profesor' ? 3 : 1;

      if (reservasUsuario.length >= limite) {
        alert(`Como ${roleUsuario}, solo puedes reservar un máximo de ${limite} hora(s) al día.`);
        return;
      }
    }

    // 3. Confirmación de la reserva
    if (!window.confirm(`¿Quieres reservar la pista ${pistaId} el día ${fechaSeleccionada} a las ${hora}?`)) {
      return;
    }

    // 4. Calcular hora de fin (asumiendo 1 hora)
    const [parteHora, parteMinuto] = hora.split(':');
    const horaFin = `${String(parseInt(parteHora, 10) + 1).padStart(2, '0')}:${parteMinuto}`;

    // 5. Insertar la reserva
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
    <Container fluid className="my-5">
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

      <p className="text-center text-muted">Selecciona una celda vacía para reservar</p>

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