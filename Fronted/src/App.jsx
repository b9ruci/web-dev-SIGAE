import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Usuarios from "./pages/Usuarios";
import Reportes from "./pages/Reportes";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Home />} />

        <Route path="/usuarios" element={<Usuarios />} />

        <Route path="/reportes" element={<Reportes />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;