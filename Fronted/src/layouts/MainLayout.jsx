function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-800 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">SIGAE</h1>
      </header>

      <main className="p-8">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;