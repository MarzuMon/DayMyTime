import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AddSchedule() {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [meeting, setMeeting] = useState("");

  async function saveSchedule() {
    await supabase.from("schedules").insert([
      {
        title: title,
        scheduled_time: time,
        meeting_link: meeting,
      },
    ]);

    alert("Schedule saved");
  }

  return (
    <div>
      <h2>Add Schedule</h2>

      <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />

      <input type="datetime-local" onChange={(e) => setTime(e.target.value)} />

      <input placeholder="Meeting Link" onChange={(e) => setMeeting(e.target.value)} />

      <button onClick={saveSchedule}>Save</button>
    </div>
  );
}
