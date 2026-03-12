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
  const [activeTab, setActiveTab] = useState("weight");

  const [weight, setWeight] = useState("");
  const [log, setLog] = useState([]);

  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState(
    new Date().toLocaleDateString()
  );
  const [exerciseRows, setExerciseRows] = useState([
    { exercise: "", sets: "", reps: "", weight: "" },
  ]);
  const [workoutLog, setWorkoutLog] = useState([]);
  const [savedWorkoutNames, setSavedWorkoutNames] = useState([]);

  useEffect(() => {
    const savedWeights = localStorage.getItem("weightLog");
    if (savedWeights) {
      setLog(JSON.parse(savedWeights));
    }

    const savedWorkouts = localStorage.getItem("workoutLog");
    if (savedWorkouts) {
      setWorkoutLog(JSON.parse(savedWorkouts));
    }

    const savedNames = localStorage.getItem("savedWorkoutNames");
    if (savedNames) {
      setSavedWorkoutNames(JSON.parse(savedNames));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("weightLog", JSON.stringify(log));
  }, [log]);

  useEffect(() => {
    localStorage.setItem("workoutLog", JSON.stringify(workoutLog));
  }, [workoutLog]);

  useEffect(() => {
    localStorage.setItem(
      "savedWorkoutNames",
      JSON.stringify(savedWorkoutNames)
    );
  }, [savedWorkoutNames]);

  function addWeight() {
    if (!weight) return;

    const newEntry = {
      date: new Date().toLocaleDateString(),
      weight: Number(weight),
    };

    setLog([newEntry, ...log]);
    setWeight("");
  }

  function updateExerciseRow(index, field, value) {
    const updated = [...exerciseRows];
    updated[index][field] = value;
    setExerciseRows(updated);
  }

  function addExerciseRow() {
    setExerciseRows([
      ...exerciseRows,
      { exercise: "", sets: "", reps: "", weight: "" },
    ]);
  }

  function addWorkout() {
    if (!workoutName) return;

    const cleaned = exerciseRows.filter(
      (r) => r.exercise || r.sets || r.reps || r.weight
    );

    const newWorkout = {
      name: workoutName,
      date: workoutDate,
      exercises: cleaned,
    };

    setWorkoutLog([newWorkout, ...workoutLog]);

    if (!savedWorkoutNames.includes(workoutName)) {
      setSavedWorkoutNames([...savedWorkoutNames, workoutName]);
    }

    setWorkoutName("");
    setWorkoutDate(new Date().toLocaleDateString());
    setExerciseRows([{ exercise: "", sets: "", reps: "", weight: "" }]);
  }

  function deleteWeightEntry(indexToDelete) {
    setLog(log.filter((_, index) => index !== indexToDelete));
  }

  function deleteWorkout(indexToDelete) {
    setWorkoutLog(workoutLog.filter((_, index) => index !== indexToDelete));
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
      <h1 style={{ marginBottom: "20px", fontSize: "38px" }}>Gym Tracker</h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setActiveTab("weight")}
          style={{
            backgroundColor: activeTab === "weight" ? "red" : "#111",
            color: "#fff",
            border: "1px solid red",
            padding: "12px 18px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Weight
        </button>

        <button
          onClick={() => setActiveTab("workouts")}
          style={{
            backgroundColor: activeTab === "workouts" ? "red" : "#111",
            color: "#fff",
            border: "1px solid red",
            padding: "12px 18px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Workouts
        </button>
      </div>

      {activeTab === "weight" && (
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
                  cursor: "pointer",
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
              log.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    alignItems: "center",
                    marginBottom: "10px",
                    borderBottom: "1px solid #333",
                    paddingBottom: "8px",
                  }}
                >
                  <div style={{ fontSize: "18px" }}>
                    {item.date} — {item.weight} lbs
                  </div>

                  <button
                    onClick={() => deleteWeightEntry(index)}
                    style={{
                      backgroundColor: "#222",
                      color: "#fff",
                      border: "1px solid red",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
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
                <LineChart data={[...log].reverse()}>
                  <CartesianGrid stroke="#333" />
                  <XAxis dataKey="date" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111",
                      border: "1px solid red",
                      color: "#fff",
                    }}
                  />
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

      {activeTab === "workouts" && (
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

            <select
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid red",
                backgroundColor: "#000",
                color: "#fff",
                width: "100%",
                marginBottom: "12px",
              }}
            >
              <option value="">Select Saved Workout</option>
              {savedWorkoutNames.map((name, index) => (
                <option key={index} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <input
              placeholder="Workout Name"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid red",
                backgroundColor: "#000",
                color: "#fff",
                width: "100%",
                marginBottom: "12px",
              }}
            />

            <input
              placeholder="Date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid red",
                backgroundColor: "#000",
                color: "#fff",
                width: "100%",
                marginBottom: "16px",
              }}
            />

            {exerciseRows.map((row, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <input
                  placeholder="Exercise"
                  value={row.exercise}
                  onChange={(e) =>
                    updateExerciseRow(index, "exercise", e.target.value)
                  }
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid red",
                    backgroundColor: "#000",
                    color: "#fff",
                  }}
                />

                <input
                  placeholder="Sets"
                  value={row.sets}
                  onChange={(e) =>
                    updateExerciseRow(index, "sets", e.target.value)
                  }
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid red",
                    backgroundColor: "#000",
                    color: "#fff",
                  }}
                />

                <input
                  placeholder="Reps"
                  value={row.reps}
                  onChange={(e) =>
                    updateExerciseRow(index, "reps", e.target.value)
                  }
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid red",
                    backgroundColor: "#000",
                    color: "#fff",
                  }}
                />

                <input
                  placeholder="Weight"
                  value={row.weight}
                  onChange={(e) =>
                    updateExerciseRow(index, "weight", e.target.value)
                  }
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid red",
                    backgroundColor: "#000",
                    color: "#fff",
                  }}
                />
              </div>
            ))}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={addExerciseRow}
                style={{
                  backgroundColor: "#222",
                  color: "#fff",
                  border: "1px solid red",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Add Exercise
              </button>

              <button
                onClick={addWorkout}
                style={{
                  backgroundColor: "red",
                  color: "#fff",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
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
              workoutLog.map((workout, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid red",
                    borderRadius: "10px",
                    padding: "14px",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 6px 0" }}>{workout.name}</h3>
                      <p style={{ margin: 0, color: "#ccc" }}>
                        {workout.date || "No date"}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteWorkout(i)}
                      style={{
                        backgroundColor: "#222",
                        color: "#fff",
                        border: "1px solid red",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    {workout.exercises.map((ex, j) => (
                      <div key={j} style={{ marginBottom: "6px" }}>
                        {ex.exercise} — {ex.sets} sets × {ex.reps} reps ×{" "}
                        {ex.weight} lbs
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
