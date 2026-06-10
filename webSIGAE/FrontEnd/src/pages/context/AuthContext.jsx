import { createContext, useContext, useState } from "react";

export const AuthContext = createContext();

// Inicialización lazy — lee localStorage una sola vez al montar, sin useEffect
function getInitialState() {
  try {
    return {
      usuario: JSON.parse(localStorage.getItem("usuario")) || null,
      token: localStorage.getItem("token") || null,
      rolActivo: localStorage.getItem("rolActivo") || null,
    };
  } catch {
    return { usuario: null, token: null, rolActivo: null };
  }
}

export function AuthProvider({ children }) {
  const initial = getInitialState();

  const [usuario, setUsuario] = useState(initial.usuario);
  const [token, setToken] = useState(initial.token);
  const [rolActivo, setRolActivo] = useState(initial.rolActivo);

  const login = (usuarioData, tokenData) => {
    setUsuario(usuarioData);
    setToken(tokenData);
    localStorage.setItem("usuario", JSON.stringify(usuarioData));
    localStorage.setItem("token", tokenData);
    return usuarioData.roles;
  };

  const seleccionarRol = (rol) => {
    setRolActivo(rol);
    localStorage.setItem("rolActivo", rol);
  };

  const logout = async () => {
    const currentToken = localStorage.getItem("token");
    // Invalidar sesión en el servidor (fire-and-forget, no bloquear UI si falla)
    if (currentToken) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${currentToken}` },
      }).catch(() => {});
    }
    setUsuario(null);
    setToken(null);
    setRolActivo(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    localStorage.removeItem("rolActivo");
  };

  return (
    <AuthContext.Provider
      value={{ usuario, token, rolActivo, login, logout, seleccionarRol }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}