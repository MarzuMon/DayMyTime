import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AddSchedule() {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [meeting, setMeeting] = useState("");

  async function save() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please log in first");
      return;
    }

    const { error } = await supabase.from("schedules").insert([
      {
        title,
        scheduled_time: time,
        meeting_link: meeting || null,
        user_id: user.id,
      },
    ]);

    if (error) {
      alert(error.message);
    } else {
      alert("Saved");
    }
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