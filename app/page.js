"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [activePage, setActivePage] = useState("dashboard");

  const [weight, setWeight] = useState("");
  const [weightLog, setWeightLog] = useState([]);

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [macroLog, setMacroLog] = useState([]);

  const [workoutName, setWorkoutName] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [workoutLog, setWorkoutLog] = useState([]);

  useEffect(() => {
    const savedWeightLog = localStorage.getItem("weightLog");
    const savedMacroLog = localStorage.getItem("macroLog");
    const savedWorkoutLog = localStorage.getItem("workoutLog");

    if (savedWeightLog) setWeightLog(JSON.parse(savedWeightLog));
    if (savedMacroLog) setMacroLog(JSON.parse(savedMacroLog));
    if (savedWorkoutLog) setWorkoutLog(JSON.parse(savedWorkoutLog));
  }, []);

  useEffect(() => {
    localStorage.setItem("weightLog", JSON.stringify(weightLog));
  }, [weightLog]);

  useEffect(() => {
    localStorage.setItem("macroLog", JSON.stringify(macroLog));
  }, [macroLog]);

  useEffect(() => {
    localStorage.setItem("workoutLog", JSON.stringify(workoutLog));
  }, [workoutLog]);

  function addWeight() {
    if (!weight) return;

    setWeightLog([
      ...weightLog,
      {
        date: new Date().toLocaleDateString(),
        weight: Number(weight),
      },
    ]);

    setWeight("");
  }

  function addMacros() {
    if (!calories && !protein && !carbs && !fat) return;

    setMacroLog([
      ...macroLog,
      {
        date: new Date().toLocaleDateString(),
        calories: Number(calories || 0),
        protein: Number(protein || 0),
        carbs: Number(carbs || 0),
        fat: Number(fat || 0),
      },
    ]);

    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  }

  function addWorkout() {
    if (!workoutName && !workoutNotes) return;

    setWorkoutLog([
      ...workoutLog,
      {
        date: new Date().toLocaleDateString(),
        name: workoutName,
        notes: workoutNotes,
      },
    ]);

    setWorkoutName("");
    setWorkoutNotes("");
  }

  const latestWeight =
    weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : "-";

  const latestMacros =
    macroLog.length > 0 ? macroLog[macroLog.length - 1] : null;

  const avgCalories = useMemo(() => {
    if (macroLog.length === 0) return "-";
    const total = macroLog.reduce((sum, item) => sum + item.calories, 0);
    return Math.round(total / macroLog.length);
  }, [macroLog]);

  const avgWeight = useMemo(() => {
    if (weightLog.length === 0) return "-";
    const total = weightLog.reduce((sum, item) => sum + item.weight, 0);
    return (total / weightLog.length).toFixed(1);
  }, [weightLog]);

  const buttonStyle = (page) => ({
    backgroundColor: activePage === page ? "red" : "#111",
    color: "#fff",
    border: "1px solid red",
    padding: "12px 16px",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  });

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
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <button style={buttonStyle("dashboard")} onClick={() => setActivePage("dashboard")}>
          Dashboard
        </button>
        <button style={buttonStyle("weight")} onClick={() => setActivePage("weight")}>
          Weight
        </button>
        <button style={buttonStyle("macros")} onClick={() => setActivePage("macros")}>
          Macros
        </button>
        <button style={buttonStyle("workouts")} onClick={() => setActivePage("workouts")}>
          Workouts
        </button>
      </div>

      {activePage === "dashboard" && (
        <div
          style={{
            backgroundColor: "#111",
            border: "2px solid red",
            borderRadius: "14px",
            padding: "20px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Dashboard</h2>
          <p style={{ fontSize: "18px" }}>Latest Weight: {latestWeight}</p>
          <p style={{ fontSize: "18px" }}>Average Weight: {avgWeight}</p>
          <p style={{ fontSize: "18px" }}>Average Calories: {avgCalories}</p>
          <p style={{ fontSize: "18px" }}>
            Latest Macros:{" "}
            {latestMacros
              ? `${latestMacros.calories} cal | ${latestMacros.protein}P | ${latestMacros.carbs}C | ${latestMacros.fat}F`
              : "-"}
          </p>
          <p style={{ fontSize: "18px" }}>Saved Workouts: {workoutLog.length}</p>
        </div>
      )}

      {activePage === "weight" && (
        <>
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
                  width: "220px",
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
            {weightLog.length === 0 ? (
              <p>No entries yet.</p>
            ) : (
              weightLog.map((item, i) => (
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
                <LineChart data={weightLog}>
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
        </>
      )}

      {activePage === "macros" && (
        <>
          <div
            style={{
              backgroundColor: "#111",
              border: "2px solid red",
              borderRadius: "14px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Log Macros</h2>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                placeholder="Calories"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Protein"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Carbs"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Fat"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={addMacros}
                style={{
                  backgroundColor: "red",
                  color: "#fff",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                }}
              >
                Save
              </button>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#111",
              border: "2px solid red",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Macro Log</h2>
            {macroLog.length === 0 ? (
              <p>No macro entries yet.</p>
            ) : (
              macroLog.map((item, i) => (
                <div key={i} style={{ marginBottom: "10px", fontSize: "18px" }}>
                  {item.date} — {item.calories} cal | {item.protein}P | {item.carbs}C | {item.fat}F
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activePage === "workouts" && (
        <>
          <div
            style={{
              backgroundColor: "#111",
              border: "2px solid red",
              borderRadius: "14px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Log Workout</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                placeholder="Workout Name"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                style={{ ...inputStyle, width: "100%", maxWidth: "420px" }}
              />
              <textarea
                placeholder="Workout Notes"
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                style={{
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "1px solid red",
                  borderRadius: "8px",
                  padding: "12px",
                  minHeight: "120px",
                  width: "100%",
                  maxWidth: "420px",
                }}
              />
              <button
                onClick={addWorkout}
                style={{
                  backgroundColor: "red",
                  color: "#fff",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  width: "140px",
                }}
              >
                Save Workout
              </button>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#111",
              border: "2px solid red",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Workout Log</h2>
            {workoutLog.length === 0 ? (
              <p>No workouts saved yet.</p>
            ) : (
              workoutLog.map((item, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: "16px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid #333",
                  }}
                >
                  <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                    {item.date} — {item.name || "Workout"}
                  </div>
                  <div style={{ marginTop: "6px", color: "#ddd" }}>{item.notes}</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid red",
  backgroundColor: "#000",
  color: "#fff",
  width: "160px",
};
