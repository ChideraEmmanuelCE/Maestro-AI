"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Tone from "tone";
import { ArrowLeft, Piano, Guitar, Drum, Waves, Music2, Play, Square, Volume2 } from "lucide-react";
import { playMidiNote, playMidiChord, playDrumPad, stopArrangement } from "@/lib/audio-engine";

type Instrument = "piano" | "guitar" | "bass" | "strings" | "drums";
const NOTES = ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const midiName = (m:number) => NOTES[((m%12)+12)%12] + (Math.floor(m/12)-1);
const CHORDS:Record<string,number[]> = {
  C:[60,64,67], Dm:[62,65,69], Em:[64,67,71], F:[65,69,72], G:[67,71,74], Am:[57,60,64], Bdim:[59,62,65]
};

export default function InstrumentsPage(){
  const router=useRouter();
  const [instrument,setInstrument]=useState<Instrument>("piano");
  const [octave,setOctave]=useState(4);
  const [held,setHeld]=useState<number[]>([]);
  const [chord,setChord]=useState("C");
  const [bpm,setBpm]=useState(100);
  const [message,setMessage]=useState("Choose an instrument and start playing.");
  const [ready,setReady]=useState(false);
  const guitarRef=useRef<Tone.PluckSynth|null>(null);
  const bassRef=useRef<Tone.MonoSynth|null>(null);
  const stringsRef=useRef<Tone.PolySynth|null>(null);
  const drumRef=useRef<Tone.MembraneSynth|null>(null);
  const pianoNotes=useMemo(()=>Array.from({length:29},(_,i)=>48+i),[]);
  const blackSet=new Set([1,3,6,8,10]);
  const white=pianoNotes.filter(n=>!blackSet.has(n%12));
  const black=pianoNotes.filter(n=>blackSet.has(n%12)).map(n=>({n,left:((white.filter(w=>w<n).length-.32)/white.length*100)+"%"}));

  useEffect(()=>{
    guitarRef.current=new Tone.PluckSynth({attackNoise:1, dampening:4500, resonance:0.92}).toDestination();
    bassRef.current=new Tone.MonoSynth({oscillator:{type:"triangle"},filter:{Q:2,type:"lowpass",rolloff:-24},envelope:{attack:0.015,decay:0.22,sustain:0.55,release:0.35},filterEnvelope:{attack:0.01,decay:0.18,sustain:0.25,release:0.25,baseFrequency:90,octaves:2.5}}).toDestination();
    stringsRef.current=new Tone.PolySynth(Tone.Synth,{oscillator:{type:"sawtooth"},envelope:{attack:0.22,decay:0.18,sustain:0.78,release:0.8}}).toDestination();
    drumRef.current=new Tone.MembraneSynth({pitchDecay:0.04,octaves:5,envelope:{attack:0.001,decay:0.22,sustain:0,release:0.02}}).toDestination();
    return ()=>{guitarRef.current?.dispose();bassRef.current?.dispose();stringsRef.current?.dispose();drumRef.current?.dispose();stopArrangement();};
  },[]);

  async function play(midi:number){
    await Tone.start();
    if(instrument==="piano") await playMidiNote(midi,"8n",0.85);
    if(instrument==="guitar") guitarRef.current?.triggerAttackRelease(Tone.Frequency(midi,"midi").toNote(),"2n");
    if(instrument==="bass") bassRef.current?.triggerAttackRelease(Tone.Frequency(midi,"midi").toNote(),"4n");
    if(instrument==="strings") stringsRef.current?.triggerAttackRelease(Tone.Frequency(midi,"midi").toNote(),"2n");
    setHeld(v=>[...v.slice(-5),midi]);
    setMessage("Played "+midiName(midi));
  }
  async function playSelectedChord(){
    await Tone.start();
    const notes=CHORDS[chord];
    if(instrument==="piano") await playMidiChord(notes,"2n");
    else if(instrument==="guitar") notes.forEach((n,i)=>setTimeout(()=>guitarRef.current?.triggerAttackRelease(Tone.Frequency(n,"midi").toNote(),"2n"),i*95));
    else if(instrument==="bass") await play(notes[0]-12);
    else if(instrument==="strings") stringsRef.current?.triggerAttackRelease(notes.map(n=>Tone.Frequency(n,"midi").toNote()),"2n");
    setMessage(chord+" chord · "+notes.map(midiName).join(" · "));
  }
  async function drum(pad:"kick"|"snare"|"hat"|"tom"|"clap"){
    await Tone.start();
    await playDrumPad(pad);
    setMessage(pad.toUpperCase()+" drum hit");
  }
  const instruments:[Instrument,string,string,typeof Piano][]=[
    ["piano","Piano","Sampled grand piano",Piano],
    ["guitar","Acoustic guitar","Plucked string model",Guitar],
    ["bass","Electric bass","Low-register synth instrument",Waves],
    ["strings","Strings","Sustained bowed-style instrument",Music2],
    ["drums","Drum kit","Kick, snare, hi-hat and tom",Drum]
  ];
  return <main className="instrument-studio">
    <header className="studio-header"><button onClick={()=>router.push("/")}><ArrowLeft size={17}/> Back to Maestro</button><span>MAESTRO AI · INSTRUMENT STUDIO</span></header>
    <section className="studio-intro"><span>PLAY · LISTEN · PRACTISE</span><h1>Your instruments.<br/><em>Your practice room.</em></h1><p>Play notes, chords and rhythms with touch or mouse. Start with the piano, then switch to other instruments.</p></section>
    <section className="instrument-picker">{instruments.map(([id,label,desc,Icon])=><button key={id} className={instrument===id?"instrument-choice active":"instrument-choice"} onClick={()=>{setInstrument(id);setMessage(label+" selected. Play to begin.");}}><Icon size={22}/><b>{label}</b><small>{desc}</small></button>)}</section>
    <section className="instrument-workbench">
      <div className="workbench-heading"><div><span>NOW PLAYING</span><h2>{instruments.find(x=>x[0]===instrument)?.[1]}</h2><p>{message}</p></div><span className="audio-status"><i/> Audio ready after first tap</span></div>
      {instrument==="piano"&&<><div className="octave-control"><button onClick={()=>setOctave(v=>Math.max(2,v-1))}>−</button><b>Keyboard range · C{Math.floor(octave)} to C{Math.floor(octave)+2}</b><button onClick={()=>setOctave(v=>Math.min(6,v+1))}>+</button></div><div className="studio-keyboard"><div className="studio-white-keys">{pianoNotes.map((n,i)=><button key={n} onPointerDown={()=>void play(n)} className={held.includes(n)?"pressed":""} aria-label={"Play "+midiName(n)}><span>{midiName(n)}</span></button>)}</div><div className="studio-black-keys">{black.map(({n,left})=><button key={n} style={{left}} onPointerDown={()=>void play(n)} aria-label={"Play "+midiName(n)}><span>{midiName(n)}</span></button>)}</div></div><p className="instrument-hint">The piano uses sampled grand-piano recordings. Tap any white or black key.</p></>}
      {instrument==="guitar"&&<><div className="guitar-neck"><div className="guitar-fret-labels"><span>STRING</span>{[0,1,2,3,4,5,6,7,8,9,10,11,12].map(n=><span key={n}>{n===0?"OPEN":n}</span>)}</div>{[{s:"E2",m:40},{s:"A2",m:45},{s:"D3",m:50},{s:"G3",m:55},{s:"B3",m:59},{s:"E4",m:64}].map(row=><div className="guitar-string" key={row.s}><b>{row.s}</b>{Array.from({length:13},(_,f)=><button key={f} onClick={()=>void play(row.m+f)} className={held.includes(row.m+f)?"pressed":""} aria-label={row.s+" fret "+f}><i/></button>)}</div>)}</div><p className="instrument-hint">Standard guitar tuning · 6 strings · 12 frets. Each fret raises the pitch by one semitone.</p></>}
      {instrument==="bass"&&<><div className="bass-board">{[40,45,50,55].map((base,i)=><div className="bass-string" key={base}><b>{["E1","A1","D2","G2"][i]}</b>{Array.from({length:13},(_,f)=><button key={f} onClick={()=>void play(base+f)}>{midiName(base+f)}</button>)}</div>)}</div><p className="instrument-hint">Four-string bass layout · Standard E–A–D–G tuning · Play roots and grooves.</p></>}
      {instrument==="strings"&&<div className="strings-practice"><div className="strings-visual"><Waves size={66}/></div><h3>Play a sustained string tone</h3><div className="note-pad">{Array.from({length:15},(_,i)=>48+i).map(n=><button key={n} onClick={()=>void play(n)}>{midiName(n)}</button>)}</div><p className="instrument-hint">Sustained envelope for bow-like phrasing. Try holding a note with longer decay.</p></div>}
      {instrument==="drums"&&<div className="drum-practice"><div className="drum-pads">{(["kick","snare","hat","tom","clap"] as const).map((pad,i)=><button key={pad} onClick={()=>void drum(pad)}><b>{["K","S","H","T","C"][i]}</b><span>{pad}</span></button>)}</div><div className="drum-pattern"><span>QUICK GROOVE</span><div>{Array.from({length:16},(_,i)=><button key={i} onClick={()=>void drum(i%4===0?"kick":i%4===2?"hat":"snare")}>{i+1}</button>)}</div></div><p className="instrument-hint">Tap pads or build a simple groove by tapping the 16 steps in sequence.</p></div>}
      {instrument!=="drums"&&<div className="chord-practice"><label>Chord practice<select value={chord} onChange={e=>setChord(e.target.value)}>{Object.keys(CHORDS).map(c=><option key={c}>{c}</option>)}</select></label><button onClick={()=>void playSelectedChord()}><Play size={16}/> Play {chord} chord</button></div>}
    </section>
    <footer className="studio-footer"><span><Volume2 size={15}/> Web Audio · Touch and mouse input</span><label>Practice tempo <input type="range" min="50" max="180" value={bpm} onChange={e=>setBpm(Number(e.target.value))}/> <b>{bpm} BPM</b></label></footer>
    <style jsx global>{`
      .instrument-studio{min-height:100vh;background:#f5f3ee;color:#24233a;padding:0 clamp(16px,5vw,72px) 60px;font-family:Arial,sans-serif}
      .studio-header{height:72px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e3e0d9;color:#797787;font-size:10px;letter-spacing:1.6px;font-weight:700}
      .studio-header button{display:flex;align-items:center;gap:8px;border:1px solid #ddd9d0;background:#fff;border-radius:10px;padding:10px 13px;color:#333146;font-size:12px;letter-spacing:0}
      .studio-intro{padding:50px 0 30px}.studio-intro>span,.workbench-heading>div>span,.drum-pattern>span{font-size:10px;letter-spacing:1.8px;font-weight:800;color:#7772bb}.studio-intro h1{font-size:clamp(38px,6vw,66px);line-height:1.02;letter-spacing:-3px;margin:14px 0}.studio-intro h1 em{font-style:normal;color:#5147d9}.studio-intro p{max-width:560px;color:#777887;line-height:1.7;font-size:14px}
      .instrument-picker{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:16px 0 20px}.instrument-choice{min-width:0;text-align:left;display:grid;gap:9px;padding:17px;border:1px solid #e2dfd8;background:#fff;border-radius:15px;color:#48465c}.instrument-choice svg{color:#5147d9}.instrument-choice b{font-size:13px}.instrument-choice small{font-size:10px;line-height:1.4;color:#858391}.instrument-choice.active{border:2px solid #5147d9;background:#f1efff;padding:16px}
      .instrument-workbench{background:#fff;border:1px solid #e5e2db;border-radius:22px;padding:clamp(17px,3vw,32px);box-shadow:0 15px 45px #211f3e0a}.workbench-heading{display:flex;justify-content:space-between;align-items:center;gap:15px}.workbench-heading h2{font-size:25px;margin:7px 0}.workbench-heading p{font-size:12px;color:#777887;margin:0}.audio-status{font-size:10px;color:#777887;white-space:nowrap}.audio-status i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#63ad7d;margin-right:7px}
      .octave-control{display:flex;justify-content:center;align-items:center;gap:18px;margin:24px 0 10px;font-size:11px}.octave-control button{width:30px;height:30px;border:1px solid #ddd9d0;background:#fff;border-radius:8px}.studio-keyboard{position:relative;margin:30px 0 15px;overflow-x:auto;padding-bottom:8px}.studio-white-keys{height:230px;min-width:720px;display:flex}.studio-white-keys button{flex:1;position:relative;border:1px solid #c9c8ce;border-radius:0 0 8px 8px;background:linear-gradient(#fff,#f1f0f2);display:flex;align-items:flex-end;justify-content:center;padding:0 0 13px;color:#686777;font-size:10px}.studio-white-keys button.pressed{background:#e8e5ff}.studio-black-keys{position:absolute;inset:0 0 auto;height:145px;min-width:720px;pointer-events:none}.studio-black-keys button{position:absolute;top:0;width:3.7%;height:100%;transform:translateX(-50%);background:linear-gradient(90deg,#292735,#555361);border:0;border-radius:0 0 6px 6px;color:#fff;z-index:2;pointer-events:auto;box-shadow:0 5px 8px #0003}.studio-black-keys span{font-size:8px;position:absolute;bottom:8px;left:0;right:0}
      .instrument-hint{font-size:11px;color:#858391;line-height:1.6;margin:15px 0 0}.chord-practice{margin-top:24px;padding-top:20px;border-top:1px solid #eeece7;display:flex;align-items:end;gap:12px;flex-wrap:wrap}.chord-practice label{display:grid;gap:7px;font-size:11px;font-weight:700}.chord-practice select{height:40px;min-width:110px;border:1px solid #ddd9d0;border-radius:9px;padding:0 10px;background:#fff}.chord-practice>button{height:40px;border:0;border-radius:9px;background:#5147d9;color:#fff;padding:0 15px;display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700}
      .guitar-neck,.bass-board{overflow-x:auto;margin:28px 0 8px;padding:15px;background:#59422f;border-radius:12px;color:#fff}.guitar-fret-labels,.guitar-string,.bass-string{display:grid;grid-template-columns:55px repeat(13,minmax(38px,1fr));min-width:560px;align-items:center}.guitar-fret-labels span{font-size:9px;text-align:center;color:#e6d8c9;padding:7px 0}.guitar-string{height:49px;border-bottom:1px solid #c9bca9a8;position:relative}.guitar-string:after{content:"";position:absolute;left:55px;right:0;top:50%;height:1px;background:#e0d2c0;pointer-events:none}.guitar-string>b,.bass-string>b{font-size:10px;color:#f0dfc9}.guitar-string button{height:100%;border:0;border-right:1px solid #e3d4c1a0;background:transparent;position:relative;z-index:1}.guitar-string button i{display:block;width:12px;height:12px;margin:auto;border-radius:50%;background:#d8b36c;opacity:0}.guitar-string button:focus i,.guitar-string button.pressed i{opacity:1}.bass-string{height:60px;border-bottom:1px solid #d9c8b5a0}.bass-string button{height:42px;border:1px solid #d3bba4;border-radius:5px;background:#79583d;color:#fff;font-size:9px}.bass-string button:active{background:#a77d55}
      .strings-practice{text-align:center;padding:30px 0 10px}.strings-visual{width:120px;height:120px;border-radius:50%;background:#f0efff;color:#5147d9;display:grid;place-items:center;margin:15px auto}.strings-practice h3{font-size:18px}.note-pad{display:flex;justify-content:center;flex-wrap:wrap;gap:7px}.note-pad button{padding:12px 14px;border:1px solid #dedbe8;border-radius:9px;background:#f8f7ff;color:#49465f}
      .drum-pads{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:28px 0}.drum-pads button{aspect-ratio:1.1;border:0;border-radius:15px;background:#28263f;color:#fff;display:grid;place-content:center;gap:8px;text-transform:capitalize}.drum-pads button b{font-size:23px}.drum-pads button span{font-size:11px}.drum-pattern{border-top:1px solid #eeece7;padding-top:18px}.drum-pattern>div{display:grid;grid-template-columns:repeat(16,1fr);gap:5px;margin-top:12px}.drum-pattern button{height:37px;border:1px solid #ddd9d0;background:#f6f4ef;border-radius:6px;font-size:10px}
      .studio-footer{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;padding:22px 0;color:#777887;font-size:11px}.studio-footer>span,.studio-footer label{display:flex;align-items:center;gap:9px}.studio-footer input{accent-color:#5147d9}
      @media(max-width:800px){.instrument-picker{grid-template-columns:repeat(2,minmax(0,1fr))}.instrument-choice:last-child{grid-column:span 2}.studio-intro{padding-top:34px}.workbench-heading{align-items:flex-start;flex-direction:column}.studio-white-keys{min-width:650px}.drum-pads{grid-template-columns:repeat(3,1fr)}.drum-pattern>div{grid-template-columns:repeat(8,1fr)}}
    `}</style>
  </main>;
}
