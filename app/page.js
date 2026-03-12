"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

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
        weight: Number(weight)
      }
    ]);

    setWeight("");
  }

  return (
    <div style={{
      background:"#000",
      color:"#fff",
      minHeight:"100vh",
      padding:30,
      fontFamily:"Arial"
    }}>

      <h1 style={{marginBottom:30}}>Gym Tracker</h1>

      <div style={{
        background:"#111",
        padding:20,
        borderRadius:10,
        margin
