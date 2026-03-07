export default function Login() {
  return (
    <div className="flex items-center justify-center h-screen">

      <div className="p-10 border rounded">

        <h2 className="text-2xl mb-4">
          Login
        </h2>

        <input
          className="border p-2 w-full"
          placeholder="Email"
        />

        <input
          className="border p-2 w-full mt-3"
          type="password"
          placeholder="Password"
        />

        <button className="mt-4 bg-blue-600 text-white px-4 py-2 w-full">
          Login
        </button>

      </div>

    </div>
  );
}