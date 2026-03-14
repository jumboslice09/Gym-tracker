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

function persistWeights(entries) {
  safeSave("fitvault_saved_weights", entries);
}

function persistWorkouts(entries) {
  safeSave("fitvault_saved_workouts", entries);
}

function persistWorkoutNames(names) {
  safeSave("fitvault_saved_workout_names", names);
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

const todayISO = () => new Date().toISOString().split("T")[0];

const defaultLiveWorkout = () => ({
  name: "",
  date: new Date().toLocaleDateString(),
  exercises: [],
});

const defaultMeasurementForm = () => ({
  date: new Date().toLocaleDateString(),
  arms: "",
  chest: "",
  waist: "",
  legs: "",
  calves: "",
  shoulders: "",
});

const defaultProgressForm = () => ({
  week: "",
  weight: "",
  bench: "",
  squat: "",
  deadlift: "",
  arms: "",
  waist: "",
  physique: "",
});

const defaultFoodForm = () => ({
  date: todayISO(),
  meal: "Breakfast",
  foodName: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
  waterAmount: "",
});

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");

  const [weight, setWeight] = useState("");
  const [weightDate, setWeightDate] = useState(todayISO());
  const [log, setLog] = useState([]);
  const [weightSynced, setWeightSynced] = useState(false);

  const [workoutLog, setWorkoutLog] = useState([]);
  const [savedWorkoutNames, setSavedWorkoutNames] = useState([]);
  const [workoutSynced, setWorkoutSynced] = useState(false);

  const [liveWorkout, setLiveWorkout] = useState(defaultLiveWorkout());
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const [measurementForm, setMeasurementForm] = useState(
    defaultMeasurementForm()
  );
  const [measurementLog, setMeasurementLog] = useState([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState("arms");

  const [progressForm, setProgressForm] = useState(defaultProgressForm());
  const [progressLog, setProgressLog] = useState([]);

  const [foodForm, setFoodForm] = useState(defaultFoodForm());
  const [foodLog, setFoodLog] = useState([]);
  const [foodLogDate, setFoodLogDate] = useState(todayISO());

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setActiveTab(safeLoad("fitvault_active_tab", "dashboard"));
    setWeight(safeLoad("fitvault_weight_input", ""));
    setWeightDate(safeLoad("fitvault_weight_date", todayISO()));
    setLog(safeLoad("fitvault_saved_weights", []));
    setWorkoutLog(safeLoad("fitvault_saved_workouts", []));
    setSavedWorkoutNames(safeLoad("fitvault_saved_workout_names", []));
    setLiveWorkout(safeLoad("fitvault_live_workout", defaultLiveWorkout()));
    setSecondsElapsed(safeLoad("fitvault_seconds_elapsed", 0));
    setTimerRunning(safeLoad("fitvault_timer_running", false));
    setMeasurementForm(
      safeLoad("fitvault_measurement_form", defaultMeasurementForm())
    );
    setProgressForm(safeLoad("fitvault_progress_form", defaultProgressForm()));
    setFoodForm(safeLoad("fitvault_food_form", defaultFoodForm()));
    setFoodLogDate(safeLoad("fitvault_food_log_date", todayISO()));
    setFoodLog(safeLoad("fitvault_saved_food_log", []));
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
    safeSave("fitvault_food_form", foodForm);
    safeSave("fitvault_food_log_date", foodLogDate);
    safeSave("fitvault_saved_food_log", foodLog);
  }, [
    activeTab,
    weight,
    weightDate,
    liveWorkout,
    secondsElapsed,
    timerRunning,
    measurementForm,
    progressForm,
    foodForm,
    foodLogDate,
    foodLog,
  ]);

  async function fetchAllUserData() {
    const userId = session?.user?.id;
    if (!userId) return;

    const [
      weightsResult,
      workoutsResult,
      measurementsResult,
      progressResult,
      foodResult,
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

    if (!weightsResult.error && weightsResult.data) {
      setLog(weightsResult.data);
      persistWeights(weightsResult.data);
      setWeightSynced(true);
    }

    if (!workoutsResult.error && workoutsResult.data) {
      setWorkoutLog(workoutsResult.data);
      persistWorkouts(workoutsResult.data);

      const names = [
        ...new Set(workoutsResult.data.map((w) => w.name).filter(Boolean)),
      ];
      setSavedWorkoutNames(names);
      persistWorkoutNames(names);
      setWorkoutSynced(true);
    }

    if (!measurementsResult.error && measurementsResult.data) {
      setMeasurementLog(measurementsResult.data);
    }

    if (!progressResult.error && progressResult.data) {
      setProgressLog(progressResult.data);
    }

    if (!foodResult.error && foodResult.data) {
      setFoodLog(foodResult.data);
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
    setFoodLog([]);

    setWeight("");
    setWeightDate(todayISO());

    setLiveWorkout(defaultLiveWorkout());
    setMeasurementForm(defaultMeasurementForm());
    setProgressForm(defaultProgressForm());
    setFoodForm(defaultFoodForm());
    setFoodLogDate(todayISO());

    setWeightSynced(false);
    setWorkoutSynced(false);

    resetWorkoutTimer();

    [
      "fitvault_active_tab",
      "fitvault_weight_input",
      "fitvault_weight_date",
      "fitvault_saved_weights",
      "fitvault_saved_workouts",
      "fitvault_saved_workout_names",
      "fitvault_live_workout",
      "fitvault_seconds_elapsed",
      "fitvault_timer_running",
      "fitvault_measurement_form",
      "fitvault_progress_form",
      "fitvault_food_form",
      "fitvault_food_log_date",
      "fitvault_saved_food_log",
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

    const updatedWeights = [data, ...log];
    setLog(updatedWeights);
    persistWeights(updatedWeights);

    setWeight("");
    setWeightDate(todayISO());
    safeRemove("fitvault_weight_input");
    safeRemove("fitvault_weight_date");
  }

  async function deleteWeightEntry(id) {
    const { error } = await supabase.from("weight_logs").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    const updatedWeights = log.filter((item) => item.id !== id);
    setLog(updatedWeights);
    persistWeights(updatedWeights);
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

    const updatedWorkouts = [data, ...workoutLog];
    setWorkoutLog(updatedWorkouts);
    persistWorkouts(updatedWorkouts);

    if (!savedWorkoutNames.includes(liveWorkout.name)) {
      const updatedNames = [...savedWorkoutNames, liveWorkout.name];
      setSavedWorkoutNames(updatedNames);
      persistWorkoutNames(updatedNames);
    } else {
      persistWorkoutNames(savedWorkoutNames);
    }

    setLiveWorkout(defaultLiveWorkout());
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

    const updatedWorkouts = workoutLog.filter((item) => item.id !== id);
    setWorkoutLog(updatedWorkouts);
    persistWorkouts(updatedWorkouts);

    const updatedNames = [
      ...new Set(updatedWorkouts.map((w) => w.name).filter(Boolean)),
    ];
    setSavedWorkoutNames(updatedNames);
    persistWorkoutNames(updatedNames);
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
    setMeasurementForm(defaultMeasurementForm());
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
    setProgressForm(defaultProgressForm());
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

  async function addFoodEntry() {
    if (!session?.user?.id) return;

    const isWater = foodForm.meal === "Water";

    if (isWater) {
      if (!foodForm.waterAmount) {
        alert("Enter water amount.");
        return;
      }
    } else {
      if (!foodForm.foodName || !foodForm.calories) {
        alert("Enter a food name and calories.");
        return;
      }
    }

    const payload = {
      user_id: session.user.id,
      date: foodForm.date,
      meal: foodForm.meal,
      food_name: isWater ? null : foodForm.foodName,
      calories: isWater ? 0 : Number(foodForm.calories || 0),
      protein: isWater ? 0 : Number(foodForm.protein || 0),
      carbs: isWater ? 0 : Number(foodForm.carbs || 0),
      fats: isWater ? 0 : Number(foodForm.fats || 0),
      water_amount: isWater ? foodForm.waterAmount : null,
      title: null,
      notes: null,
    };

    const { data, error } = await supabase
      .from("diet_logs")
      .insert(payload)
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setFoodLog([data, ...foodLog]);
    setFoodForm((prev) => ({
      ...defaultFoodForm(),
      date: prev.date,
    }));
    safeRemove("fitvault_food_form");
  }

  async function deleteFoodEntry(id) {
    const { error } = await supabase.from("diet_logs").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setFoodLog(foodLog.filter((item) => item.id !== id));
  }

  const foodEntriesForSelectedDate = useMemo(() => {
    return foodLog.filter((item) => item.date === foodLogDate);
  }, [foodLog, foodLogDate]);

  const mealOrder = ["Breakfast", "Lunch", "Dinner", "Snacks", "Water"];

  const groupedFoodEntries = useMemo(() => {
    const grouped = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snacks: [],
      Water: [],
    };

    foodEntriesForSelectedDate.forEach((entry) => {
      const meal = entry.meal || "Snacks";
      if (!grouped[meal]) grouped[meal] = [];
      grouped[meal].push(entry);
    });

    return grouped;
  }, [foodEntriesForSelectedDate]);

  const foodTotals = useMemo(() => {
    return foodEntriesForSelectedDate.reduce(
      (acc, entry) => {
        acc.calories += Number(entry.calories || 0);
        acc.protein += Number(entry.protein || 0);
        acc.carbs += Number(entry.carbs || 0);
        acc.fats += Number(entry.fats || 0);

        if (entry.meal === "Water" && entry.water_amount) {
          const amount = parseFloat(String(entry.water_amount));
          if (!Number.isNaN(amount)) acc.water += amount;
        }

        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 }
    );
  }, [foodEntriesForSelectedDate]);

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
    syncPill: (ok) => ({
      background: ok ? "rgba(22,163,74,0.14)" : "rgba(250,204,21,0.12)",
      color: ok ? "#86efac" : "#fde68a",
      border: ok
        ? "1px solid rgba(22,163,74,0.30)"
        : "1px solid rgba(250,204,21,0.30)",
      borderRadius: "999px",
      padding: "9px 14px",
      fontSize: "12px",
      fontWeight: 800,
      whiteSpace: "nowrap",
    }),
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
      fontWeight: 600,
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
    foodMealCard: {
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(11,11,11,0.92)",
      borderRadius: "18px",
      padding: "16px",
      marginBottom: "14px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
    },
    foodMealHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "10px",
      marginBottom: "12px",
      flexWrap: "wrap",
    },
    foodMealTitle: {
      margin: 0,
      fontSize: "18px",
      fontWeight: 800,
    },
    foodEntryRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      padding: "12px 0",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      flexWrap: "wrap",
    },
    macroPillRow: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginTop: "8px",
    },
    macroPill: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 10px",
      borderRadius: "999px",
      border: "1px solid rgba(255,255,255,0.06)",
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
    { key: "food", label: "Food", icon: "🍽️" },
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
              Store workouts, food, bodyweight, measurements, and progress in
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
            <div style={styles.syncPill(weightSynced)}>
              {weightSynced ? "Weights synced" : "Weights cached"}
            </div>
            <div style={styles.syncPill(workoutSynced)}>
              {workoutSynced ? "Workouts synced" : "Workouts cached"}
            </div>
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
                  <div style={styles.statSub}>Loaded after app restart</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Weigh-Ins Logged</div>
                  <div style={styles.statValue}>{totalWeightEntries}</div>
                  <div style={styles.statSub}>Loaded after app restart</div>
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
              <h2 style={styles.sectionTitle}>Saved Weights</h2>
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
              <h2 style={styles.sectionTitle}>Saved Workouts</h2>
              {workoutLog.length === 0 ? (
                <div style={styles.empty}>No completed workouts saved yet.</div>
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

        {activeTab === "food" && (
          <>
            <div style={styles.card}>
              <div style={styles.listHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Food Log</h2>
                </div>
                <div style={{ minWidth: "220px" }}>
                  <label style={styles.label}>Day</label>
                  <input
                    type="date"
                    value={foodLogDate}
                    onChange={(e) => {
                      setFoodLogDate(e.target.value);
                      setFoodForm((prev) => ({ ...prev, date: e.target.value }));
                    }}
                    style={{ ...styles.input, marginBottom: 0 }}
                  />
                </div>
              </div>

              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Calories</div>
                  <div style={styles.statValue}>{foodTotals.calories}</div>
                  <div style={styles.statSub}>Daily total</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Protein</div>
                  <div style={styles.statValue}>{foodTotals.protein}g</div>
                  <div style={styles.statSub}>Daily total</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Carbs</div>
                  <div style={styles.statValue}>{foodTotals.carbs}g</div>
                  <div style={styles.statSub}>Daily total</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Fats</div>
                  <div style={styles.statValue}>{foodTotals.fats}g</div>
                  <div style={styles.statSub}>Daily total</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Water</div>
                  <div style={styles.statValue}>{foodTotals.water}</div>
                  <div style={styles.statSub}>Total amount logged</div>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Add Food</h2>

              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Meal</label>
                  <select
                    value={foodForm.meal}
                    onChange={(e) =>
                      setFoodForm((prev) => ({
                        ...prev,
                        meal: e.target.value,
                      }))
                    }
                    style={styles.input}
                  >
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Snacks</option>
                    <option>Water</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Date</label>
                  <input
                    type="date"
                    value={foodForm.date}
                    onChange={(e) =>
                      setFoodForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              {foodForm.meal === "Water" ? (
                <div>
                  <label style={styles.label}>Water Amount</label>
                  <input
                    placeholder="Example: 16 oz or 1 bottle"
                    value={foodForm.waterAmount}
                    onChange={(e) =>
                      setFoodForm((prev) => ({
                        ...prev,
                        waterAmount: e.target.value,
                      }))
                    }
                    style={styles.input}
                  />
                </div>
              ) : (
                <>
                  <label style={styles.label}>Food Name</label>
                  <input
                    placeholder="Example: 5 oz grilled chicken"
                    value={foodForm.foodName}
                    onChange={(e) =>
                      setFoodForm((prev) => ({
                        ...prev,
                        foodName: e.target.value,
                      }))
                    }
                    style={styles.input}
                  />

                  <div style={styles.grid2}>
                    <div>
                      <label style={styles.label}>Calories</label>
                      <input
                        placeholder="250"
                        value={foodForm.calories}
                        onChange={(e) =>
                          setFoodForm((prev) => ({
                            ...prev,
                            calories: e.target.value,
                          }))
                        }
                        style={styles.input}
                      />
                    </div>

                    <div>
                      <label style={styles.label}>Protein (g)</label>
                      <input
                        placeholder="46"
                        value={foodForm.protein}
                        onChange={(e) =>
                          setFoodForm((prev) => ({
                            ...prev,
                            protein: e.target.value,
                          }))
                        }
                        style={styles.input}
                      />
                    </div>

                    <div>
                      <label style={styles.label}>Carbs (g)</label>
                      <input
                        placeholder="0"
                        value={foodForm.carbs}
                        onChange={(e) =>
                          setFoodForm((prev) => ({
                            ...prev,
                            carbs: e.target.value,
                          }))
                        }
                        style={styles.input}
                      />
                    </div>

                    <div>
                      <label style={styles.label}>Fats (g)</label>
                      <input
                        placeholder="5"
                        value={foodForm.fats}
                        onChange={(e) =>
                          setFoodForm((prev) => ({
                            ...prev,
                            fats: e.target.value,
                          }))
                        }
                        style={styles.input}
                      />
                    </div>
                  </div>
                </>
              )}

              <button onClick={addFoodEntry} style={styles.primaryButton}>
                Save Food Entry
              </button>
            </div>

            {mealOrder.map((meal) => (
              <div key={meal} style={styles.foodMealCard}>
                <div style={styles.foodMealHeader}>
                  <h3 style={styles.foodMealTitle}>{meal}</h3>
                </div>

                {groupedFoodEntries[meal].length === 0 ? (
                  <div style={styles.empty}>No entries yet.</div>
                ) : (
                  groupedFoodEntries[meal].map((entry) => (
                    <div key={entry.id} style={styles.foodEntryRow}>
                      <div style={{ flex: 1, minWidth: "220px" }}>
                        <div style={{ fontWeight: 800, fontSize: "15px" }}>
                          {meal === "Water"
                            ? entry.water_amount || "Water"
                            : entry.food_name}
                        </div>

                        {meal !== "Water" && (
                          <div style={styles.macroPillRow}>
                            <div style={styles.macroPill}>
                              {Number(entry.calories || 0)} kcal
                            </div>
                            <div style={styles.macroPill}>
                              P {Number(entry.protein || 0)}g
                            </div>
                            <div style={styles.macroPill}>
                              C {Number(entry.carbs || 0)}g
                            </div>
                            <div style={styles.macroPill}>
                              F {Number(entry.fats || 0)}g
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => deleteFoodEntry(entry.id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            ))}
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
