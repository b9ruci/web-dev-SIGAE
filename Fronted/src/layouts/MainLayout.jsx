function MainLayout({ children }) {
  return (
    <div>
      <header
        style={{
          background: "#1e293b",
          color: "white",
          padding: "1rem",
        }}
      >
        <h2>SIGAE</h2>
      </header>

      <main style={{ padding: "2rem" }}>
        {children}
      </main>
    </div>
  );
}

export default MainLayout;