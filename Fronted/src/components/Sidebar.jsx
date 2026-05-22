import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-8">
        SIGAE
      </h2>

      <nav className="flex flex-col gap-4">
        <Link
          to="/"
          className="hover:bg-slate-700 p-2 rounded-lg"
        >
          Dashboard
        </Link>

        <Link
          to="/usuarios"
          className="hover:bg-slate-700 p-2 rounded-lg"
        >
          Usuarios
        </Link>

        <Link
          to="/reportes"
          className="hover:bg-slate-700 p-2 rounded-lg"
        >
          Reportes
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;