"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Volume2, Music2, Gamepad2, Piano, Guitar, Drum, Wind, Waves, Play, Square, Hand, SlidersHorizontal } from "lucide-react";

import { ITEMS, type Item, type Family } from "./catalogue";
const FAMILIES:("All"|Family)[]=["All","Keyboard","Strings","Brass","Woodwinds","Percussion","World"];
const NOTES=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const noteName=(n:number)=>NOTES[(n%12+12)%12]+(Math.floor(n/12)-1);
const midiToName=(n:number)=>noteName(n);
type Player={start:(o:{note:number|string;velocity?:number;duration?:number;time?:number})=>()=>void;stop:(note?:number|string)=>void;dispose?:()=>void;output?:{volume:number};setCC?:(cc:number,value:number)=>void};
export default function InstrumentsPage(){
 const router=useRouter();
 const [family,setFamily]=useState<"All"|Family>("All");
 const [query,setQuery]=useState("");
 const [selected,setSelected]=useState("grand");
 const [octave,setOctave]=useState(4);
 const [velocity,setVelocity]=useState(86);
 const [duration,setDuration]=useState(0.65);
 const [sustain,setSustain]=useState(false);
 const [vibrato,setVibrato]=useState(false);
 const [message,setMessage]=useState("Tap a key or pad to hear a sampled instrument.");
 const [loading,setLoading]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const [mode,setMode]=useState<"keys"|"fretboard"|"pads">("keys");
 const [searchMode,setSearchMode]=useState(false);
 const contextRef=useRef<AudioContext|null>(null);
 const players=useRef<Record<string,Player>>({});
 const current=ITEMS.find(x=>x.id===selected)||ITEMS[0];
 const visible=useMemo(()=>ITEMS.filter(x=>(family==="All"||x.family===family)&&(x.name.toLowerCase().includes(query.toLowerCase())||x.family.toLowerCase().includes(query.toLowerCase()))),[family,query]);
 const notes=useMemo(()=>Array.from({length:25},(_,i)=>(octave+1)*12+i),[octave]);
 const black=new Set([1,3,6,8,10]);
 async function getPlayer(item:Item){
   if(!contextRef.current) contextRef.current=new AudioContext();
   const ctx=contextRef.current;
   await ctx.resume();
   if(players.current[item.id]) return players.current[item.id];
   setLoading(true);
   try{
    const lib=await import("smplr");
    let player:Player;
    if(item.id==="grand") player=lib.SplendidGrandPiano(ctx) as unknown as Player;
    else player=lib.Soundfont(ctx,{instrument:item.soundfont}) as unknown as Player;
    players.current[item.id]=player;
    setLoaded(true);
    setMessage(item.name+" samples loaded. Ready to play.");
    return player;
   } finally {setLoading(false);}
 }
 async function playNote(midi:number){
   try{
    const p=await getPlayer(current);
    p.start({note:midi,velocity,duration});
    if(sustain)p.setCC?.(64,127);
    setMessage(current.name+" · "+midiToName(midi)+" · velocity "+velocity);
   }catch(e){setMessage("Could not load this sound. Check your connection and tap again.");}
 }
 async function playPad(note:number){await playNote(note);}
 async function playDrum(note:string){try{const p=await getPlayer(current);p.start({note,velocity});setMessage("Drum hit · "+note);}catch{setMessage("Could not load the drum samples. Tap again.");}}
 async function changeInstrument(item:Item){
   setSelected(item.id);setMessage("Selected "+item.name+". Tap a note to load its recorded sound.");setLoaded(Boolean(players.current[item.id]));
   if(item.family==="Strings" && /guitar|bass|banjo|sitar|shamisen|koto/.test(item.name.toLowerCase()))setMode("fretboard");
   else if(item.family==="Percussion")setMode("pads");else setMode("keys");
 }
 async function playChord(){
  const root=60;const p=await getPlayer(current);
  [root,root+4,root+7].forEach((n,i)=>p.start({note:n,velocity,duration:1.25}));
  setMessage("C major chord · "+current.name);
 }
 async function playScale(){
  const p=await getPlayer(current);const startAt=(contextRef.current?.currentTime||0)+0.12;[0,2,4,5,7,9,11,12].forEach((v,i)=>p.start({note:60+v,velocity,duration:.32,time:startAt+i*.38}));
  setMessage("C major scale · "+current.name);
 }
 function pedal(on:boolean){setSustain(on);const p=players.current[current.id];p?.setCC?.(64,on?127:0);}
 const fretNotes=[40,45,50,55,59,64];
 return <main className="instrument-studio">
 <header className="studio-header"><button onClick={()=>router.push("/")}><ArrowLeft size={17}/> Back to Maestro</button><button onClick={()=>router.push("/instruments/game")}><Gamepad2 size={15}/> 3D Play Room</button></header>
 <section className="studio-intro"><span>EXPLORE · PLAY · LEARN</span><h1>Meet the sound<br/><em>of music.</em></h1><p>Explore a growing collection of sampled instruments. Learn how each family is played, hear its real sampled tone and practise notes, chords and rhythms.</p><div className="library-stats"><b>{ITEMS.length} instruments</b><span>6 instrument families</span><span>Sample-based audio</span></div></section>
 <section className="library-layout">
  <aside className="library-sidebar"><div className="library-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find an instrument..."/></div><div className="family-list">{FAMILIES.map(f=><button key={f} className={family===f?"chosen":""} onClick={()=>setFamily(f)}>{f}<span>{f==="All"?ITEMS.length:ITEMS.filter(x=>x.family===f).length}</span></button>)}</div></aside>
  <div className="library-main"><div className="instrument-grid">{visible.map(item=><button key={item.id} onClick={()=>void changeInstrument(item)} className={"instrument-card "+(selected===item.id?"selected":"")}><span className="instrument-emoji">{item.icon}</span><span><b>{item.name}</b><small>{item.family}</small></span><span className="card-play">›</span></button>)}</div></div>
 </section>
 <section className="instrument-workbench">
  <div className="workbench-heading"><div><span>NOW IN THE PRACTICE ROOM</span><h2>{current.icon} {current.name}</h2><p>{current.technique}</p></div><span className="audio-status"><i/>{loading?"Loading samples…":loaded?"Samples loaded":"Tap to load samples"}</span></div>
  <div className="practice-controls"><label>Touch strength <b>{velocity}</b><input type="range" min="25" max="127" value={velocity} onChange={e=>setVelocity(Number(e.target.value))}/></label><label>Note length <b>{duration.toFixed(1)}s</b><input type="range" min=".15" max="2.5" step=".05" value={duration} onChange={e=>setDuration(Number(e.target.value))}/></label><button className={sustain?"toggle on":"toggle"} onClick={()=>pedal(!sustain)}>Sustain pedal {sustain?"ON":"OFF"}</button><button className={vibrato?"toggle on":"toggle"} onClick={()=>setVibrato(!vibrato)}>Vibrato {vibrato?"ON":"OFF"}</button></div>
  {mode==="keys"&&<><div className="octave-control"><button onClick={()=>setOctave(v=>Math.max(1,v-1))}>−</button><b>Keyboard · {noteName(notes[0])} – {noteName(notes[24])}</b><button onClick={()=>setOctave(v=>Math.min(7,v+1))}>+</button></div><div className="studio-keyboard"><div className="studio-white-keys">{notes.filter(n=>!black.has(n%12)).map(n=><button key={n} onPointerDown={()=>void playNote(n)} aria-label={"Play "+noteName(n)}><span>{noteName(n)}</span></button>)}</div><div className="studio-black-keys">{notes.filter(n=>black.has(n%12)).map(n=><button key={n} style={{left:((notes.filter(w=>!black.has(w%12)&&w<n).length-.32)/notes.filter(w=>!black.has(w%12)).length*100)+"%"}} onPointerDown={()=>void playNote(n)} aria-label={"Play "+noteName(n)}><span>{noteName(n)}</span></button>)}</div></div></>}
  {mode==="fretboard"&&<div className="fretboard"><div className="fret-labels"><b>STRING</b>{Array.from({length:13},(_,i)=><span key={i}>{i===0?"OPEN":i}</span>)}</div>{fretNotes.map((base,i)=><div className="fret-row" key={base}><b>{["E2","A2","D3","G3","B3","E4"][i]}</b>{Array.from({length:13},(_,f)=><button key={f} onClick={()=>void playNote(base+f)}>{noteName(base+f)}</button>)}</div>)}</div>}
  {mode==="pads"&&<div className={current.id==="drumkit"?"drum-pad-grid":"note-pad"}>{current.id==="drumkit"?["kick","snare","closed-hi-hat","open-hi-hat","low-tom","mid-tom","high-tom","crash","ride","clap"].map(n=><button key={n} onClick={()=>void playDrum(n)}>{n.replaceAll("-"," ")}</button>):Array.from({length:16},(_,i)=>current.range[0]+i*2).filter(n=>n<=current.range[1]).map(n=><button key={n} onClick={()=>void playPad(n)}>{noteName(n)}</button>)}</div>}
  <div className="practice-actions"><button onClick={()=>void playChord()}><Play size={15}/> Play C major chord</button><button onClick={()=>void playScale()}><Music2 size={15}/> Hear C major scale</button><span>{message}</span></div>
 </section>
 <footer className="studio-footer"><span><Volume2 size={15}/> Sampled General MIDI instruments · Web Audio</span><span>First sound may take a moment to download; samples are cached by the browser.</span></footer>
 <style jsx global>{`
 .instrument-studio{min-height:100vh;background:#f5f3ee;color:#24233a;padding:0 clamp(14px,4vw,60px) 50px;font-family:Arial,sans-serif}
 .studio-header{height:68px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e3e0d9;color:#777687;font-size:10px;letter-spacing:1.4px;font-weight:700}.studio-header button{display:flex;align-items:center;gap:8px;border:1px solid #ddd9d0;background:white;border-radius:10px;padding:10px 13px;color:#333146;font-size:12px;letter-spacing:0}
 .studio-intro{padding:42px 0 24px}.studio-intro>span,.workbench-heading>div>span{font-size:10px;letter-spacing:1.8px;font-weight:800;color:#7772bb}.studio-intro h1{font-size:clamp(38px,5.5vw,62px);line-height:1.02;letter-spacing:-3px;margin:13px 0}.studio-intro h1 em{font-style:normal;color:#5147d9}.studio-intro p{max-width:650px;color:#777887;line-height:1.7;font-size:14px}.library-stats{display:flex;gap:18px;flex-wrap:wrap;font-size:11px;color:#777887;margin-top:20px}.library-stats b{color:#5147d9}
 .library-layout{display:grid;grid-template-columns:205px 1fr;gap:16px;align-items:start;margin:20px 0 24px}.library-sidebar{background:white;border:1px solid #e5e2db;border-radius:16px;padding:12px;position:sticky;top:12px}.library-search{display:flex;align-items:center;gap:8px;border:1px solid #e3e0e8;border-radius:9px;padding:9px;color:#888}.library-search input{width:100%;border:0;outline:0;font-size:11px}.family-list{display:grid;gap:4px;margin-top:12px}.family-list button{display:flex;justify-content:space-between;align-items:center;border:0;background:transparent;text-align:left;padding:10px;border-radius:8px;color:#5c5a6b;font-size:12px}.family-list button.chosen{background:#f0efff;color:#5147d9;font-weight:700}.family-list span{font-size:10px;color:#9896a3}
 .instrument-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.instrument-card{display:flex;align-items:center;gap:10px;min-width:0;padding:11px;border:1px solid #e4e1da;background:#fff;border-radius:12px;text-align:left;color:#3f3d52}.instrument-card.selected{border:2px solid #5147d9;background:#f2f0ff;padding:10px}.instrument-emoji{font-size:24px}.instrument-card>span:nth-child(2){display:grid;gap:4px;min-width:0}.instrument-card b{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.instrument-card small{font-size:9px;color:#898796}.card-play{margin-left:auto;color:#7772bb;font-size:20px}
 .instrument-workbench{background:white;border:1px solid #e5e2db;border-radius:20px;padding:clamp(15px,3vw,28px);box-shadow:0 12px 36px #211f3e0a}.workbench-heading{display:flex;justify-content:space-between;gap:12px;align-items:center}.workbench-heading h2{font-size:23px;margin:7px 0}.workbench-heading p{font-size:12px;color:#777887;max-width:600px;line-height:1.5;margin:0}.audio-status{font-size:10px;color:#777887;white-space:nowrap}.audio-status i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#62ac7b;margin-right:7px}
 .practice-controls{display:flex;align-items:end;gap:14px;flex-wrap:wrap;margin:22px 0 8px;padding-bottom:18px;border-bottom:1px solid #eeece7}.practice-controls label{display:grid;gap:6px;font-size:10px;color:#777887;min-width:130px}.practice-controls label b{color:#39374c}.practice-controls input{accent-color:#5147d9;width:140px}.toggle{border:1px solid #ddd9e5;background:#faf9ff;border-radius:8px;padding:9px 11px;font-size:10px;color:#5a5870}.toggle.on{background:#eae7ff;border-color:#5147d9;color:#5147d9}
 .octave-control{display:flex;justify-content:center;align-items:center;gap:18px;margin:20px 0 8px;font-size:11px}.octave-control button{width:30px;height:30px;border:1px solid #ddd9d0;background:#fff;border-radius:8px}.studio-keyboard{position:relative;margin:18px 0 10px;overflow-x:auto;padding-bottom:8px}.studio-white-keys{height:190px;min-width:700px;display:flex}.studio-white-keys button{flex:1;position:relative;border:1px solid #c9c8ce;border-radius:0 0 7px 7px;background:linear-gradient(#fff,#f0eff2);display:flex;align-items:flex-end;justify-content:center;padding:0 0 12px;color:#686777;font-size:9px}.studio-black-keys{position:absolute;inset:0 0 auto;height:120px;min-width:700px;pointer-events:none}.studio-black-keys button{position:absolute;top:0;width:3.5%;height:100%;transform:translateX(-50%);background:linear-gradient(90deg,#292735,#555361);border:0;border-radius:0 0 5px 5px;color:white;z-index:2;pointer-events:auto;box-shadow:0 5px 8px #0003}.studio-black-keys span{font-size:7px;position:absolute;bottom:7px;left:0;right:0}
 .fretboard{overflow-x:auto;background:#59422f;padding:12px;border-radius:10px;margin:18px 0;color:white}.fret-labels,.fret-row{display:grid;grid-template-columns:52px repeat(13,minmax(42px,1fr));min-width:600px;align-items:center}.fret-labels span{text-align:center;font-size:9px;padding:7px;color:#e6d8c9}.fret-row{height:45px;border-bottom:1px solid #d5c1a588}.fret-row>b{font-size:10px;color:#f0dfc9}.fret-row button{height:100%;border:0;border-right:1px solid #d3c0a088;background:transparent;color:white;font-size:9px}.note-pad{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px;margin:22px 0}.drum-pad-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:22px 0}.drum-pad-grid button{min-height:78px;border:1px solid #dedbe8;border-radius:12px;background:#29273f;color:white;text-transform:capitalize;font-size:11px;font-weight:700}.note-pad button{padding:17px 6px;border:1px solid #dedbe8;border-radius:9px;background:#f8f7ff;color:#49465f}
 .practice-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid #eeece7;padding-top:18px;margin-top:16px}.practice-actions button{display:flex;align-items:center;gap:7px;border:0;border-radius:9px;background:#5147d9;color:white;padding:11px 13px;font-size:10px;font-weight:700}.practice-actions span{font-size:10px;color:#777887}.studio-footer{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:18px 0;color:#777887;font-size:10px}
 @media(max-width:900px){.library-layout{grid-template-columns:1fr}.library-sidebar{position:static}.family-list{display:flex;overflow-x:auto}.family-list button{white-space:nowrap}.instrument-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:540px){.drum-pad-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.instrument-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.instrument-card{padding:8px;gap:6px}.instrument-card b{font-size:10px}.instrument-emoji{font-size:20px}.workbench-heading{align-items:flex-start;flex-direction:column}.note-pad{grid-template-columns:repeat(4,1fr)}}
 `}</style>
 </main>;
}
