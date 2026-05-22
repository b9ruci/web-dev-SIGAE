import Sidebar from "../components/Sidebar";

function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      <Sidebar />

      <div className="flex-1">
        
        <header className="bg-white shadow-md p-4">
          <h1 className="text-2xl font-bold text-slate-700">
            Sistema SIGAE
          </h1>
        </header>

        <main className="p-8">
          {children}
        </main>

      </div>
    </div>
  );
}

export default MainLayout;