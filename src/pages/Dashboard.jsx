import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [schedules, setSchedules] = useState([]);

  async function loadSchedules() {
    const { data } = await supabase.from("schedules").select("*").order("scheduled_time", { ascending: true });
    setSchedules(data || []);
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  return (
    <div>
      <h1>Day My Time</h1>
      {schedules.map((s) => (
        <div key={s.id}>
          <h3>{s.title}</h3>
          <p>{new Date(s.scheduled_time).toLocaleString()}</p>
          {s.meeting_link && (
            <a href={s.meeting_link} target="_blank" rel="noopener noreferrer">
              Join Meeting
            </a>
          )}
        </div>
      ))}
    </div>
  );
}