"use client";
import { useState } from "react";

export default function Home() {

const [weight,setWeight] = useState("");
const [log,setLog] = useState([]);

function addWeight(){
if(!weight) return;

setLog([...log,{
date:new Date().toLocaleDateString(),
weight:Number(weight)
}]);

setWeight("");
}

return (

<div style={{padding:40,fontFamily:"Arial"}}>

<h1>Gym Tracker</h1>

<input
placeholder="Enter weight"
value={weight}
onChange={(e)=>setWeight(e.target.value)}
/>

<button onClick={addWeight}>Add</button>

<h2>Weight Log</h2>

{log.map((item,i)=>(
<div key={i}>
{item.date} — {item.weight}
</div>
))}

<h2>Weight Chart</h2>

<div style={{
display:"flex",
alignItems:"flex-end",
gap:6,
height:200
}}>

{log.map((item,i)=>(
<div
key={i}
style={{
width:20,
height:item.weight,
background:"green"
}}
/>
))}

</div>

</div>
);
}
