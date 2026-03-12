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
<div style={{fontFamily:"Arial",padding:30}}>

<h1>Gym Tracker</h1>

<h2>Add Bodyweight</h2>

<input
placeholder="weight"
value={weight}
onChange={(e)=>setWeight(e.target.value)}
/>

<button onClick={addWeight}>
Add
</button>

<h2>Logs</h2>

{log.map((item,i)=>(
<div key={i}>
{item.date} — {item.weight}
</div>
))}

</div>
)
}
