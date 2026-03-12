"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Home() {
  const [weight, setWeight] = useState("");
  const [log, setLog] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("weightLog");
    if (saved) setLog(JSON.parse(saved));
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
    <div
      style={{
        backgroundColor: "#000",
        minHeight: "100vh",
        color: "#fff",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "20px", fontSize: "42px" }}>Gym Tracker</h1>

      <div
        style={{
          backgroundColor: "#111",
          border: "2px solid red",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Add Weight</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            placeholder="Enter weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid red",
              backgroundColor: "#000",
              color: "#fff",
              width: "200px",
            }}
          />
          <button
            onClick={addWeight}
            style={{
              backgroundColor: "red",
              color: "#fff",
              border: "none",
              padding: "12px 18px",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
          >
            Add
          </button>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#111",
          border: "2px solid red",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Weight Log</h2>
        {log.length === 0 ? (
          <p>No entries yet.</p>
        ) : (
          log.map((item, i) => (
            <div key={i} style={{ marginBottom: "8px", fontSize: "18px" }}>
              {item.date} — {item.weight} lbs
            </div>
          ))
        )}
      </div>

      <div
        style={{
          backgroundColor: "#111",
          border: "2px solid red",
          borderRadius: "14px",
          padding: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Weight Chart</h2>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={log}>
              <CartesianGrid stroke="#333" />
              <XAxis dataKey="date" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="red"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
