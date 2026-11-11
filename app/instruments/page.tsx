"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Volume2, Music2, Piano, Guitar, Drum, Wind, Waves, Play, Square, Hand, SlidersHorizontal } from "lucide-react";

type Family = "Keyboard" | "Strings" | "Brass" | "Woodwinds" | "Percussion" | "World";
type Item = { id:string; name:string; family:Family; soundfont:string; technique:string; range:[number,number]; icon:string };
const ITEMS:Item[] = [
{id:"grand",name:"Grand piano",family:"Keyboard",soundfont:"acoustic_grand_piano",technique:"Strike keys with different force; use sustain to connect notes.",range:[21,108],icon:"🎹"},
{id:"bright",name:"Bright piano",family:"Keyboard",soundfont:"bright_acoustic_piano",technique:"A brighter, more cutting acoustic piano tone.",range:[36,96],icon:"🎹"},
{id:"electric",name:"Electric piano",family:"Keyboard",soundfont:"electric_piano_1",technique:"Play softly for mellow tones and harder for a brighter attack.",range:[28,96],icon:"🎹"},
{id:"electric2",name:"Electric piano II",family:"Keyboard",soundfont:"electric_piano_2",technique:"Rhodes-style bell-like electric keyboard sound.",range:[28,96],icon:"🎹"},
{id:"honky",name:"Honky-tonk piano",family:"Keyboard",soundfont:"honkytonk_piano",technique:"A detuned upright-style piano colour.",range:[36,96],icon:"🎹"},
{id:"harpsi",name:"Harpsichord",family:"Keyboard",soundfont:"harpsichord",technique:"Plucked keyboard strings; notes decay naturally.",range:[36,96],icon:"🎹"},
{id:"clav",name:"Clavinet",family:"Keyboard",soundfont:"clavinet",technique:"Short, percussive funk keyboard notes.",range:[36,96],icon:"🎹"},
{id:"celesta",name:"Celesta",family:"Keyboard",soundfont:"celesta",technique:"Light, bell-like keyboard touch.",range:[48,96],icon:"🔔"},
{id:"organ",name:"Drawbar organ",family:"Keyboard",soundfont:"drawbar_organ",technique:"Hold keys for continuous tone; try chord changes.",range:[36,96],icon:"🎹"},
{id:"church",name:"Church organ",family:"Keyboard",soundfont:"church_organ",technique:"Sustain notes and layer full chords.",range:[36,96],icon:"🎹"},
{id:"accordion",name:"Accordion",family:"World",soundfont:"accordion",technique:"Sustain notes while imagining bellows pressure and phrasing.",range:[48,88],icon:"🪗"},
{id:"harmonica",name:"Harmonica",family:"World",soundfont:"harmonica",technique:"Shape short phrases and alternate breath-like attacks.",range:[48,88],icon:"🎵"},
{id:"nylon",name:"Classical guitar",family:"Strings",soundfont:"acoustic_guitar_nylon",technique:"Pluck individual strings; practise arpeggios and chord tones.",range:[40,88],icon:"🎸"},
{id:"steel",name:"Steel-string guitar",family:"Strings",soundfont:"acoustic_guitar_steel",technique:"Strum chords or pick notes one string at a time.",range:[40,88],icon:"🎸"},
{id:"jazzg",name:"Jazz electric guitar",family:"Strings",soundfont:"electric_guitar_jazz",technique:"Use clean, connected notes and chord voicings.",range:[40,88],icon:"🎸"},
{id:"cleang",name:"Clean electric guitar",family:"Strings",soundfont:"electric_guitar_clean",technique:"Practise picking patterns and sustained clean notes.",range:[40,88],icon:"🎸"},
{id:"mutedg",name:"Muted electric guitar",family:"Strings",soundfont:"electric_guitar_muted",technique:"Short muted attacks; practise tight rhythmic patterns.",range:[40,88],icon:"🎸"},
{id:"overdrive",name:"Overdriven guitar",family:"Strings",soundfont:"overdriven_guitar",technique:"Sustain notes and practise power-chord shapes.",range:[40,88],icon:"🎸"},
{id:"distortion",name:"Distortion guitar",family:"Strings",soundfont:"distortion_guitar",technique:"Play controlled single-note lines and power chords.",range:[40,88],icon:"🎸"},
{id:"harmonics",name:"Guitar harmonics",family:"Strings",soundfont:"guitar_harmonics",technique:"Explore bright, bell-like harmonic notes.",range:[48,96],icon:"🎸"},
{id:"acbass",name:"Acoustic bass",family:"Strings",soundfont:"acoustic_bass",technique:"Play roots on the beat; keep notes short and even.",range:[28,67],icon:"🎸"},
{id:"fingerbass",name:"Fingered electric bass",family:"Strings",soundfont:"electric_bass_finger",technique:"Alternate index and middle finger; lock in with the kick.",range:[28,67],icon:"🎸"},
{id:"pickbass",name:"Picked electric bass",family:"Strings",soundfont:"electric_bass_pick",technique:"Use an even attack for tight rock and pop bass lines.",range:[28,67],icon:"🎸"},
{id:"fretless",name:"Fretless bass",family:"Strings",soundfont:"fretless_bass",technique:"Practise smooth connected notes and melodic slides.",range:[28,67],icon:"🎸"},
{id:"slapbass",name:"Slap bass",family:"Strings",soundfont:"slap_bass_1",technique:"Alternate punchy low notes and bright upper notes.",range:[28,67],icon:"🎸"},
{id:"violin",name:"Violin",family:"Strings",soundfont:"violin",technique:"Bowed sustained notes; practise long tones and melodic phrasing.",range:[55,103],icon:"🎻"},
{id:"viola",name:"Viola",family:"Strings",soundfont:"viola",technique:"Bowed mid-register notes with smooth connected phrasing.",range:[48,88],icon:"🎻"},
{id:"cello",name:"Cello",family:"Strings",soundfont:"cello",technique:"Bowed low and middle register; practise legato lines.",range:[36,84],icon:"🎻"},
{id:"contra",name:"Double bass",family:"Strings",soundfont:"contrabass",technique:"Practise steady bass roots and sustained orchestral notes.",range:[28,67],icon:"🎻"},
{id:"tremolo",name:"Tremolo strings",family:"Strings",soundfont:"tremolo_strings",technique:"Create a shimmering texture under a melody.",range:[48,88],icon:"🎻"},
{id:"pizz",name:"Pizzicato strings",family:"Strings",soundfont:"pizzicato_strings",technique:"Pluck short notes instead of bowing; practise rhythmic patterns.",range:[48,88],icon:"🎻"},
{id:"harp",name:"Orchestral harp",family:"Strings",soundfont:"orchestral_harp",technique:"Play broken chords and flowing arpeggios.",range:[36,96],icon:"🪕"},
{id:"timpani",name:"Timpani",family:"Percussion",soundfont:"timpani",technique:"Strike pitched drum notes with controlled dynamics.",range:[36,72],icon:"🥁"},
{id:"trumpet",name:"Trumpet",family:"Brass",soundfont:"trumpet",technique:"Imagine buzzing lips; practise breath-shaped phrases and clear attacks.",range:[54,86],icon:"🎺"},
{id:"mutedtrumpet",name:"Muted trumpet",family:"Brass",soundfont:"muted_trumpet",technique:"Use compact, controlled phrases and softer dynamics.",range:[54,86],icon:"🎺"},
{id:"trombone",name:"Trombone",family:"Brass",soundfont:"trombone",technique:"Move through pitch positions; practise connected slide-like lines.",range:[40,76],icon:"🎺"},
{id:"horn",name:"French horn",family:"Brass",soundfont:"french_horn",technique:"Shape rounded sustained notes and practise smooth intervals.",range:[41,79],icon:"📯"},
{id:"brass",name:"Brass section",family:"Brass",soundfont:"brass_section",technique:"Practise ensemble chord stabs and sustained harmonies.",range:[48,84],icon:"🎺"},
{id:"tuba",name:"Tuba",family:"Brass",soundfont:"tuba",technique:"Practise low notes, steady air and a stable pulse.",range:[28,64],icon:"🎺"},
{id:"soprano",name:"Soprano saxophone",family:"Woodwinds",soundfont:"soprano_sax",technique:"Single-reed tone; practise clean attacks and connected phrases.",range:[55,88],icon:"🎷"},
{id:"alto",name:"Alto saxophone",family:"Woodwinds",soundfont:"alto_sax",technique:"Use breath-shaped phrases, articulation and melodic runs.",range:[49,82],icon:"🎷"},
{id:"tenor",name:"Tenor saxophone",family:"Woodwinds",soundfont:"tenor_sax",technique:"Practise blues phrases, long tones and articulation.",range:[44,77],icon:"🎷"},
{id:"bari",name:"Baritone saxophone",family:"Woodwinds",soundfont:"baritone_sax",technique:"Explore low-register riffs and steady rhythmic phrases.",range:[36,69],icon:"🎷"},
{id:"oboe",name:"Oboe",family:"Woodwinds",soundfont:"oboe",technique:"Double-reed instrument; practise sustained notes and precise intonation.",range:[58,91],icon:"🎶"},
{id:"bassoon",name:"Bassoon",family:"Woodwinds",soundfont:"bassoon",technique:"Double-reed low woodwind; practise bass lines and legato.",range:[34,75],icon:"🎶"},
{id:"clarinet",name:"Clarinet",family:"Woodwinds",soundfont:"clarinet",technique:"Single-reed instrument; practise register changes and smooth scales.",range:[50,94],icon:"🎶"},
{id:"piccolo",name:"Piccolo",family:"Woodwinds",soundfont:"piccolo",technique:"Practise light, precise high-register notes.",range:[72,108],icon:"🎶"},
{id:"flute",name:"Concert flute",family:"Woodwinds",soundfont:"flute",technique:"Blow across the embouchure; practise breath support and legato.",range:[60,96],icon:"🎶"},
{id:"recorder",name:"Recorder",family:"Woodwinds",soundfont:"recorder",technique:"Practise clear tongued notes and simple fingered melodies.",range:[60,96],icon:"🎶"},
{id:"pan",name:"Pan flute",family:"World",soundfont:"pan_flute",technique:"Shape breath between pipe lengths for melodic phrases.",range:[60,96],icon:"🎶"},
{id:"ocarina",name:"Ocarina",family:"World",soundfont:"ocarina",technique:"Practise simple breath-led melodies and note transitions.",range:[60,88],icon:"🎶"},
{id:"shakuhachi",name:"Shakuhachi",family:"World",soundfont:"shakuhachi",technique:"Explore breathy attacks, space and expressive phrasing.",range:[48,84],icon:"🎶"},
{id:"kalimba",name:"Kalimba",family:"World",soundfont:"kalimba",technique:"Pluck alternating tines to create repeating patterns.",range:[60,88],icon:"🎵"},
{id:"banjo",name:"Banjo",family:"World",soundfont:"banjo",technique:"Practise rolling picking patterns and chord changes.",range:[48,88],icon:"🪕"},
{id:"sitar",name:"Sitar",family:"World",soundfont:"sitar",technique:"Explore plucked melodic phrases and drone-like resonance.",range:[48,88],icon:"🎵"},
{id:"shamisen",name:"Shamisen",family:"World",soundfont:"shamisen",technique:"Practise sharp plucked attacks and rhythmic motifs.",range:[48,88],icon:"🎵"},
{id:"koto",name:"Koto",family:"World",soundfont:"koto",technique:"Play plucked pentatonic-style melodic patterns.",range:[48,88],icon:"🎵"},
{id:"bagpipe",name:"Bagpipe",family:"World",soundfont:"bag_pipe",technique:"Practise sustained melody over an imagined drone.",range:[55,84],icon:"🎶"},
{id:"marimba",name:"Marimba",family:"Percussion",soundfont:"marimba",technique:"Strike bars with alternating mallets; practise scales and rolls.",range:[48,88],icon:"🥁"},
{id:"xylophone",name:"Xylophone",family:"Percussion",soundfont:"xylophone",technique:"Use light mallet strokes for clear pitched notes.",range:[60,96],icon:"🥁"},
{id:"vibraphone",name:"Vibraphone",family:"Percussion",soundfont:"vibraphone",technique:"Strike bars and let notes ring; practise chord voicings.",range:[48,88],icon:"🥁"},
{id:"glock",name:"Glockenspiel",family:"Percussion",soundfont:"glockenspiel",technique:"Play bright high notes with precise mallet strikes.",range:[72,108],icon:"🔔"},
{id:"musicbox",name:"Music box",family:"Percussion",soundfont:"music_box",technique:"Play delicate, evenly spaced notes.",range:[60,96],icon:"🔔"},
{id:"tubular",name:"Tubular bells",family:"Percussion",soundfont:"tubular_bells",technique:"Strike sustained bell tones and control spacing.",range:[48,84],icon:"🔔"},
{id:"steelpan",name:"Steel drums",family:"World",soundfont:"steel_drums",technique:"Strike tuned pans and practise syncopated melodies.",range:[55,91],icon:"🥁"},
{id:"taiko",name:"Taiko-style drum",family:"Percussion",soundfont:"taiko_drum",technique:"Practise strong downbeats and repeated rhythmic patterns.",range:[36,60],icon:"🥁"},
{id:"melodictom",name:"Melodic tom",family:"Percussion",soundfont:"melodic_tom",technique:"Play pitched percussion patterns and rhythmic fills.",range:[40,76],icon:"🥁"}
];
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
 <header className="studio-header"><button onClick={()=>router.push("/")}><ArrowLeft size={17}/> Back to Maestro</button><span>MAESTRO AI · INSTRUMENT LIBRARY</span></header>
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
  {mode==="pads"&&<div className="note-pad">{Array.from({length:16},(_,i)=>current.range[0]+i*2).filter(n=>n<=current.range[1]).map(n=><button key={n} onClick={()=>void playPad(n)}>{noteName(n)}</button>)}</div>}
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
 .fretboard{overflow-x:auto;background:#59422f;padding:12px;border-radius:10px;margin:18px 0;color:white}.fret-labels,.fret-row{display:grid;grid-template-columns:52px repeat(13,minmax(42px,1fr));min-width:600px;align-items:center}.fret-labels span{text-align:center;font-size:9px;padding:7px;color:#e6d8c9}.fret-row{height:45px;border-bottom:1px solid #d5c1a588}.fret-row>b{font-size:10px;color:#f0dfc9}.fret-row button{height:100%;border:0;border-right:1px solid #d3c0a088;background:transparent;color:white;font-size:9px}.note-pad{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px;margin:22px 0}.note-pad button{padding:17px 6px;border:1px solid #dedbe8;border-radius:9px;background:#f8f7ff;color:#49465f}
 .practice-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid #eeece7;padding-top:18px;margin-top:16px}.practice-actions button{display:flex;align-items:center;gap:7px;border:0;border-radius:9px;background:#5147d9;color:white;padding:11px 13px;font-size:10px;font-weight:700}.practice-actions span{font-size:10px;color:#777887}.studio-footer{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:18px 0;color:#777887;font-size:10px}
 @media(max-width:900px){.library-layout{grid-template-columns:1fr}.library-sidebar{position:static}.family-list{display:flex;overflow-x:auto}.family-list button{white-space:nowrap}.instrument-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:540px){.instrument-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.instrument-card{padding:8px;gap:6px}.instrument-card b{font-size:10px}.instrument-emoji{font-size:20px}.workbench-heading{align-items:flex-start;flex-direction:column}.note-pad{grid-template-columns:repeat(4,1fr)}}
 `}</style>
 </main>;
}
