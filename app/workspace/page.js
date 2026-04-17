
"use client";
import { useState } from "react";

export default function Workspace(){
  const [input,setInput]=useState("");
  const [output,setOutput]=useState("");

  const generate = async ()=>{
    const res = await fetch("/api/generate",{method:"POST",body:JSON.stringify({input})});
    const data = await res.json();
    setOutput(data.result);
  }

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",height:"100vh"}}>
      <div>
        <textarea value={input} onChange={e=>setInput(e.target.value)} />
        <button onClick={generate}>Generate</button>
      </div>
      <div>
        <pre>{output}</pre>
      </div>
    </div>
  )
}
