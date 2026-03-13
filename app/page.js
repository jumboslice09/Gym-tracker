"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
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
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [weight, setWeight] = useState("");
  const [log, setLog] = useState([]);

  const [workoutLog, setWorkoutLog] = useState([]);
  const [savedWorkoutNames, setSavedWorkoutNames] = useState([]);

  const [liveWorkout, setLiveWorkout] = useState({
    name: "",
    date: new Date().toLocaleDateString(),
    exercises: [],
  });

  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchAllUserData();
  }, [session?.user?.id]);

  useEffect(() => {
    let interval;

    if (timerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerRunning]);

  async function fetchAllUserData() {
    const userId = session?.user?.id;
    if (!userId) return;

    const [
      weightsResult,
      workoutsResult,
      measurementsResult,
      progressResult,
      dietResult,
    ] = await Promise.all([
      supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("measurement_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("progress_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("diet_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (!weightsResult.error && weightsResult.data) setLog(weightsResult.data);

    if (!workoutsResult.error && workoutsResult.data) {
      setWorkoutLog(workoutsResult.data);
      const names = [
        ...new Set(workoutsResult.data.map((w) => w.name).filter(Boolean)),
      ];
      setSavedWorkoutNames(names);
    }

    if (!measurementsResult.error && measurementsResult.data) {
      setMeasurementLog(measurementsResult.data);
    }

    if (!progressResult.error && progressResult.data) {
      setProgressLog(progressResult.data);
    }

    if (!dietResult.error && dietResult.data) {
      setDietLog(dietResult.data);
    }
  }

  async function signUp() {
    if (!authEmail || !authPassword) {
      alert("Enter email and password.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account created. Now log in.");
  }

  async function signIn() {
    if (!authEmail || !authPassword) {
      alert("Enter email and password.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      alert(error.message);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setLog([]);
    setWorkoutLog([]);
    setSavedWorkoutNames([]);
    setMeasurementLog([]);
    setProgressLog([]);
    setDietLog([]);
    setLiveWorkout({
      name: "",
      date: new Date().toLocaleDateString(),
      exercises: [],
    });
    resetWorkoutTimer();
  }

  const weightChartData = useMemo(() => {
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
  const totalWorkouts = workoutLog.length;
  const totalWeightEntries = log.length;

  async function addWeight() {
    if (!weight || !session?.user?.id) return;

    const newEntry = {
      user_id: session.user.id,
      date: new Date().toLocaleDateString(),
      weight: Number(weight),
    };

    const { data, error } = await supabase
      .from("weight_logs")
      .insert(newEntry)
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setLog([data, ...log]);
    setWeight("");
  }

  async function deleteWeightEntry(id) {
    const { error } = await supabase.from("weight_logs").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setLog(log.filter((item) => item.id !== id));
  }

  function formatTime(totalSeconds) {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  }

  function startWorkoutTimer() {
    setTimerRunning(true);
  }

  function pauseWorkoutTimer() {
    setTimerRunning(false);
  }

  function resetWorkoutTimer() {
    setTimerRunning(false);
    setSecondsElapsed(0);
  }

  function updateLiveWorkoutName(value) {
    setLiveWorkout((prev) => ({
      ...prev,
      name: value,
    }));
  }

  function loadSavedWorkoutTemplate(selectedName) {
    updateLiveWorkoutName(selectedName);

    const latestMatch = workoutLog.find((w) => w.name === selectedName);

    if (!latestMatch || !latestMatch.exercises?.length) return;

    const grouped = {};

    latestMatch.exercises.forEach((ex) => {
      if (!grouped[ex.exercise]) grouped[ex.exercise] = [];
      grouped[ex.exercise].push({
        prev: ex.weight && ex.reps ? `${ex.weight} x ${ex.reps}` : "",
        weight: "",
        reps: "",
        done: false,
      });
    });

    const rebuiltExercises = Object.entries(grouped).map(([name, sets]) => ({
      name,
      sets,
    }));

    setLiveWorkout((prev) => ({
      ...prev,
      name: selectedName,
      exercises: rebuiltExercises,
    }));
  }

  function updateExerciseName(exerciseIndex, value) {
    setLiveWorkout((prev) => {
      const updated = [...prev.exercises];
      updated[exerciseIndex].name = value;
      return { ...prev, exercises: updated };
    });
  }

  function addExerciseCard() {
    setLiveWorkout((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          name: "",
          sets: [{ prev: "", weight: "", reps: "", done: false }],
        },
      ],
    }));
  }

  function deleteExerciseCard(exerciseIndex) {
    setLiveWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== exerciseIndex),
    }));
  }

  function addSetToExercise(exerciseIndex) {
    setLiveWorkout((prev) => {
      const updated = [...prev.exercises];
      updated[exerciseIndex].sets.push({
        prev: "",
        weight: "",
        reps: "",
        done: false,
      });
      return { ...prev, exercises: updated };
    });
  }

  function updateSetField(exerciseIndex, setIndex, field, value) {
    setLiveWorkout((prev) => {
      const updated = [...prev.exercises];
      updated[exerciseIndex].sets[setIndex][field] = value;
      return { ...prev, exercises: updated };
    });
  }

  function toggleSetDone(exerciseIndex, setIndex) {
    setLiveWorkout((prev) => {
      const updated = [...prev.exercises];
      updated[exerciseIndex].sets[setIndex].done =
        !updated[exerciseIndex].sets[setIndex].done;
      return { ...prev, exercises: updated };
    });
  }

  async function addWorkout() {
    if (!liveWorkout.name || !session?.user?.id) return;

    const cleanedExercises = liveWorkout.exercises
      .map((exercise) => ({
        exercise: exercise.name,
        sets: exercise.sets
          .filter((set) => set.weight || set.reps || set.prev)
          .map((set) => ({
            prev: set.prev,
            weight: set.weight,
            reps: set.reps,
            done: set.done,
          })),
      }))
      .filter((exercise) => exercise.exercise);

    const formattedForStorage = cleanedExercises.flatMap((exercise) =>
      exercise.sets.map((set) => ({
        exercise: exercise.exercise,
        sets: 1,
        reps: set.reps,
        weight: set.weight,
        prev: set.prev,
        done: set.done,
      }))
    );

    const newWorkout = {
      user_id: session.user.id,
      name: liveWorkout.name,
      date: liveWorkout.date,
      exercises: formattedForStorage,
    };

    const { data, error } = await supabase
      .from("workout_logs")
      .insert(newWorkout)
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setWorkoutLog([data, ...workoutLog]);

    if (!savedWorkoutNames.includes(liveWorkout.name)) {
      setSavedWorkoutNames([...savedWorkoutNames, liveWorkout.name]);
    }

    setLiveWorkout({
      name: "",
      date: new Date().toLocaleDateString(),
      exercises: [],
    });

    resetWorkoutTimer();
  }

  async function deleteWorkout(id) {
    const { error } = await supabase.from("workout_logs").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setWorkoutLog(workoutLog.filter((item) => item.id !== id));
  }

  async function addMeasurement() {
    if (!session?.user?.id) return;

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

    const payload = {
      user_id: session.user.id,
      ...measurementForm,
    };

    const { data, error } = await supabase
      .from("measurement_logs")
      .insert(payload)
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setMeasurementLog([data, ...measurementLog]);

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

  async function deleteMeasurement(id) {
    const { error } = await supabase
      .from("measurement_logs")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setMeasurementLog(measurementLog.filter((item) => item.id !== id));
  }

  async function addProgress() {
    if (!progressForm.week || !session?.user?.id) return;

    const payload = {
      user_id: session.user.id,
      ...progressForm,
    };

    const { data, error } = await supabase
      .from("progress_logs")
      .insert(payload)
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setProgressLog([data, ...progressLog]);

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

  async function deleteProgress(id) {
    const { error } = await supabase
      .from("progress_logs")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setProgressLog(progressLog.filter((item) => item.id !== id));
  }

  async function addDietNote() {
    if (!dietTitle || !session?.user?.id) return;

    const newNote = {
      user_id: session.user.id,
      title: dietTitle,
      notes: dietNotes,
      date: new Date().toLocaleDateString(),
    };

    const { data, error } = await supabase
      .from("diet_logs")
      .insert(newNote)
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setDietLog([data, ...dietLog]);
    setDietTitle("");
    setDietNotes("");
  }

  async function deleteDietNote(id) {
    const { error } = await supabase.from("diet_logs").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setDietLog(dietLog.filter((item) => item.id !== id));
  }

  const colors = {
    bg: "#050505",
    panel: "#111111",
    panel2: "#0b0b0b",
    border: "#262626",
    borderSoft: "#1a1a1a",
    text: "#f5f5f5",
    muted: "#a3a3a3",
    accent: "#dc2626",
    accentDark: "#991b1b",
    green: "#16a34a",
  };

  const styles = {
    page: {
      backgroundColor: colors.bg,
      minHeight: "100vh",
      color: colors.text,
      padding: "24px",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    authWrap: {
      maxWidth: "420px",
      margin: "60px auto",
    },
    authCard: {
      backgroundColor: "#111111",
      border: "1px solid #262626",
      borderRadius: "20px",
      padding: "24px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    },
    authPage: {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background:
    "radial-gradient(circle at top, rgba(220,38,38,0.16) 0%, rgba(5,5,5,1) 32%, rgba(5,5,5,1) 100%)",
},
authOuter: {
  position: "relative",
  width: "100%",
  maxWidth: "460px",
},
authGlow1: {
  position: "absolute",
  top: "-40px",
  left: "-30px",
  width: "140px",
  height: "140px",
  borderRadius: "999px",
  background: "rgba(220,38,38,0.18)",
  filter: "blur(40px)",
},
authGlow2: {
  position: "absolute",
  bottom: "-50px",
  right: "-20px",
  width: "160px",
  height: "160px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.05)",
  filter: "blur(50px)",
},
authCardPro: {
  position: "relative",
  background: "rgba(17,17,17,0.82)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "28px",
  padding: "32px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
  backdropFilter: "blur(14px)",
},
authLogo: {
  width: "64px",
  height: "64px",
  borderRadius: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 18px auto",
  background: "rgba(220,38,38,0.12)",
  border: "1px solid rgba(220,38,38,0.25)",
  fontSize: "30px",
},
authTitle: {
  margin: 0,
  fontSize: "42px",
  fontWeight: 900,
  letterSpacing: "-0.04em",
  textAlign: "center",
},
authSubtitle: {
  margin: "10px 0 24px 0",
  color: colors.muted,
  fontSize: "15px",
  lineHeight: 1.6,
  textAlign: "center",
},
authTabs: {
  display: "flex",
  gap: "8px",
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "16px",
  padding: "6px",
  marginBottom: "20px",
},
authTab: (active) => ({
  flex: 1,
  border: "none",
  borderRadius: "12px",
  padding: "12px 14px",
  fontWeight: 800,
  fontSize: "14px",
  cursor: "pointer",
  backgroundColor: active ? colors.accent : "transparent",
  color: "#fff",
  boxShadow: active ? "0 10px 24px rgba(220,38,38,0.18)" : "none",
}),
authPrimaryButton: {
  width: "100%",
  backgroundColor: colors.accent,
  color: "#fff",
  border: "none",
  padding: "14px 18px",
  borderRadius: "14px",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: "15px",
  boxShadow: "0 10px 24px rgba(220,38,38,0.18)",
  marginTop: "6px",
},
authFooterRow: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "16px",
},
authLink: {
  background: "none",
  border: "none",
  color: "#f87171",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
},
mutedButton: {
  background: "none",
  border: "none",
  color: colors.muted,
  fontSize: "14px",
  cursor: "pointer",
  padding: 0,
    },
    shell: {
      maxWidth: "1200px",
      margin: "0 auto",
    },
    headerCard: {
      background: "linear-gradient(135deg, #111111 0%, #161616 100%)",
      border: `1px solid ${colors.border}`,
      borderRadius: "22px",
      padding: "24px",
      marginBottom: "18px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    },
    headerTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
      flexWrap: "wrap",
    },
    title: {
      margin: 0,
      fontSize: "36px",
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    subtitle: {
      margin: "8px 0 0 0",
      color: colors.muted,
      fontSize: "15px",
      lineHeight: 1.5,
    },
    badge: {
      backgroundColor: "rgba(220, 38, 38, 0.14)",
      color: "#fca5a5",
      border: `1px solid rgba(220, 38, 38, 0.28)`,
      borderRadius: "999px",
      padding: "10px 14px",
      fontSize: "13px",
      fontWeight: 700,
      whiteSpace: "nowrap",
    },
    nav: {
      display: "flex",
      gap: "10px",
      marginBottom: "18px",
      flexWrap: "wrap",
    },
    tabButton: (tab) => ({
      backgroundColor: activeTab === tab ? colors.accent : colors.panel,
      color: colors.text,
      border: `1px solid ${
        activeTab === tab ? colors.accent : colors.border
      }`,
      padding: "12px 16px",
      borderRadius: "12px",
      fontWeight: 700,
      fontSize: "14px",
      cursor: "pointer",
      boxShadow:
        activeTab === tab ? "0 10px 24px rgba(220,38,38,0.18)" : "none",
    }),
    card: {
      backgroundColor: colors.panel,
      border: `1px solid ${colors.border}`,
      borderRadius: "18px",
      padding: "20px",
      marginBottom: "18px",
      boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
    },
    sectionTitle: {
      marginTop: 0,
      marginBottom: "14px",
      fontSize: "22px",
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    sectionSub: {
      marginTop: "-6px",
      marginBottom: "16px",
      color: colors.muted,
      fontSize: "14px",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "12px",
    },
    statCard: {
      backgroundColor: colors.panel2,
      border: `1px solid ${colors.borderSoft}`,
      borderRadius: "16px",
      padding: "16px",
    },
    statLabel: {
      color: colors.muted,
      fontSize: "13px",
      marginBottom: "8px",
      fontWeight: 600,
    },
    statValue: {
      fontSize: "24px",
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    statSub: {
      marginTop: "6px",
      color: colors.muted,
      fontSize: "12px",
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "18px",
    },
    input: {
      padding: "13px 14px",
      borderRadius: "12px",
      border: `1px solid ${colors.border}`,
      backgroundColor: "#0a0a0a",
      color: colors.text,
      width: "100%",
      marginBottom: "12px",
      boxSizing: "border-box",
      fontSize: "15px",
      outline: "none",
    },
    label: {
      fontSize: "13px",
      color: colors.muted,
      marginBottom: "6px",
      display: "block",
      fontWeight: 600,
    },
    primaryButton: {
      backgroundColor: colors.accent,
      color: "#fff",
      border: "none",
      padding: "12px 18px",
      borderRadius: "12px",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: "14px",
      boxShadow: "0 10px 24px rgba(220,38,38,0.18)",
    },
    secondaryButton: {
      backgroundColor: "#161616",
      color: colors.text,
      border: `1px solid ${colors.border}`,
      padding: "12px 18px",
      borderRadius: "12px",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: "14px",
    },
    deleteButton: {
      backgroundColor: "transparent",
      color: "#fca5a5",
      border: `1px solid ${colors.accentDark}`,
      padding: "8px 12px",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 700,
    },
    listCard: {
      border: `1px solid ${colors.borderSoft}`,
      backgroundColor: colors.panel2,
      borderRadius: "16px",
      padding: "16px",
      marginBottom: "12px",
    },
    listHeader: {
      display: "flex",
      justifyContent: "space-between",
      gap: "10px",
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: "10px",
    },
    listTitle: {
      margin: 0,
      fontSize: "18px",
      fontWeight: 800,
    },
    listMeta: {
      margin: "6px 0 0 0",
      color: colors.muted,
      fontSize: "13px",
    },
    row: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      alignItems: "center",
  chartWrap: {
  width: "100%",
  height: "320px",
  marginTop: "8px",
  },
empty: {
  color: colors.muted,
  fontSize: "14px",
  padding: "8px 0",
},
};

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.authWrap}>
          <div style={styles.authCard}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) 
  return (
    <div style={styles.authPage}>
      <div style={styles.authOuter}>
        <div style={styles.authGlow1} />
        <div style={styles.authGlow2} />

        <div style={styles.authCardPro}>
          <div style={styles.authLogo}>🏋️</div>

          <h1 style={styles.authTitle}>Gym Tracker</h1>
          <p style={styles.authSubtitle}>
            Track workouts, PRs, bodyweight, measurements, and progress all in
            one place.
          </p>

          <div style={styles.authTabs}>
            <button
              onClick={() => setIsSignup(false)}
              style={styles.authTab(!isSignup)}
            >
              Log In
            </button>
            <button
              onClick={() => setIsSignup(true)}
              style={styles.authTab(isSignup)}
            >
              Create Account
            </button>
          </div>

          <label style={styles.label}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            style={styles.input}
          />

          <button
            onClick={isSignup ? signUp : signIn}
            style={styles.authPrimaryButton}
          >
            {isSignup ? "Create Account" : "Log In"}
          </button>

          <div style={styles.authFooterRow}>
            <button style={styles.mutedButton}>Forgot password?</button>

            <button
              onClick={() => setIsSignup((prev) => !prev)}
              style={styles.authLink}
            >
              {isSignup ? "Already have an account?" : "Need an account?"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.headerCard}>
          <div style={styles.headerTop}>
            <div>
              <h1 style={styles.title}>Gym Tracker</h1>
              <p style={styles.subtitle}>Logged in as {session.user.email}</p>
            </div>
            <div style={styles.row}>
              <div style={styles.badge}>Goal: 185–190 bulk → 180 lean</div>
              <button onClick={signOut} style={styles.secondaryButton}>
                Log Out
              </button>
            </div>
          </div>
        </div>

        <div style={styles.nav}>
          <button
            onClick={() => setActiveTab("dashboard")}
            style={styles.tabButton("dashboard")}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("weight")}
            style={styles.tabButton("weight")}
          >
            Weight
          </button>
          <button
            onClick={() => setActiveTab("workouts")}
            style={styles.tabButton("workouts")}
          >
            Workouts
          </button>
          <button
            onClick={() => setActiveTab("measurements")}
            style={styles.tabButton("measurements")}
          >
            Measurements
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            style={styles.tabButton("progress")}
          >
            Progress
          </button>
          <button
            onClick={() => setActiveTab("diet")}
            style={styles.tabButton("diet")}
          >
            Diet
          </button>
        </div>

        {activeTab === "dashboard" && (
          <>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Overview</h2>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Current Weight</div>
                  <div style={styles.statValue}>{currentWeight}</div>
                  <div style={styles.statSub}>Latest logged bodyweight</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>7-Day Average</div>
                  <div style={styles.statValue}>{weeklyAverage}</div>
                  <div style={styles.statSub}>Best way to judge your bulk</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Workouts Logged</div>
                  <div style={styles.statValue}>{totalWorkouts}</div>
                  <div style={styles.statSub}>Saved training sessions</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Weigh-Ins Logged</div>
                  <div style={styles.statValue}>{totalWeightEntries}</div>
                  <div style={styles.statSub}>Bodyweight entries saved</div>
                </div>
              </div>
            </div>

            <div style={styles.grid2}>
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Latest Measurements</h2>
                <div style={{ lineHeight: "1.9" }}>
                  <div>Arms: {latestMeasurements.arms || "-"}</div>
                  <div>Chest: {latestMeasurements.chest || "-"}</div>
                  <div>Waist: {latestMeasurements.waist || "-"}</div>
                  <div>Legs: {latestMeasurements.legs || "-"}</div>
                  <div>Calves: {latestMeasurements.calves || "-"}</div>
                  <div>Shoulders: {latestMeasurements.shoulders || "-"}</div>
                </div>
              </div>

              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Latest Progress</h2>
                <div style={{ lineHeight: "1.9" }}>
                  <div>Bench: {latestProgress.bench || "-"}</div>
                  <div>Squat: {latestProgress.squat || "-"}</div>
                  <div>Deadlift: {latestProgress.deadlift || "-"}</div>
                  <div>Arms: {latestProgress.arms || "-"}</div>
                  <div>Waist: {latestProgress.waist || "-"}</div>
                  <div>Physique Notes: {latestProgress.physique || "-"}</div>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Weight Trend</h2>
              <div style={styles.chartWrap}>
                <ResponsiveContainer>
                  <LineChart data={weightChartData}>
                    <CartesianGrid stroke="#1f1f1f" />
                    <XAxis dataKey="date" stroke="#b0b0b0" />
                    <YAxis stroke="#b0b0b0" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111111",
                        border: "1px solid #262626",
                        borderRadius: "12px",
                        color: "#f5f5f5",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#dc2626"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activeTab === "weight" && (
          <>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Log Bodyweight</h2>
              <div style={styles.row}>
                <div style={{ minWidth: "240px", flex: 1 }}>
                  <label style={styles.label}>Bodyweight</label>
                  <input
                    placeholder="Enter weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "end" }}>
                  <button onClick={addWeight} style={styles.primaryButton}>
                    Save Weight
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Weight Chart</h2>
              <div style={styles.chartWrap}>
                <ResponsiveContainer>
                  <LineChart data={weightChartData}>
                    <CartesianGrid stroke="#1f1f1f" />
                    <XAxis dataKey="date" stroke="#b0b0b0" />
                    <YAxis stroke="#b0b0b0" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111111",
                        border: "1px solid #262626",
                        borderRadius: "12px",
                        color: "#f5f5f5",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#dc2626"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Weight History</h2>
              {log.length === 0 ? (
                <div style={styles.empty}>No weight entries yet.</div>
              ) : (
                log.map((item) => (
                  <div key={item.id} style={styles.listCard}>
                    <div style={styles.listHeader}>
                      <div>
                        <h3 style={styles.listTitle}>{item.weight} lbs</h3>
                        <p style={styles.listMeta}>{item.date}</p>
                      </div>
                      <button
                        onClick={() => deleteWeightEntry(item.id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "workouts" && (
          <>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Live Workout</h2>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {formatTime(secondsElapsed)}
                </div>

                <div style={styles.row}>
                  <button
                    onClick={startWorkoutTimer}
                    style={styles.secondaryButton}
                  >
                    Start
                  </button>
                  <button
                    onClick={pauseWorkoutTimer}
                    style={styles.secondaryButton}
                  >
                    Pause
                  </button>
                  <button
                    onClick={resetWorkoutTimer}
                    style={styles.secondaryButton}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <label style={styles.label}>Saved Workout Names</label>
              <select
                value={liveWorkout.name}
                onChange={(e) => loadSavedWorkoutTemplate(e.target.value)}
                style={styles.input}
              >
                <option value="">Select Saved Workout</option>
                {savedWorkoutNames.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              <label style={styles.label}>Workout Name</label>
              <input
                placeholder="Workout Name"
                value={liveWorkout.name}
                onChange={(e) => updateLiveWorkoutName(e.target.value)}
                style={styles.input}
              />

              <label style={styles.label}>Date</label>
              <input
                value={liveWorkout.date}
                onChange={(e) =>
                  setLiveWorkout((prev) => ({ ...prev, date: e.target.value }))
                }
                style={styles.input}
              />

              {liveWorkout.exercises.map((exercise, exerciseIndex) => (
                <div
                  key={exerciseIndex}
                  style={{
                    ...styles.listCard,
                    marginTop: "16px",
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      alignItems: "center",
                      marginBottom: "14px",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      placeholder="Exercise Name"
                      value={exercise.name}
                      onChange={(e) =>
                        updateExerciseName(exerciseIndex, e.target.value)
                      }
                      style={{
                        ...styles.input,
                        marginBottom: 0,
                        flex: 1,
                        minWidth: "220px",
                      }}
                    />

                    <button
                      onClick={() => deleteExerciseCard(exerciseIndex)}
                      style={styles.deleteButton}
                    >
                      Remove
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1.2fr 1fr 1fr 80px",
                      gap: "8px",
                      marginBottom: "10px",
                      color: "#a3a3a3",
                      fontWeight: 700,
                      fontSize: "13px",
                    }}
                  >
                    <div>SET</div>
                    <div>PREV</div>
                    <div>LBS</div>
                    <div>REPS</div>
                    <div>DONE</div>
                  </div>

                  {exercise.sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "60px 1.2fr 1fr 1fr 80px",
                        gap: "8px",
                        marginBottom: "10px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          ...styles.input,
                          marginBottom: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                        }}
                      >
                        {setIndex + 1}
                      </div>

                      <input
                        placeholder="Prev"
                        value={set.prev}
                        onChange={(e) =>
                          updateSetField(
                            exerciseIndex,
                            setIndex,
                            "prev",
                            e.target.value
                          )
                        }
                        style={{ ...styles.input, marginBottom: 0 }}
                      />

                      <input
                        placeholder="Weight"
                        value={set.weight}
                        onChange={(e) =>
                          updateSetField(
                            exerciseIndex,
                            setIndex,
                            "weight",
                            e.target.value
                          )
                        }
                        style={{ ...styles.input, marginBottom: 0 }}
                      />

                      <input
                        placeholder="Reps"
                        value={set.reps}
                        onChange={(e) =>
                          updateSetField(
                            exerciseIndex,
                            setIndex,
                            "reps",
                            e.target.value
                          )
                        }
                        style={{ ...styles.input, marginBottom: 0 }}
                      />

                      <button
                        onClick={() => toggleSetDone(exerciseIndex, setIndex)}
                        style={{
                          ...styles.secondaryButton,
                          backgroundColor: set.done ? "#16a34a" : "#161616",
                          border: set.done
                            ? "1px solid #16a34a"
                            : "1px solid #262626",
                          minHeight: "52px",
                        }}
                      >
                        ✓
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => addSetToExercise(exerciseIndex)}
                    style={{
                      ...styles.secondaryButton,
                      width: "100%",
                      marginTop: "8px",
                    }}
                  >
                    + Add Set
                  </button>
                </div>
              ))}

              <div style={{ ...styles.row, marginTop: "18px" }}>
                <button onClick={addExerciseCard} style={styles.secondaryButton}>
                  Add Exercise
                </button>

                <button onClick={addWorkout} style={styles.primaryButton}>
                  Finish Workout
                </button>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Workout History</h2>
              {workoutLog.length === 0 ? (
                <div style={styles.empty}>No workouts saved yet.</div>
              ) : (
                workoutLog.map((workout) => (
                  <div key={workout.id} style={styles.listCard}>
                    <div style={styles.listHeader}>
                      <div>
                        <h3 style={styles.listTitle}>{workout.name}</h3>
                        <p style={styles.listMeta}>{workout.date || "No date"}</p>
                      </div>
                      <button
                        onClick={() => deleteWorkout(workout.id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>

                    <div style={{ lineHeight: "1.8", fontSize: "14px" }}>
                      {(workout.exercises || []).map((ex, j) => (
                        <div key={j}>
                          {ex.exercise} — {ex.weight} lbs × {ex.reps} reps
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
            <div style={styles.grid2}>
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Body Measurements</h2>

                <label style={styles.label}>Date</label>
                <input
                  placeholder="Date"
                  value={measurementForm.date}
                  onChange={(e) =>
                    setMeasurementForm({
                      ...measurementForm,
                      date: e.target.value,
                    })
                  }
                  style={styles.input}
                />

                <label style={styles.label}>Arms</label>
                <input
                  placeholder="Arms"
                  value={measurementForm.arms}
                  onChange={(e) =>
                    setMeasurementForm({
                      ...measurementForm,
                      arms: e.target.value,
                    })
                  }
                  style={styles.input}
                />

                <label style={styles.label}>Chest</label>
                <input
                  placeholder="Chest"
                  value={measurementForm.chest}
                  onChange={(e) =>
                    setMeasurementForm({
                      ...measurementForm,
                      chest: e.target.value,
                    })
                  }
                  style={styles.input}
                />

                <label style={styles.label}>Waist</label>
                <input
                  placeholder="Waist"
                  value={measurementForm.waist}
                  onChange={(e) =>
                    setMeasurementForm({
                      ...measurementForm,
                      waist: e.target.value,
                    })
                  }
                  style={styles.input}
                />

                <label style={styles.label}>Legs</label>
                <input
                  placeholder="Legs"
                  value={measurementForm.legs}
                  onChange={(e) =>
                    setMeasurementForm({
                      ...measurementForm,
                      legs: e.target.value,
                    })
                  }
                  style={styles.input}
                />

                <label style={styles.label}>Calves</label>
                <input
                  placeholder="Calves"
                  value={measurementForm.calves}
                  onChange={(e) =>
                    setMeasurementForm({
                      ...measurementForm,
                      calves: e.target.value,
                    })
                  }
                  style={styles.input}
                />

                <label style={styles.label}>Shoulders</label>
                <input
                  placeholder="Shoulders"
                  value={measurementForm.shoulders}
                  onChange={(e) =>
                    setMeasurementForm({
                      ...measurementForm,
                      shoulders: e.target.value,
                    })
                  }
                  style={styles.input}
                />

                <button onClick={addMeasurement} style={styles.primaryButton}>
                  Save Measurements
                </button>
              </div>

              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Measurement Chart</h2>
                <label style={styles.label}>Body Part</label>
                <select
                  value={selectedMeasurement}
                  onChange={(e) => setSelectedMeasurement(e.target.value)}
                  style={styles.input}
                >
                  <option value="arms">Arms</option>
                  <option value="chest">Chest</option>
                  <option value="waist">Waist</option>
                  <option value="legs">Legs</option>
                  <option value="calves">Calves</option>
                  <option value="shoulders">Shoulders</option>
                </select>

                <div style={styles.chartWrap}>
                  <ResponsiveContainer>
                    <LineChart data={measurementChartData}>
                      <CartesianGrid stroke="#1f1f1f" />
                      <XAxis dataKey="date" stroke="#b0b0b0" />
                      <YAxis stroke="#b0b0b0" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111111",
                          border: "1px solid #262626",
                          borderRadius: "12px",
                          color: "#f5f5f5",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#dc2626"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Measurement History</h2>
              {measurementLog.length === 0 ? (
                <div style={styles.empty}>No measurements saved yet.</div>
              ) : (
                measurementLog.map((entry) => (
                  <div key={entry.id} style={styles.listCard}>
                    <div style={styles.listHeader}>
                      <div>
                        <h3 style={styles.listTitle}>{entry.date}</h3>
                      </div>
                      <button
                        onClick={() => deleteMeasurement(entry.id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>

                    <div style={{ lineHeight: "1.8", fontSize: "14px" }}>
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
          </>
        )}

        {activeTab === "progress" && (
          <>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Weekly Progress</h2>

              <label style={styles.label}>Week Of</label>
              <input
                placeholder="Week Of"
                value={progressForm.week}
                onChange={(e) =>
                  setProgressForm({ ...progressForm, week: e.target.value })
                }
                style={styles.input}
              />

              <label style={styles.label}>Weight</label>
              <input
                placeholder="Weight"
                value={progressForm.weight}
                onChange={(e) =>
                  setProgressForm({ ...progressForm, weight: e.target.value })
                }
                style={styles.input}
              />

              <label style={styles.label}>Bench</label>
              <input
                placeholder="Bench"
                value={progressForm.bench}
                onChange={(e) =>
                  setProgressForm({ ...progressForm, bench: e.target.value })
                }
                style={styles.input}
              />

              <label style={styles.label}>Squat</label>
              <input
                placeholder="Squat"
                value={progressForm.squat}
                onChange={(e) =>
                  setProgressForm({ ...progressForm, squat: e.target.value })
                }
                style={styles.input}
              />

              <label style={styles.label}>Deadlift</label>
              <input
                placeholder="Deadlift"
                value={progressForm.deadlift}
                onChange={(e) =>
                  setProgressForm({ ...progressForm, deadlift: e.target.value })
                }
                style={styles.input}
              />

              <label style={styles.label}>Arms</label>
              <input
                placeholder="Arms"
                value={progressForm.arms}
                onChange={(e) =>
                  setProgressForm({ ...progressForm, arms: e.target.value })
                }
                style={styles.input}
              />

              <label style={styles.label}>Waist</label>
              <input
                placeholder="Waist"
                value={progressForm.waist}
                onChange={(e) =>
                  setProgressForm({ ...progressForm, waist: e.target.value })
                }
                style={styles.input}
              />

              <label style={styles.label}>Physique Notes</label>
              <textarea
                placeholder="Physique Notes"
                value={progressForm.physique}
                onChange={(e) =>
                  setProgressForm({
                    ...progressForm,
                    physique: e.target.value,
                  })
                }
                style={{
                  ...styles.input,
                  minHeight: "100px",
                  resize: "vertical",
                }}
              />

              <button onClick={addProgress} style={styles.primaryButton}>
                Save Progress
              </button>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Progress History</h2>
              {progressLog.length === 0 ? (
                <div style={styles.empty}>No progress entries yet.</div>
              ) : (
                progressLog.map((entry) => (
                  <div key={entry.id} style={styles.listCard}>
                    <div style={styles.listHeader}>
                      <div>
                        <h3 style={styles.listTitle}>{entry.week}</h3>
                      </div>
                      <button
                        onClick={() => deleteProgress(entry.id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>

                    <div style={{ lineHeight: "1.8", fontSize: "14px" }}>
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
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Diet / Supplements / Notes</h2>

              <label style={styles.label}>Title</label>
              <input
                placeholder="Title"
                value={dietTitle}
                onChange={(e) => setDietTitle(e.target.value)}
                style={styles.input}
              />

              <label style={styles.label}>Notes</label>
              <textarea
                placeholder="Notes"
                value={dietNotes}
                onChange={(e) => setDietNotes(e.target.value)}
                style={{
                  ...styles.input,
                  minHeight: "120px",
                  resize: "vertical",
                }}
              />

              <button onClick={addDietNote} style={styles.primaryButton}>
                Save Note
              </button>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Saved Notes</h2>
              {dietLog.length === 0 ? (
                <div style={styles.empty}>No notes saved yet.</div>
              ) : (
                dietLog.map((item) => (
                  <div key={item.id} style={styles.listCard}>
                    <div style={styles.listHeader}>
                      <div>
                        <h3 style={styles.listTitle}>{item.title}</h3>
                        <p style={styles.listMeta}>{item.date}</p>
                      </div>
                      <button
                        onClick={() => deleteDietNote(item.id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>

                    <p
                      style={{
                        marginTop: "12px",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.7",
                        fontSize: "14px",
                      }}
                    >
                      {item.notes}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
