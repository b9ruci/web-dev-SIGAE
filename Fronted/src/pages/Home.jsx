import MainLayout from "../layouts/MainLayout";

function Home() {
  return (
    <MainLayout>

      <h1 className="text-3xl font-bold text-slate-700 mb-6">
        Dashboard Académico
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-gray-500">
            Estudiantes
          </h2>

          <p className="text-4xl font-bold mt-2 text-blue-600">
            350
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-gray-500">
            Profesores
          </h2>

          <p className="text-4xl font-bold mt-2 text-green-600">
            42
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-gray-500">
            Cursos
          </h2>

          <p className="text-4xl font-bold mt-2 text-purple-600">
            18
          </p>
        </div>

      </div>

    </MainLayout>
  );
}

export default Home;