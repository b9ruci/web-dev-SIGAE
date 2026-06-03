import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [rolActivo, setRolActivo] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    const tokenGuardado = localStorage.getItem("token");
    const rolGuardado = localStorage.getItem("rolActivo");

    if (usuarioGuardado) setUsuario(JSON.parse(usuarioGuardado));
    if (tokenGuardado) setToken(tokenGuardado);
    if (rolGuardado) setRolActivo(rolGuardado);
  }, []);

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

  const logout = () => {
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
};

export const useAuth = () => useContext(AuthContext);