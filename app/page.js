"use client";
import { useState } from "react";

export default function Home() {

const [weight,setWeight]=useState("")
const [log,setLog]=useState([])

function addWeight(){
if(!weight)return
setLog([{date:new Date().toLocaleDateString(),weight},...log])
setWeight("")
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

{log.map((item,i)=>(
<div key={i}>
{item.date} — {item.weight}
</div>
))}

</div>
)
}
