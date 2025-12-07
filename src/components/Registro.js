import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const Registro = () => {
  // datos del formulario
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: "",
    email: "",
    password: "",
  });

  // variable de entorno booleana para deshabilitar el envio de datos al servidor
  const [cargaDatos, setCargaDatos] = useState(false);
  // variable de entorno para mensajes de retroalimentacion
  const [message, setMessage] = useState("");

  //Esta función se activa cada vez que el usuario escribe en un campo del formulario.
  const cambiosFormulario = (e) => {
    const { name, value } = e.target;
    setDatosFormulario({ ...datosFormulario, [name]: value });
  };

  // ✅ Validación propia en JavaScript (no del navegador)
  const validarFormulario = () => {
    setMessage(""); // limpiamos mensaje previo

    const { nombre, email, password } = datosFormulario;

    if (!nombre.trim()) {
      setMessage("El nombre es obligatorio.");
      return false;
    }

    if (nombre.trim().length < 3) {
      setMessage("El nombre debe tener al menos 3 caracteres.");
      return false;
    }

    if (!email) {
      setMessage("El correo electrónico es obligatorio.");
      return false;
    }

    // Validar formato básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("El correo electrónico no tiene un formato válido.");
      return false;
    }

    if (!password) {
      setMessage("La contraseña es obligatoria.");
      return false;
    }

    if (password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      return false;
    }

    return true;
  };

  // Preparamos la aplicacion para registrar un usuario
  const controlSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // ⛔ Primero validamos con nuestra lógica JS
    const esValido = validarFormulario();
    if (!esValido) return;

    setCargaDatos(true);

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
    const { error: profileError } = await supabase.from("Profiles").insert({
      id: authData.user.id,
      name: datosFormulario.nombre,
      email: datosFormulario.email,
      // Asignamos role por defecto
      role: "user",
    });

    setCargaDatos(false);

    if (profileError) {
      console.error("Error al crear el perfil:", profileError.message);
      setMessage(
        `Registro exitoso, pero hubo un error al crear el perfil: ${profileError.message}`
      );
    } else {
      console.log("Usuario y perfil creados con éxito.");
      setMessage(
        "¡Registro exitoso! Por favor, revisa tu correo para verificar tu cuenta."
      );
      setDatosFormulario({ nombre: "", email: "", password: "" });
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Registro de Usuario</h2>
      <form onSubmit={controlSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="nombre">Nombre:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={datosFormulario.nombre}
            onChange={cambiosFormulario}
            // sin required: validamos en JS
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="text" // antes era "email": así se ve que el formato lo validas tú
            id="email"
            name="email"
            value={datosFormulario.email}
            onChange={cambiosFormulario}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={datosFormulario.password}
            onChange={cambiosFormulario}
          />
        </div>
        <button type="submit" disabled={cargaDatos}>
          {cargaDatos ? "Registrando..." : "Registrarse"}
        </button>
      </form>
      {message && (
        <p style={{ color: "red", marginTop: "10px" }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Registro;



