import MainLayout from "../layouts/MainLayout";

function Home() {
  return (
    <MainLayout>
      <div className="bg-white p-8 rounded-2xl shadow-md">
        <h1 className="text-4xl font-bold text-blue-600">
          Bienvenido a SIGAE 
        </h1>

        <p className="mt-4 text-gray-600">
          !
        </p>

        <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Comenzar
        </button>
      </div>
    </MainLayout>
  );
}

export default Home;