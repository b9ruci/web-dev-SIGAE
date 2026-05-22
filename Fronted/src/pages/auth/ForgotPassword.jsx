function ForgotPassword() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Recuperar Contraseña</h1>

        <p>
          Ingresa tu correo institucional para recibir un enlace de recuperación.
        </p>

        <form>
          <input
            type="email"
            placeholder="Correo electrónico"
          />

          <button type="submit">
            Enviar enlace
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;