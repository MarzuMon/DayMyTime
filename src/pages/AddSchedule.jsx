import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AddSchedule() {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [meeting, setMeeting] = useState("");
  async function uploadImage(file) {
    const { data, error } = await supabase.storage.from("schedule-images").upload(`images/${file.name}`, file);

    if (error) {
      console.log(error);
      return null;
    }

    return data.path;
  }
  async function save() {
    await supabase.from("schedules").insert([
      {
        title: title,
        scheduled_time: time,
        meeting_link: meeting,
      },
    ]);

    alert("Saved");
  }

  return (
    <div>
      <h2>Add Schedule</h2>

      <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />

      <input type="datetime-local" onChange={(e) => setTime(e.target.value)} />

      <input placeholder="Meeting Link" onChange={(e) => setMeeting(e.target.value)} />

      <button onClick={save}>Save</button>
    </div>
  );
}
