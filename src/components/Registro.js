import React, { useState} from "react"; 
import { supabase } from "./supabaseClient";

const Registro = () => {
    
    // datos del formulario
    const [datosFormulario, setDatosFormulario] = useState({
        nombre: "",
        email: "",
        password:""        
    });

    // variable de entorno booleana para deshabilitar el envio de datos al servidor
    const [cargaDatos, setCargaDatos] = useState(false);
    // variable de entorno para mensajes de retroalimentacion
    const [message, setMessage] = useState("");
    
    //Esta función se activa cada vez que el usuario escribe en un campo del formulario.
    //Actualiza el estado formData

    const cambiosFormulario = (e) => {
        const { name, value } = e.target;
        setDatosFormulario({...datosFormulario, [name]: value});
    };

    // Preparamos la aplicacion para registrar un usuario
    const controlSubmit = async (e) => {
        e.preventDefault();
        setCargaDatos(true);
        setMessage("");

        // Primero registramos el nuevo usuario en la tabla auth de la BBDD  
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: datosFormulario.email,
            password: datosFormulario.password,
        });

        if (authError) {
            console.error(`Error de registro:`, authError.message);
            setMessage(`Error: ${authError.message}`);
            setCargaDatos(false);
            return;
        }

        // Si el registro fue exitoso, ahora creamos un perfil para el usuario en tu tabla "Profiles"

        const { error: profileError} = await supabase
            .from ("Profiles")
            .insert({
                id: authData.user.id,
                name: datosFormulario.nombre,
                email: datosFormulario.email,
                // Asignamos role por defecto
                role: "user",
           });

        setCargaDatos(false);

        if (profileError) {
            console.error("Error al crear el perfil:", profileError.message);
            setMessage(`Registro exitoso, pero hubo un error al crear el perfil: ${profileError.message}`);
        } else { 
          console.log('Usuario y perfil creados con éxito.');
          setMessage ('¡Registro exitoso! Por favor, revisa tu correo para verificar tu cuenta.');
          setDatosFormulario ({ nombre: '', email: '', password: '' });
        } 
};

return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Registro de Usuario</h2>
      <form onSubmit={controlSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="nombre">Nombre:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={datosFormulario.nombre}
            onChange={cambiosFormulario}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={datosFormulario.email}
            onChange={cambiosFormulario}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={datosFormulario.password}
            onChange={cambiosFormulario}
            required
          />
        </div>
        <button type="submit" disabled={cargaDatos}>
          {cargaDatos ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Registro;


