import { useState } from "react";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState("");

  const addTask = () => {
    setTasks([...tasks, task]);
    setTask("");
  };

  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold">
        DayMyTime Dashboard
      </h1>

      <div className="mt-6">

        <input
          className="border p-2"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Add task"
        />

        <button
          className="ml-3 bg-blue-600 text-white px-4 py-2"
          onClick={addTask}
        >
          Add
        </button>

      </div>

      <ul className="mt-6">

        {tasks.map((t, i) => (
          <li key={i} className="p-2 border-b">
            {t}
          </li>
        ))}

      </ul>

    </div>
  );
}