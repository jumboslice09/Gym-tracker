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

function safeLoad(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSave(key, value) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function safeRemove(key) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

function AppIcon({ children, size = 20 }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 10,
        height: size + 10,
        fontSize: size,
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");

  const [weight, setWeight] = useState("");
  const [weightDate, setWeightDate] = useState(
    new Date().toISOString().split("T")[0]
  );
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
    setHydrated(true);
  }, []);

  useEffect(() => {
    setActiveTab(safeLoad("fitvault_active_tab", "dashboard"));
    setWeight(safeLoad("fitvault_weight_input", ""));
    setWeightDate(
      safeLoad("fitvault_weight_date", new Date().toISOString().split("T")[0])
    );
    setLiveWorkout(
      safeLoad("fitvault_live_workout", {
        name: "",
        date: new Date().toLocaleDateString(),
        exercises: [],
      })
    );
    setSecondsElapsed(safeLoad("fitvault_seconds_elapsed", 0));
    setTimerRunning(safeLoad("fitvault_timer_running", false));
    setMeasurementForm(
      safeLoad("fitvault_measurement_form", {
        date: new Date().toLocaleDateString(),
        arms: "",
        chest: "",
        waist: "",
        legs: "",
        calves: "",
        shoulders: "",
      })
    );
    setProgressForm(
      safeLoad("fitvault_progress_form", {
        week: "",
        weight: "",
        bench: "",
        squat: "",
        deadlift: "",
        arms: "",
        waist: "",
        physique: "",
      })
    );
    setDietTitle(safeLoad("fitvault_diet_title", ""));
    setDietNotes(safeLoad("fitvault_diet_notes", ""));
  }, []);

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

  useEffect(() => {
    safeSave("fitvault_active_tab", activeTab);
    safeSave("fitvault_weight_input", weight);
    safeSave("fitvault_weight_date", weightDate);
    safeSave("fitvault_live_workout", liveWorkout);
    safeSave("fitvault_seconds_elapsed", secondsElapsed);
    safeSave("fitvault_timer_running", timerRunning);
    safeSave("fitvault_measurement_form", measurementForm);
    safeSave("fitvault_progress_form", progressForm);
    safeSave("fitvault_diet_title", dietTitle);
    safeSave("fitvault_diet_notes", dietNotes);
  }, [
    activeTab,
    weight,
    weightDate,
    liveWorkout,
    secondsElapsed,
    timerRunning,
    measurementForm,
    progressForm,
    dietTitle,
    dietNotes,
  ]);

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
    setIsSignup(false);
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

    setWeight("");
    setWeightDate(new Date().toISOString().split("T")[0]);

    setLiveWorkout({
      name: "",
      date: new Date().toLocaleDateString(),
      exercises: [],
    });

    setMeasurementForm({
      date: new Date().toLocaleDateString(),
      arms: "",
      chest: "",
      waist: "",
      legs: "",
      calves: "",
      shoulders: "",
    });

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

    setDietTitle("");
    setDietNotes("");

    resetWorkoutTimer();

    [
      "fitvault_active_tab",
      "fitvault_weight_input",
      "fitvault_weight_date",
      "fitvault_live_workout",
      "fitvault_seconds_elapsed",
      "fitvault_timer_running",
      "fitvault_measurement_form",
      "fitvault_progress_form",
      "fitvault_diet_title",
      "fitvault_diet_notes",
    ].forEach(safeRemove);
  }

  const weightChartData = useMemo(() => [...log].reverse(), [log]);

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
      date: weightDate,
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
    setWeightDate(new Date().toISOString().split("T")[0]);
    safeRemove("fitvault_weight_input");
    safeRemove("fitvault_weight_date");
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
    if (!liveWorkout.name || !session?.user?.id) {
      alert("Add a workout name first.");
      return;
    }

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

    if (!cleanedExercises.length) {
      alert("Add at least one exercise with a set.");
      return;
    }

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
      duration_seconds: secondsElapsed,
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
    safeRemove("fitvault_live_workout");
    safeRemove("fitvault_seconds_elapsed");
    safeRemove("fitvault_timer_running");
    setActiveTab("workouts");
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
    safeRemove("fitvault_measurement_form");
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
    safeRemove("fitvault_progress_form");
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
    safeRemove("fitvault_diet_title");
    safeRemove("fitvault_diet_notes");
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
  };

  const styles = {
    page: {
      minHeight: "100dvh",
      background:
        "radial-gradient(circle at top, rgba(220,38,38,0.10) 0%, rgba(8,8,8,1) 28%, rgba(5,5,5,1) 100%)",
      color: colors.text,
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      paddingBottom: "92px",
    },
    authWrap: {
      maxWidth: "420px",
      margin: "60px auto",
      padding: "24px",
    },
    authCard: {
      backgroundColor: "#111111",
      border: "1px solid #262626",
      borderRadius: "20px",
      padding: "24px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    },
    authPage: {
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background:
        "radial-gradient(circle at top, rgba(220,38,38,0.18) 0%, rgba(9,9,9,1) 34%, rgba(5,5,5,1) 100%)",
    },
    authOuter: {
      position: "relative",
      width: "100%",
      maxWidth: "460px",
    },
    authGlow1: {
      position: "absolute",
      top: "-50px",
      left: "-40px",
      width: "170px",
      height: "170px",
      borderRadius: "999px",
      background: "rgba(220,38,38,0.20)",
      filter: "blur(50px)",
      pointerEvents: "none",
    },
    authGlow2: {
      position: "absolute",
      bottom: "-60px",
      right: "-30px",
      width: "180px",
      height: "180px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.06)",
      filter: "blur(60px)",
      pointerEvents: "none",
    },
    authCardPro: {
      position: "relative",
      background:
        "linear-gradient(180deg, rgba(17,17,17,0.96) 0%, rgba(11,11,11,0.96) 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "30px",
      padding: "34px",
      boxShadow: "0 24px 80px rgba(0,0,0,0.50)",
      backdropFilter: "blur(16px)",
      overflow: "hidden",
    },
    authLogo: {
      width: "72px",
      height: "72px",
      borderRadius: "22px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 18px auto",
      background: "rgba(220,38,38,0.12)",
      border: "1px solid rgba(220,38,38,0.25)",
      fontSize: "36px",
      boxShadow: "0 12px 30px rgba(220,38,38,0.12)",
    },
    authTitle: {
      margin: 0,
      fontSize: "44px",
      fontWeight: 900,
      letterSpacing: "-0.05em",
      textAlign: "center",
    },
    authSubtitle: {
      margin: "12px 0 26px 0",
      color: "#b5b5b5",
      fontSize: "15px",
      lineHeight: 1.7,
      textAlign: "center",
    },
    authTabs: {
      display: "flex",
      gap: "8px",
      backgroundColor: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "16px",
      padding: "6px",
      marginBottom: "22px",
    },
    authTab: (active) => ({
      flex: 1,
      border: "none",
      borderRadius: "12px",
      padding: "12px 14px",
      fontWeight: 800,
      fontSize: "14px",
      cursor: "pointer",
      background: active
        ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
        : "transparent",
      color: "#fff",
      boxShadow: active ? "0 10px 24px rgba(220,38,38,0.18)" : "none",
    }),
    authPrimaryButton: {
      width: "100%",
      background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
      color: "#fff",
      border: "1px solid rgba(220,38,38,0.30)",
      padding: "14px 18px",
      borderRadius: "14px",
      fontWeight: 800,
      cursor: "pointer",
      fontSize: "15px",
      boxShadow: "0 12px 28px rgba(220,38,38,0.20)",
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
      maxWidth: "1240px",
      margin: "0 auto",
      padding: "18px 18px 0 18px",
    },
    topBar: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: "rgba(5,5,5,0.78)",
      backdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    },
    topBarInner: {
      maxWidth: "1240px",
      margin: "0 auto",
      padding: "12px 18px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },
    brandRow: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    brandIcon: {
      width: "46px",
      height: "46px",
      borderRadius: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(220,38,38,0.14)",
      border: "1px solid rgba(220,38,38,0.25)",
      fontSize: "24px",
      boxShadow: "0 10px 24px rgba(220,38,38,0.12)",
    },
    title: {
      margin: 0,
      fontSize: "34px",
      fontWeight: 900,
      letterSpacing: "-0.04em",
    },
    subtitle: {
      margin: "6px 0 0 0",
      color: "#b4b4b4",
      fontSize: "14px",
      lineHeight: 1.5,
    },
    headerControls: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flexWrap: "wrap",
    },
    badge: {
      background:
        "linear-gradient(135deg, rgba(220,38,38,0.16), rgba(127,29,29,0.22))",
      color: "#fecaca",
      border: "1px solid rgba(220,38,38,0.30)",
      borderRadius: "999px",
      padding: "10px 16px",
      fontSize: "13px",
      fontWeight: 800,
      whiteSpace: "nowrap",
      boxShadow: "0 10px 24px rgba(220,38,38,0.12)",
    },
    desktopNav: {
      display: "flex",
      gap: "10px",
      margin: "18px 0 22px 0",
      flexWrap: "wrap",
      padding: "8px",
      borderRadius: "18px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.05)",
    },
    tabButton: (tab) => ({
      background:
        activeTab === tab
          ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
          : "transparent",
      color: colors.text,
      border:
        activeTab === tab
          ? "1px solid rgba(220,38,38,0.35)"
          : "1px solid transparent",
      padding: "12px 18px",
      borderRadius: "14px",
      fontWeight: 800,
      fontSize: "14px",
      cursor: "pointer",
      boxShadow:
        activeTab === tab ? "0 12px 28px rgba(220,38,38,0.20)" : "none",
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
    }),
    bottomNav: {
      position: "fixed",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 30,
      padding: "10px 14px 14px 14px",
      background:
        "linear-gradient(180deg, rgba(5,5,5,0.05) 0%, rgba(5,5,5,0.85) 20%, rgba(5,5,5,0.98) 100%)",
      backdropFilter: "blur(16px)",
    },
    bottomNavInner: {
      maxWidth: "760px",
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: "8px",
      background: "rgba(17,17,17,0.92)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "22px",
      padding: "8px",
      boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
    },
    bottomTab: (tab) => ({
      border: "none",
      cursor: "pointer",
      borderRadius: "16px",
      padding: "10px 8px",
      background:
        activeTab === tab
          ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
          : "transparent",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      fontSize: "11px",
      fontWeight: 800,
      lineHeight: 1.1,
      minHeight: "62px",
      boxShadow:
        activeTab === tab ? "0 12px 28px rgba(220,38,38,0.22)" : "none",
    }),
    card: {
      background: "rgba(17,17,17,0.94)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "22px",
      padding: "22px",
      marginBottom: "20px",
      boxShadow: "0 14px 36px rgba(0,0,0,0.30)",
      backdropFilter: "blur(10px)",
    },
    sectionTitle: {
      marginTop: 0,
      marginBottom: "14px",
      fontSize: "22px",
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "12px",
    },
    statCard: {
      background:
        "linear-gradient(180deg, rgba(14,14,14,1) 0%, rgba(10,10,10,1) 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "18px",
      padding: "18px",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    },
    statLabel: {
      color: colors.muted,
      fontSize: "13px",
      marginBottom: "8px",
      fontWeight: 700,
    },
    statValue: {
      fontSize: "28px",
      fontWeight: 900,
      letterSpacing: "-0.03em",
    },
    statSub: {
      marginTop: "6px",
      color: colors.muted,
      fontSize: "12px",
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "18px",
    },
    input: {
      padding: "13px 14px",
      borderRadius: "14px",
      border: `1px solid ${colors.border}`,
      backgroundColor: "#0a0a0a",
      color: colors.text,
      width: "100%",
      marginBottom: "12px",
      boxSizing: "border-box",
      fontSize: "15px",
      outline: "none",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
    },
    label: {
      fontSize: "13px",
      color: colors.muted,
      marginBottom: "6px",
      display: "block",
      fontWeight: 700,
    },
    primaryButton: {
      background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
      color: "#fff",
      border: "1px solid rgba(220,38,38,0.30)",
      padding: "12px 18px",
      borderRadius: "14px",
      fontWeight: 800,
      cursor: "pointer",
      fontSize: "14px",
      boxShadow: "0 12px 28px rgba(220,38,38,0.18)",
    },
    secondaryButton: {
      background: "rgba(255,255,255,0.03)",
      color: colors.text,
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "12px 18px",
      borderRadius: "14px",
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
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(11,11,11,0.92)",
      borderRadius: "18px",
      padding: "16px",
      marginBottom: "14px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
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
    },
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
    workoutHeaderStats: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "16px",
    },
    miniBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 12px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(255,255,255,0.03)",
      color: "#ddd",
      fontSize: "12px",
      fontWeight: 700,
    },
  };

  const navItems = [
    { key: "dashboard", label: "Home", icon: "🏠" },
    { key: "weight", label: "Weight", icon: "⚖️" },
    { key: "workouts", label: "Workouts", icon: "🏋️" },
    { key: "measurements", label: "Body", icon: "📏" },
    { key: "progress", label: "Progress", icon: "📈" },
    { key: "diet", label: "Diet", icon: "🍽️" },
  ];

  if (loading || !hydrated) {
    return (
      <div style={styles.page}>
        <div style={styles.authWrap}>
          <div style={styles.authCard}>Loading FitVault...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authOuter}>
          <div style={styles.authGlow1} />
          <div style={styles.authGlow2} />

          <div style={styles.authCardPro}>
            <div style={styles.authLogo}>🏋️</div>

            <h1 style={styles.authTitle}>FitVault</h1>
            <p style={styles.authSubtitle}>
              Store workouts, completed sessions, PRs, bodyweight, measurements,
              and progress in one place.
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
      <div style={styles.topBar}>
        <div style={styles.topBarInner}>
          <div style={styles.brandRow}>
            <div style={styles.brandIcon}>🏋️</div>
            <div>
              <h1 style={styles.title}>FitVault</h1>
              <p style={styles.subtitle}>Welcome back, {session.user.email}</p>
            </div>
          </div>

          <div style={styles.headerControls}>
            <div style={styles.badge}>Goal: 185–190 bulk → 180 lean</div>
            <button onClick={signOut} style={styles.secondaryButton}>
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div style={styles.shell}>
        <div style={styles.desktopNav}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={styles.tabButton(item.key)}
            >
              <AppIcon size={16}>{item.icon}</AppIcon>
              {item.label}
            </button>
          ))}
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
                  <div style={styles.statSub}>Better than daily fluctuations</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Completed Workouts</div>
                  <div style={styles.statValue}>{totalWorkouts}</div>
                  <div style={styles.statSub}>Saved permanently to Supabase</div>
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
                <div style={{ minWidth: "220px", flex: 1 }}>
                  <label style={styles.label}>Bodyweight</label>
                  <input
                    placeholder="Enter weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={{ minWidth: "220px", flex: 1 }}>
                  <label style={styles.label}>Date</label>
                  <input
                    type="date"
                    value={weightDate}
                    onChange={(e) => setWeightDate(e.target.value)}
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

              <div style={styles.workoutHeaderStats}>
                <div style={styles.miniBadge}>
                  <AppIcon size={14}>⏱️</AppIcon>
                  {formatTime(secondsElapsed)}
                </div>
                <div style={styles.miniBadge}>
                  <AppIcon size={14}>💾</AppIcon>
                  Draft auto-saves if you leave the app
                </div>
                <div style={styles.miniBadge}>
                  <AppIcon size={14}>☁️</AppIcon>
                  Completed workouts save permanently
                </div>
              </div>

              <div style={{ ...styles.row, marginBottom: "18px" }}>
                <button onClick={startWorkoutTimer} style={styles.secondaryButton}>
                  Start
                </button>
                <button onClick={pauseWorkoutTimer} style={styles.secondaryButton}>
                  Pause
                </button>
                <button onClick={resetWorkoutTimer} style={styles.secondaryButton}>
                  Reset
                </button>
              </div>

              <label style={styles.label}>Load Saved Workout Template</label>
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
                  Save Completed Workout
                </button>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Completed Workouts</h2>
              {workoutLog.length === 0 ? (
                <div style={styles.empty}>No completed workouts saved yet.</div>
              ) : (
                workoutLog.map((workout) => (
                  <div key={workout.id} style={styles.listCard}>
                    <div style={styles.listHeader}>
                      <div>
                        <h3 style={styles.listTitle}>{workout.name}</h3>
                        <p style={styles.listMeta}>
                          {workout.date || "No date"}
                          {workout.duration_seconds
                            ? ` • ${formatTime(workout.duration_seconds)}`
                            : ""}
                        </p>
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

      <div style={styles.bottomNav}>
        <div style={styles.bottomNavInner}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={styles.bottomTab(item.key)}
            >
              <AppIcon size={18}>{item.icon}</AppIcon>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
