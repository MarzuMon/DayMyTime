export default function Home() {
  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <span className="text-xl font-bold">DayMyTime</span>
      </nav>

      <div className="text-center mt-20">
        <h1 className="text-5xl font-bold">
          Plan Your Day Visually
        </h1>

        <p className="mt-6 text-gray-400">
          Schedule tasks and join meetings instantly.
        </p>

        <button className="mt-8 bg-blue-600 px-6 py-3 rounded-lg">
          Start Free
        </button>
      </div>
    </div>
  );
}