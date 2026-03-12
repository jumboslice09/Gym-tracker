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
  const [activeTab, setActiveTab] = useState("dashboard");

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

  const [measurementForm, setMeasurementForm] = useState({
    date: new Date().toLocaleDateString(),
    arms: "",
    chest: "",
    waist: "",
    legs: "",
    calves: "",
    shoulders: "",
  });
  const [measurementLog, setMeasurementLog] = useState([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState("arms");

  const [progressForm, setProgressForm] = useState({
    week: "",
    weight: "",
    bench: "",
    squat: "",
    deadlift: "",
    arms: "",
    waist: "",
    physique: "",
  });
  const [progressLog, setProgressLog] = useState([]);

  const [dietTitle, setDietTitle] = useState("");
  const [dietNotes, setDietNotes] = useState("");
  const [dietLog, setDietLog] = useState([]);

  useEffect(() => {
    const savedWeights = localStorage.getItem("weightLog");
    if (savedWeights) setLog(JSON.parse(savedWeights));

    const savedWorkouts = localStorage.getItem("workoutLog");
    if (savedWorkouts) setWorkoutLog(JSON.parse(savedWorkouts));

    const savedNames = localStorage.getItem("savedWorkoutNames");
    if (savedNames) setSavedWorkoutNames(JSON.parse(savedNames));

    const savedMeasurements = localStorage.getItem("measurementLog");
    if (savedMeasurements) setMeasurementLog(JSON.parse(savedMeasurements));

    const savedProgress = localStorage.getItem("progressLog");
    if (savedProgress) setProgressLog(JSON.parse(savedProgress));

    const savedDiet = localStorage.getItem("dietLog");
    if (savedDiet) setDietLog(JSON.parse(savedDiet));
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

  useEffect(() => {
    localStorage.setItem("measurementLog", JSON.stringify(measurementLog));
  }, [measurementLog]);

  useEffect(() => {
    localStorage.setItem("progressLog", JSON.stringify(progressLog));
  }, [progressLog]);

  useEffect(() => {
    localStorage.setItem("dietLog", JSON.stringify(dietLog));
  }, [dietLog]);

  const chartData = useMemo(() => {
    return [...log].reverse();
  }, [log]);

  const measurementChartData = useMemo(() => {
    return [...measurementLog]
      .reverse()
      .map((entry) => ({
        date: entry.date,
        value: Number(entry[selectedMeasurement]) || 0,
      }))
      .filter((entry) => entry.value > 0);
  }, [measurementLog, selectedMeasurement]);

  const currentWeight =
    log.length > 0 ? log[0].weight : progressLog[0]?.weight || "-";

  const weeklyAverage = useMemo(() => {
    const recent = log
      .slice(0, 7)
      .map((item) => Number(item.weight))
      .filter((n) => !Number.isNaN(n) && n > 0);

    if (!recent.length) return "-";
    return (recent.reduce((a, b) => a + b, 0) / recent.length).toFixed(1);
  }, [log]);

  const latestProgress = progressLog[0] || {};
  const latestMeasurements = measurementLog[0] || {};

  function addWeight() {
    if (!weight) return;

    const newEntry = {
      date: new Date().toLocaleDateString(),
      weight: Number(weight),
    };

    setLog([newEntry, ...log]);
    setWeight("");
  }

  function deleteWeightEntry(indexToDelete) {
    setLog(log.filter((_, index) => index !== indexToDelete));
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

  function deleteWorkout(indexToDelete) {
    setWorkoutLog(workoutLog.filter((_, index) => index !== indexToDelete));
  }

  function addMeasurement() {
    if (
      !measurementForm.arms &&
      !measurementForm.chest &&
      !measurementForm.waist &&
      !measurementForm.legs &&
      !measurementForm.calves &&
      !measurementForm.shoulders
    ) {
      return;
    }

    setMeasurementLog([{ ...measurementForm }, ...measurementLog]);

    setMeasurementForm({
      date: new Date().toLocaleDateString(),
      arms: "",
      chest: "",
      waist: "",
      legs: "",
      calves: "",
      shoulders: "",
    });
  }

  function deleteMeasurement(indexToDelete) {
    setMeasurementLog(
      measurementLog.filter((_, index) => index !== indexToDelete)
    );
  }

  function addProgress() {
    if (!progressForm.week) return;

    setProgressLog([{ ...progressForm }, ...progressLog]);

    setProgressForm({
      week: "",
      weight: "",
      bench: "",
      squat: "",
      deadlift: "",
      arms: "",
      waist: "",
      physique: "",
    });
  }

  function deleteProgress(indexToDelete) {
    setProgressLog(progressLog.filter((_, index) => index !== indexToDelete));
  }

  function addDietNote() {
    if (!dietTitle) return;

    const newNote = {
      title: dietTitle,
      notes: dietNotes,
      date: new Date().toLocaleDateString(),
    };

    setDietLog([newNote, ...dietLog]);
    setDietTitle("");
    setDietNotes("");
  }

  function deleteDietNote(indexToDelete) {
    setDietLog(dietLog.filter((_, index) => index !== indexToDelete));
  }

  const tabButtonStyle = (tab) => ({
    backgroundColor: activeTab === tab ? "red" : "#111",
    color: "#fff",
    border: "1px solid red",
    padding: "12px 18px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  });

  const cardStyle = {
    backgroundColor: "#111",
    border: "2px solid red",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "20px",
  };

  const inputStyle = {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid red",
    backgroundColor: "#000",
    color: "#fff",
    width: "100%",
    marginBottom: "12px",
    boxSizing: "border-box",
  };

  const secondaryButtonStyle = {
    backgroundColor: "#222",
    color: "#fff",
    border: "1px solid red",
    padding: "12px 18px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const primaryButtonStyle = {
    backgroundColor: "red",
    color: "#fff",
    border: "none",
    padding: "12px 18px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

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
          onClick={() => setActiveTab("dashboard")}
          style={tabButtonStyle("dashboard")}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("weight")}
          style={tabButtonStyle("weight")}
        >
          Weight
        </button>
        <button
          onClick={() => setActiveTab("workouts")}
          style={tabButtonStyle("workouts")}
        >
          Workouts
        </button>
        <button
          onClick={() => setActiveTab("measurements")}
          style={tabButtonStyle("measurements")}
        >
          Measurements
        </button>
        <button
          onClick={() => setActiveTab("progress")}
          style={tabButtonStyle("progress")}
        >
          Progress
        </button>
        <button
          onClick={() => setActiveTab("diet")}
          style={tabButtonStyle("diet")}
        >
          Diet
        </button>
      </div>

      {activeTab === "dashboard" && (
        <>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Current Stats</h2>
            <div style={{ lineHeight: "1.9" }}>
              <div>Current Weight: {currentWeight}</div>
              <div>7-Day Avg Weight: {weeklyAverage}</div>
              <div>Goal Bulk Weight: 185–190</div>
              <div>Goal Cut Weight: 180 lean</div>
              <div>Height: 5&apos;10&quot;</div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Latest Measurements</h2>
            <div style={{ lineHeight: "1.9" }}>
              <div>Arms: {latestMeasurements.arms || "-"}</div>
              <div>Chest: {latestMeasurements.chest || "-"}</div>
              <div>Waist: {latestMeasurements.waist || "-"}</div>
              <div>Legs: {latestMeasurements.legs || "-"}</div>
              <div>Calves: {latestMeasurements.calves || "-"}</div>
              <div>Shoulders: {latestMeasurements.shoulders || "-"}</div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Latest Progress</h2>
            <div style={{ lineHeight: "1.9" }}>
              <div>Bench: {latestProgress.bench || "-"}</div>
              <div>Squat: {latestProgress.squat || "-"}</div>
              <div>Deadlift: {latestProgress.deadlift || "-"}</div>
              <div>Arms: {latestProgress.arms || "-"}</div>
              <div>Waist: {latestProgress.waist || "-"}</div>
              <div>Physique Notes: {latestProgress.physique || "-"}</div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Quick View</h2>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
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

      {activeTab === "weight" && (
        <>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Add Weight</h2>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                placeholder="Enter weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                style={{ ...inputStyle, width: "220px", marginBottom: 0 }}
              />

              <button onClick={addWeight} style={primaryButtonStyle}>
                Add
              </button>
            </div>
          </div>

          <div style={cardStyle}>
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

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Weight Chart</h2>

            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
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
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Log Workout</h2>

            <select
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              style={inputStyle}
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
              style={inputStyle}
            />

            <input
              placeholder="Date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              style={inputStyle}
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
                  style={{ ...inputStyle, marginBottom: 0 }}
                />

                <input
                  placeholder="Sets"
                  value={row.sets}
                  onChange={(e) =>
                    updateExerciseRow(index, "sets", e.target.value)
                  }
                  style={{ ...inputStyle, marginBottom: 0 }}
                />

                <input
                  placeholder="Reps"
                  value={row.reps}
                  onChange={(e) =>
                    updateExerciseRow(index, "reps", e.target.value)
                  }
                  style={{ ...inputStyle, marginBottom: 0 }}
                />

                <input
                  placeholder="Weight"
                  value={row.weight}
                  onChange={(e) =>
                    updateExerciseRow(index, "weight", e.target.value)
                  }
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
              </div>
            ))}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={addExerciseRow} style={secondaryButtonStyle}>
                Add Exercise
              </button>

              <button onClick={addWorkout} style={primaryButtonStyle}>
                Save Workout
              </button>
            </div>
          </div>

          <div style={cardStyle}>
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

      {activeTab === "measurements" && (
        <>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Body Measurements</h2>

            <input
              placeholder="Date"
              value={measurementForm.date}
              onChange={(e) =>
                setMeasurementForm({ ...measurementForm, date: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Arms"
              value={measurementForm.arms}
              onChange={(e) =>
                setMeasurementForm({ ...measurementForm, arms: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Chest"
              value={measurementForm.chest}
              onChange={(e) =>
                setMeasurementForm({ ...measurementForm, chest: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Waist"
              value={measurementForm.waist}
              onChange={(e) =>
                setMeasurementForm({ ...measurementForm, waist: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Legs"
              value={measurementForm.legs}
              onChange={(e) =>
                setMeasurementForm({ ...measurementForm, legs: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Calves"
              value={measurementForm.calves}
              onChange={(e) =>
                setMeasurementForm({
                  ...measurementForm,
                  calves: e.target.value,
                })
              }
              style={inputStyle}
            />

            <input
              placeholder="Shoulders"
              value={measurementForm.shoulders}
              onChange={(e) =>
                setMeasurementForm({
                  ...measurementForm,
                  shoulders: e.target.value,
                })
              }
              style={inputStyle}
            />

            <button onClick={addMeasurement} style={primaryButtonStyle}>
              Save Measurements
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Measurement Log</h2>

            {measurementLog.length === 0 ? (
              <p>No measurements saved yet.</p>
            ) : (
              measurementLog.map((entry, index) => (
                <div
                  key={index}
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
                      <h3 style={{ margin: "0 0 6px 0" }}>{entry.date}</h3>
                    </div>

                    <button
                      onClick={() => deleteMeasurement(index)}
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

                  <div style={{ lineHeight: "1.8", marginTop: "10px" }}>
                    <div>Arms: {entry.arms || "-"}</div>
                    <div>Chest: {entry.chest || "-"}</div>
                    <div>Waist: {entry.waist || "-"}</div>
                    <div>Legs: {entry.legs || "-"}</div>
                    <div>Calves: {entry.calves || "-"}</div>
                    <div>Shoulders: {entry.shoulders || "-"}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Measurement Chart</h2>

            <select
              value={selectedMeasurement}
              onChange={(e) => setSelectedMeasurement(e.target.value)}
              style={inputStyle}
            >
              <option value="arms">Arms</option>
              <option value="chest">Chest</option>
              <option value="waist">Waist</option>
              <option value="legs">Legs</option>
              <option value="calves">Calves</option>
              <option value="shoulders">Shoulders</option>
            </select>

            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={measurementChartData}>
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
                    dataKey="value"
                    stroke="red"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === "progress" && (
        <>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Add Weekly Progress</h2>

            <input
              placeholder="Week Of"
              value={progressForm.week}
              onChange={(e) =>
                setProgressForm({ ...progressForm, week: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Weight"
              value={progressForm.weight}
              onChange={(e) =>
                setProgressForm({ ...progressForm, weight: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Bench"
              value={progressForm.bench}
              onChange={(e) =>
                setProgressForm({ ...progressForm, bench: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Squat"
              value={progressForm.squat}
              onChange={(e) =>
                setProgressForm({ ...progressForm, squat: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Deadlift"
              value={progressForm.deadlift}
              onChange={(e) =>
                setProgressForm({ ...progressForm, deadlift: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Arms"
              value={progressForm.arms}
              onChange={(e) =>
                setProgressForm({ ...progressForm, arms: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Waist"
              value={progressForm.waist}
              onChange={(e) =>
                setProgressForm({ ...progressForm, waist: e.target.value })
              }
              style={inputStyle}
            />

            <textarea
              placeholder="Physique Notes"
              value={progressForm.physique}
              onChange={(e) =>
                setProgressForm({ ...progressForm, physique: e.target.value })
              }
              style={{
                ...inputStyle,
                minHeight: "100px",
                resize: "vertical",
              }}
            />

            <button onClick={addProgress} style={primaryButtonStyle}>
              Save Progress
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Progress Log</h2>

            {progressLog.length === 0 ? (
              <p>No progress entries yet.</p>
            ) : (
              progressLog.map((entry, index) => (
                <div
                  key={index}
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
                      <h3 style={{ margin: "0 0 6px 0" }}>{entry.week}</h3>
                    </div>

                    <button
                      onClick={() => deleteProgress(index)}
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

                  <div style={{ lineHeight: "1.8", marginTop: "10px" }}>
                    <div>Weight: {entry.weight || "-"}</div>
                    <div>Bench: {entry.bench || "-"}</div>
                    <div>Squat: {entry.squat || "-"}</div>
                    <div>Deadlift: {entry.deadlift || "-"}</div>
                    <div>Arms: {entry.arms || "-"}</div>
                    <div>Waist: {entry.waist || "-"}</div>
                    <div>Physique: {entry.physique || "-"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "diet" && (
        <>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Diet / Supplements / Notes</h2>

            <input
              placeholder="Title"
              value={dietTitle}
              onChange={(e) => setDietTitle(e.target.value)}
              style={inputStyle}
            />

            <textarea
              placeholder="Notes"
              value={dietNotes}
              onChange={(e) => setDietNotes(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: "120px",
                resize: "vertical",
              }}
            />

            <button onClick={addDietNote} style={primaryButtonStyle}>
              Save Note
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Saved Notes</h2>

            {dietLog.length === 0 ? (
              <p>No notes saved yet.</p>
            ) : (
              dietLog.map((item, index) => (
                <div
                  key={index}
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
                      <h3 style={{ margin: "0 0 6px 0" }}>{item.title}</h3>
                      <p style={{ margin: 0, color: "#ccc" }}>{item.date}</p>
                    </div>

                    <button
                      onClick={() => deleteDietNote(index)}
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

                  <p style={{ marginTop: "12px", whiteSpace: "pre-wrap" }}>
                    {item.notes}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
