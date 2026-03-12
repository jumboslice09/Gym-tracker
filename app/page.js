"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function Home() {
  const [weight, setWeight] = useState("");
  const [log, setLog] = useState([]);

  useEffect(() => {
    const savedLog = localStorage.getItem("weightLog");
    if (savedLog) {
      setLog(JSON.parse(savedLog));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("weightLog", JSON.stringify(log));
  }, [log]);

  function addWeight() {
    if (!weight) return;

    setLog([
      ...log,
      {
        date: new Date().toLocaleDateString(),
        weight: Number(weight),
      },
    ]);

    setWeight("");
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Gym Tracker</h1>

      <h2>Add Weight</h2>

      <input
        placeholder="Enter weight"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />

      <button onClick={addWeight}>Add</button>

      <h2>Weight Log</h2>

      {log.map((item, i) => (
        <div key={i}>
          {item.date} — {item.weight}
        </div>
      ))}

      <h2>Weight Chart</h2>

      <LineChart width={500} height={300} data={log}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="weight" stroke="#22c55e" />
      </LineChart>
    </div>
  );
}
