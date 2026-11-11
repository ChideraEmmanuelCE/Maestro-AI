"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Float, OrbitControls, Text } from "@react-three/drei";
import { ArrowLeft, AudioLines, Gamepad2, Music2, Pause, Play, Search, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ITEMS, type Item } from "../page";

type Player = { start:(o:{note:number|string;velocity?:number;duration?:number;time?:number})=>unknown; setCC?:(cc:number,value:number)=>void };
const DRUMS=["kick","snare","closed-hi-hat","open-hi-hat","low-tom","mid-tom","high-tom","crash","ride","clap"];
const DRUM_NOTES=[36,38,42,46,45,47,50,49,51,39];
const CHALLENGE=[60,62,64,67,64,62,60,67];
const NAMES=["C","D","E","G","E","D","C","G"];
const BLACK=new Set([1,3,6,8,10]);
const noteLabel=(n:number)=>["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"][n%12]+(Math.floor(n/12)-1);

function StageObject({item,onPlay,activeNote}:{item:Item;onPlay:(n:number)=>void;activeNote:number|null}){
 const kind=item.family;
 const gold="#e8b86b", dark="#171a2e", wood="#865331";
 if(kind==="Keyboard") return <group position={[0,-.15,0]}>
  <mesh position={[0,-.45,0]} castShadow><boxGeometry args={[7,.35,2.05]}/><meshStandardMaterial color={dark} metalness={.4} roughness={.35}/></mesh>
  {Array.from({length:24},(_,i)=>{const n=60+i;return <mesh key={n} position={[-3.15+i*.274,-.23,.02]} onPointerDown={e=>{e.stopPropagation();onPlay(n)}} castShadow><boxGeometry args={[.26,.13,1.7]}/><meshStandardMaterial color={activeNote===n?"#9b8cff":"#f5f1e8"} metalness={.08} roughness={.35}/></mesh>})}
  {Array.from({length:24},(_,i)=>i).filter(i=>BLACK.has((60+i)%12)).map(i=><mesh key={i} position={[-3.15+i*.274+.135,-.12,-.45]} onPointerDown={e=>{e.stopPropagation();onPlay(60+i)}} castShadow><boxGeometry args={[.16,.18,.95]}/><meshStandardMaterial color={activeNote===60+i?"#b29cff":"#171725"}/></mesh>)}
  <mesh position={[0,.08,-.92]}><boxGeometry args={[7,.08,.1]}/><meshStandardMaterial color={gold} metalness={.6}/></mesh>
 </group>;
 if(kind==="Strings") return <group rotation={[0,0,-.1]}>
  <mesh position={[0,0,0]} rotation={[0,0,Math.PI/2]} castShadow><capsuleGeometry args={[.72,.9,8,16]}/><meshStandardMaterial color={wood} roughness={.32}/></mesh>
  <mesh position={[0,0,-.9]} rotation={[0,0,Math.PI/2]}><boxGeometry args={[.36,2.2,.28]}/><meshStandardMaterial color="#4c3025"/></mesh>
  <mesh position={[0,0,-2.1]} rotation={[0,0,Math.PI/2]}><boxGeometry args={[.55,.75,.22]}/><meshStandardMaterial color={wood}/></mesh>
  {Array.from({length:6},(_,i)=><mesh key={i} position={[-.42+i*.168,0,-.55]} onPointerDown={e=>{e.stopPropagation();onPlay(52+i*3)}}><cylinderGeometry args={[.018,.018,3.6,8]}/><meshStandardMaterial color={i===0?gold:"#d9dbe6"} metalness={.8}/></mesh>)}
  {Array.from({length:5},(_,i)=><mesh key={i} position={[0,.04,-1.05-i*.28]} rotation={[0,0,Math.PI/2]}><boxGeometry args={[.07,2.1,.05]}/><meshStandardMaterial color="#b38a58"/></mesh>)}
  <mesh position={[0,.5,.1]}><torusGeometry args={[.33,.035,8,32]}/><meshStandardMaterial color={gold}/></mesh>
 </group>;
 if(kind==="Percussion") return <group>
  <mesh position={[0,-.05,0]} castShadow><cylinderGeometry args={[1.35,1.35,.45,48]}/><meshStandardMaterial color="#272b42" metalness={.45}/></mesh>
  <mesh position={[0,.2,0]}><cylinderGeometry args={[1.29,1.29,.08,48]}/><meshStandardMaterial color="#d9d6ca" roughness={.8}/></mesh>
  {Array.from({length:8},(_,i)=><mesh key={i} position={[Math.cos(i*Math.PI/4)*.82,.32,Math.sin(i*Math.PI/4)*.82]} onPointerDown={e=>{e.stopPropagation();onPlay(DRUM_NOTES[i%DRUM_NOTES.length])}} castShadow><cylinderGeometry args={[.2,.2,.12,24]}/><meshStandardMaterial color={activeNote===DRUM_NOTES[i]?"#ffb96b":i%2?"#7771e8":"#e8a85e"}/></mesh>)}
  <mesh position={[0,1.15,0]} rotation={[0,0,.3]}><cylinderGeometry args={[.035,.055,2.2,10]}/><meshStandardMaterial color={gold}/></mesh>
  <mesh position={[0,1.15,0]} rotation={[0,0,-.3]}><cylinderGeometry args={[.035,.055,2.2,10]}/><meshStandardMaterial color={gold}/></mesh>
 </group>;
 return <group>
  <mesh position={[0,0,0]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.38,.55,3.5,32]}/><meshStandardMaterial color={gold} metalness={.75} roughness={.22}/></mesh>
  <mesh position={[1.85,0,0]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[.48,.055,12,32]}/><meshStandardMaterial color="#d8d9e6" metalness={.8}/></mesh>
  {Array.from({length:6},(_,i)=><mesh key={i} position={[-.95+i*.38,.43,0]} onPointerDown={e=>{e.stopPropagation();onPlay(60+i*2)}} castShadow><cylinderGeometry args={[.12,.12,.12,24]}/><meshStandardMaterial color={activeNote===60+i*2?"#b7a5ff":"#a8b5d3"} metalness={.65}/></mesh>)}
  <mesh position={[-1.85,0,0]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[.28,.045,10,32]}/><meshStandardMaterial color={gold}/></mesh>
 </group>;
}

function Scene({item,onPlay,activeNote}:{item:Item;onPlay:(n:number)=>void;activeNote:number|null}){
 return <Canvas camera={{position:[0,3.8,8.5],fov:42}} shadows dpr={[1,1.7]}>
  <color attach="background" args={["#111326"]}/>
  <fog attach="fog" args={["#111326",10,24]}/>
  <ambientLight intensity={1.1}/>
  <spotLight position={[2,8,5]} angle={.55} penumbra={.6} intensity={85} castShadow color="#b9a9ff"/>
  <pointLight position={[-5,2,-2]} intensity={35} color="#ffb76b"/>
  <Environment preset="city"/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.25,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#191b31" metalness={.25} roughness={.8}/></mesh>
  <gridHelper args={[30,30,"#39345f","#242641"]} position={[0,-1.23,0]}/>
  <Float speed={1.2} rotationIntensity={.12} floatIntensity={.18}><group position={[0,.25,0]}><StageObject item={item} onPlay={onPlay} activeNote={activeNote}/></group></Float>
  <Text position={[0,2.45,-.1]} fontSize={.25} color="#eeeafc" anchorX="center">{item.name.toUpperCase()}</Text>
  <Text position={[0,2.08,-.1]} fontSize={.11} color="#a8a3ca" anchorX="center">TAP THE 3D INSTRUMENT TO PLAY</Text>
  <OrbitControls enablePan={false} minDistance={5} maxDistance={12} maxPolarAngle={Math.PI/2.05}/>
 </Canvas>;
}

export default function InstrumentGamePage(){
 const router=useRouter();
 const [selected,setSelected]=useState("grand");
 const [filter,setFilter]=useState("All");
 const [search,setSearch]=useState("");
 const [velocity,setVelocity]=useState(96);
 const [volume,setVolume]=useState(80);
 const [activeNote,setActiveNote]=useState<number|null>(null);
 const [status,setStatus]=useState("Choose an instrument, then tap its 3D controls.");
 const [loading,setLoading]=useState(false);
 const [challenge,setChallenge]=useState(false);
 const [step,setStep]=useState(0);
 const [score,setScore]=useState(0);
 const [miss,setMiss]=useState(0);
 const audio=useRef<AudioContext|null>(null);
 const players=useRef<Record<string,Player>>({});
 const item=ITEMS.find(x=>x.id===selected)||ITEMS[0];
 const families=useMemo(()=>["All","Keyboard","Strings","Brass","Woodwinds","Percussion","World"],[]);
 const filtered=useMemo(()=>ITEMS.filter(x=>(filter==="All"||x.family===filter)&&x.name.toLowerCase().includes(search.toLowerCase())),[filter,search]);
 async function getPlayer(){
  if(!audio.current) audio.current=new AudioContext();
  await audio.current.resume();
  if(players.current[item.id])return players.current[item.id];
  setLoading(true);
  try{
   const lib=await import("smplr");
   const p=(item.id==="grand"?lib.SplendidGrandPiano(audio.current):item.id==="drumkit"?lib.DrumMachine(audio.current,{instrument:"TR-808"}):lib.Soundfont(audio.current,{instrument:item.soundfont})) as unknown as Player;
   if(p.output) p.output.volume=volume/100;
   players.current[item.id]=p;setStatus(item.name+" sound is ready.");return p;
  }finally{setLoading(false);}
 }
 async function play(note:number){
  try{
   const p=await getPlayer();
   if(item.id==="drumkit"){const names=["kick","snare","closed-hi-hat","open-hi-hat","low-tom","mid-tom","high-tom","crash","ride","clap"];p.start({note:names[DRUM_NOTES.indexOf(note)]||"kick",velocity});}
   else p.start({note,velocity,duration:.65});
   setActiveNote(note);setStatus(item.name+" · "+noteLabel(note));
   if(challenge){
    if(note===CHALLENGE[step]){setScore(s=>s+100);setStep(s=>s+1);if(step===CHALLENGE.length-1){setChallenge(false);setStatus("Challenge complete! Perfect run.");}}
    else setMiss(m=>m+1);
   }
  }catch{setStatus("Sound could not load. Check your connection and tap again.");}
 }
 function startChallenge(){setChallenge(true);setStep(0);setScore(0);setMiss(0);setStatus("Follow the glowing note sequence. Play the right notes to score.");}
 const notes=Array.from({length:12},(_,i)=>60+i);
 return <main className="game-shell">
  <header className="game-top"><button onClick={()=>router.push("/instruments")}><ArrowLeft size={16}/> Instrument library</button><span><AudioLines size={15}/> MAESTRO · 3D PLAY ROOM</span><span className="live-dot">AUDIO READY</span></header>
  <section className="game-heading"><div><span className="eyebrow">THE INTERACTIVE MUSIC ARCADE</span><h1>Play music.<br/><em>Enter the stage.</em></h1><p>Pick any instrument, explore its 3D controls and play it with real sampled sound. Use touch, mouse or your keyboard.</p></div><div className="game-stats"><div><b>{ITEMS.length}</b><span>instruments</span></div><div><b>3D</b><span>playable stage</span></div><div><b>{score}</b><span>practice points</span></div></div></section>
  <section className="game-layout">
   <aside className="game-library"><div className="game-search"><Search size={15}/><input placeholder="Search instruments" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="game-filters">{families.map(f=><button key={f} className={filter===f?"active":""} onClick={()=>setFilter(f)}>{f}</button>)}</div><div className="game-items">{filtered.map(x=><button key={x.id} onClick={()=>{setSelected(x.id);setActiveNote(null);setStatus("Selected "+x.name+". Tap the stage to play.");}} className={selected===x.id?"selected":""}><span>{x.icon}</span><div><b>{x.name}</b><small>{x.family}</small></div><i>›</i></button>)}</div></aside>
   <div className="game-main">
    <div className="stage-wrap"><div className="stage-label"><span>LIVE 3D STAGE</span><span>DRAG TO ROTATE · SCROLL TO ZOOM</span></div><div className="stage-canvas"><Suspense fallback={<div className="stage-loading">Building your stage…</div>}><Scene item={item} onPlay={play} activeNote={activeNote}/></Suspense></div><div className="stage-caption"><div><span>{item.icon}</span><div><b>{item.name}</b><small>{item.technique}</small></div></div><span className="sound-indicator"><i/>{loading?"Loading samples":status}</span></div></div>
    <div className="play-console"><div className="console-head"><div><span className="eyebrow">PLAY CONSOLE</span><h2>Make some noise.</h2></div><div className="console-actions"><button onClick={startChallenge}><Gamepad2 size={15}/> {challenge?"Restart game":"Start rhythm game"}</button><button className="volume-button" onClick={()=>{const p=players.current[item.id];if(p?.output)p.output.volume=volume/100;}}><Volume2 size={15}/></button></div></div>
     {challenge&&<div className="challenge-bar"><div><b>NOTE RUN</b><span>Play this melody in order</span></div><div className="sequence">{NAMES.map((n,i)=><span key={i} className={i<step?"done":i===step?"next":""}>{n}</span>)}</div><strong>{score} PTS</strong><button onClick={()=>setChallenge(false)}><Pause size={14}/></button></div>}
     <div className="touch-keys">{notes.map(n=><button key={n} onPointerDown={()=>void play(n)} className={activeNote===n?"pressed":""}><span>{noteLabel(n).replace(/[0-9]/g,"")}</span><small>{n}</small></button>)}</div>
     {item.id==="drumkit"&&<div className="drum-controls">{DRUMS.map((d,i)=><button key={d} onClick={()=>void play(DRUM_NOTES[i])}>{d.replaceAll("-"," ")}</button>)}</div>}
     <div className="console-bottom"><label>Touch strength <b>{velocity}</b><input type="range" min="20" max="127" value={velocity} onChange={e=>setVelocity(Number(e.target.value))}/></label><label>Volume <b>{volume}%</b><input type="range" min="0" max="100" value={volume} onChange={e=>{setVolume(Number(e.target.value));const p=players.current[item.id];if(p?.output)p.output.volume=Number(e.target.value)/100;}}/></label><span>{miss} missed notes</span></div>
    </div>
   </div>
  </section>
  <footer className="game-footer"><span>MAESTRO AI · LEARN BY PLAYING</span><span>First sound loads on your first tap. Internet is required for sample downloads.</span></footer>
  <style jsx global>{`
   .game-shell{min-height:100vh;background:#0d1020;color:#f2f0ff;padding:0 clamp(12px,3vw,42px) 32px;font-family:Arial,sans-serif}.game-top{height:65px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff18;color:#aaa8c4;font-size:10px;letter-spacing:1.5px}.game-top>span:nth-child(2){display:flex;gap:8px;align-items:center}.game-top button{display:flex;align-items:center;gap:7px;background:#ffffff0b;border:1px solid #ffffff20;color:#e9e6ff;border-radius:9px;padding:10px 12px;font-size:11px}.live-dot{color:#8be1b2;font-size:9px}.game-heading{display:flex;justify-content:space-between;align-items:end;gap:24px;padding:38px 0 25px}.eyebrow{font-size:9px;letter-spacing:2px;font-weight:800;color:#a99cff}.game-heading h1{font-size:clamp(36px,5vw,57px);line-height:.98;letter-spacing:-2.8px;margin:12px 0}.game-heading h1 em{font-style:normal;color:#a99cff}.game-heading p{max-width:570px;color:#aaa9c2;font-size:13px;line-height:1.7;margin:0}.game-stats{display:flex;gap:24px;padding-bottom:4px}.game-stats div{display:grid;gap:5px}.game-stats b{font-size:23px;color:#c4baff}.game-stats span{font-size:9px;color:#9997b1}.game-layout{display:grid;grid-template-columns:250px minmax(0,1fr);gap:16px;align-items:start}.game-library{background:#171a2e;border:1px solid #ffffff16;border-radius:15px;padding:12px;max-height:calc(100vh - 100px);position:sticky;top:10px;display:flex;flex-direction:column}.game-search{display:flex;align-items:center;gap:8px;padding:10px;background:#0f1223;border:1px solid #ffffff16;border-radius:9px;color:#aaa8c4}.game-search input{min-width:0;width:100%;border:0;outline:0;background:transparent;color:white;font-size:11px}.game-filters{display:flex;gap:5px;flex-wrap:wrap;padding:12px 0}.game-filters button{border:1px solid #ffffff1b;background:transparent;color:#aaa8c4;border-radius:20px;padding:6px 8px;font-size:9px}.game-filters button.active{background:#8173e8;color:white;border-color:#8173e8}.game-items{overflow:auto;display:grid;gap:5px;padding-right:3px}.game-items button{display:flex;align-items:center;gap:9px;text-align:left;padding:9px;border:1px solid transparent;border-radius:9px;background:transparent;color:#f2f0ff}.game-items button.selected{background:#8274e81b;border-color:#8779ec88}.game-items button>span{font-size:20px}.game-items button div{display:grid;gap:3px;min-width:0}.game-items b{font-size:10px}.game-items small{font-size:9px;color:#9694af}.game-items i{margin-left:auto;font-style:normal;color:#8f83ee}.game-main{min-width:0;display:grid;gap:14px}.stage-wrap{background:#171a2e;border:1px solid #ffffff16;border-radius:16px;overflow:hidden}.stage-label{display:flex;justify-content:space-between;padding:13px 16px;color:#aaa8c4;font-size:9px;letter-spacing:1.4px}.stage-canvas{height:410px;touch-action:pan-y}.stage-loading{height:100%;display:grid;place-items:center;color:#bdb6e8;font-size:12px}.stage-caption{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid #ffffff14}.stage-caption>div{display:flex;align-items:center;gap:10px;min-width:0}.stage-caption>div>span{font-size:25px}.stage-caption>div div{display:grid;gap:4px}.stage-caption b{font-size:11px}.stage-caption small{font-size:9px;color:#aaa8c4;max-width:450px;line-height:1.4}.sound-indicator{font-size:9px;color:#aaa8c4;white-space:nowrap;max-width:45%;overflow:hidden;text-overflow:ellipsis}.sound-indicator i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#74d9a4;margin-right:6px}.play-console{background:#171a2e;border:1px solid #ffffff16;border-radius:16px;padding:16px}.console-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.console-head h2{font-size:19px;margin:6px 0 0}.console-actions{display:flex;gap:7px}.console-actions button{display:flex;align-items:center;gap:7px;background:#8173e8;border:0;border-radius:9px;padding:10px 12px;color:white;font-size:10px;font-weight:700}.console-actions .volume-button{background:#252943;border:1px solid #ffffff20}.touch-keys{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:5px;margin:18px 0}.touch-keys button{height:90px;border:1px solid #d5d1e4;border-radius:0 0 7px 7px;background:linear-gradient(#fff,#e9e7f2);color:#27243d;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;padding:8px 2px}.touch-keys button:nth-child(2),.touch-keys button:nth-child(4),.touch-keys button:nth-child(7),.touch-keys button:nth-child(9),.touch-keys button:nth-child(11){background:linear-gradient(#454258,#171625);color:white;border-color:#090914;height:72px}.touch-keys button.pressed{background:#a99cff;color:#171326}.touch-keys span{font-size:10px;font-weight:700}.touch-keys small{font-size:8px;opacity:.6}.console-bottom{display:flex;align-items:center;gap:22px;flex-wrap:wrap;padding-top:12px;border-top:1px solid #ffffff14}.console-bottom label{display:grid;gap:6px;color:#aaa8c4;font-size:9px;min-width:130px}.console-bottom label b{color:white}.console-bottom input{accent-color:#9e90ff;width:145px}.console-bottom>span{font-size:9px;color:#aaa8c4}.challenge-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 12px;margin-top:14px;background:#282443;border:1px solid #8779ec66;border-radius:10px}.challenge-bar>div:first-child{display:grid;gap:3px}.challenge-bar b{font-size:9px;color:#c6bcff}.challenge-bar span{font-size:9px;color:#aaa8c4}.sequence{display:flex;gap:5px;margin-left:auto}.sequence span{padding:6px 9px;border-radius:6px;background:#171a2e;color:#aaa8c4;font-size:10px}.sequence span.done{background:#2d7758;color:#d9ffec}.sequence span.next{background:#8779ec;color:white}.challenge-bar strong{font-size:10px;color:#c6bcff}.challenge-bar>button{background:transparent;border:0;color:#c6bcff}.drum-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-bottom:15px}.drum-controls button{background:#282943;border:1px solid #ffffff20;color:#eeeaff;padding:12px 5px;border-radius:8px;font-size:9px;text-transform:capitalize}.game-footer{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:20px 0;color:#77758f;font-size:9px;letter-spacing:.6px}
   @media(max-width:900px){.game-layout{grid-template-columns:1fr}.game-library{position:static;max-height:360px}.game-items{grid-template-columns:repeat(2,minmax(0,1fr));max-height:190px}.game-heading{align-items:flex-start;flex-direction:column}.game-stats{padding:0}.stage-canvas{height:350px}}
   @media(max-width:560px){.game-top>span:nth-child(2){display:none}.game-heading{padding:27px 0 20px}.game-stats{gap:17px}.stage-canvas{height:300px}.stage-caption{align-items:flex-start;flex-direction:column}.sound-indicator{max-width:100%}.touch-keys{grid-template-columns:repeat(6,minmax(0,1fr))}.touch-keys button{height:75px}.touch-keys button:nth-child(2),.touch-keys button:nth-child(4),.touch-keys button:nth-child(7),.touch-keys button:nth-child(9),.touch-keys button:nth-child(11){height:65px}.console-head{align-items:flex-start;flex-direction:column}.sequence{margin-left:0}.drum-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.game-footer{font-size:8px}}
  `}</style>
 </main>;
}
