"use client";

import * as Tone from "tone";
import { Midi } from "@tonejs/midi";

export type TrackName = "melody" | "harmony" | "bass" | "drums";
export type NoteEvent = { track: TrackName; midi: number; beat: number; beats: number; velocity?: number };
export type Arrangement = { title: string; bpm: number; beatsPerBar: number; bars: number; events: NoteEvent[] };

let piano: Tone.Sampler | null = null;
let fallback: Tone.PolySynth | null = null;
let clickSynth: Tone.MembraneSynth | null = null;
let ready: Promise<void> | null = null;
let muted = new Set<TrackName>();
let scheduledIds: number[] = [];

const pianoSamples: Record<string, string> = {
  A1:"A1.mp3", C2:"C2.mp3", "D#2":"Ds2.mp3", "F#2":"Fs2.mp3",
  A2:"A2.mp3", C3:"C3.mp3", "D#3":"Ds3.mp3", "F#3":"Fs3.mp3",
  A3:"A3.mp3", C4:"C4.mp3", "D#4":"Ds4.mp3", "F#4":"Fs4.mp3",
  A4:"A4.mp3", C5:"C5.mp3", "D#5":"Ds5.mp3", "F#5":"Fs5.mp3",
  A5:"A5.mp3", C6:"C6.mp3", "D#6":"Ds6.mp3", "F#6":"Fs6.mp3",
  A6:"A6.mp3", C7:"C7.mp3"
};

export async function initialiseAudio() {
  if (!ready) {
    ready = (async () => {
      await Tone.start();
      piano = new Tone.Sampler({
        urls: pianoSamples,
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.1
      }).toDestination();
      fallback = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.012, decay: 0.18, sustain: 0.35, release: 0.8 }
      }).toDestination();
      clickSynth = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 5,
        envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.04 }
      }).toDestination();
      try { await Tone.loaded(); } catch { /* use the local synth fallback if samples cannot load */ }
    })();
  }
  await ready;
}

export async function playMidiNote(midi: number, duration: Tone.Unit.Time = "8n", velocity = 0.78) {
  await initialiseAudio();
  const note = Tone.Frequency(midi, "midi").toNote();
  if (piano?.loaded) piano.triggerAttackRelease(note, duration, Tone.now(), velocity);
  else fallback?.triggerAttackRelease(note, duration, Tone.now(), velocity);
}

export async function playFrequency(frequency: number, duration: Tone.Unit.Time = "8n", velocity = 0.78) {
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  return playMidiNote(midi, duration, velocity);
}

export async function playMidiChord(notes: number[], duration: Tone.Unit.Time = "2n", velocity = 0.7) {
  await initialiseAudio();
  const names = notes.map(n => Tone.Frequency(n, "midi").toNote());
  if (piano?.loaded) piano.triggerAttackRelease(names, duration, Tone.now(), velocity);
  else fallback?.triggerAttackRelease(names, duration, Tone.now(), velocity);
}

export async function playFrequencyChord(frequencies: number[]) {
  const notes = frequencies.map(f => Math.round(69 + 12 * Math.log2(f / 440)));
  return playMidiChord(notes);
}

export async function playClick(accent = false) {
  await initialiseAudio();
  clickSynth?.triggerAttackRelease(accent ? "C3" : "G2", "32n", Tone.now(), accent ? 0.8 : 0.48);
}

export function stopArrangement() {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  scheduledIds = [];
}

export function setMutedTracks(tracks: TrackName[]) {
  muted = new Set(tracks);
}

export async function playArrangement(arrangement: Arrangement) {
  await initialiseAudio();
  stopArrangement();
  Tone.Transport.bpm.value = arrangement.bpm;
  const secondsPerBeat = 60 / arrangement.bpm;
  for (const event of arrangement.events) {
    const id = Tone.Transport.schedule(time => {
      if (muted.has(event.track)) return;
      if (event.track === "drums") {
        clickSynth?.triggerAttackRelease(event.midi >= 48 ? "C3" : "G2", "16n", time, event.velocity ?? 0.55);
      } else {
        const note = Tone.Frequency(event.midi, "midi").toNote();
        const duration = Math.max(0.08, event.beats * secondsPerBeat * 0.88);
        if (piano?.loaded) piano.triggerAttackRelease(note, duration, time, event.velocity ?? 0.72);
        else fallback?.triggerAttackRelease(note, duration, time, event.velocity ?? 0.72);
      }
    }, event.beat * secondsPerBeat);
    scheduledIds.push(id);
  }
  Tone.Transport.start("+0.05");
  Tone.Transport.scheduleOnce(() => stopArrangement(), arrangement.bars * arrangement.beatsPerBar * secondsPerBeat + 0.2);
}

export async function playLessonExample(kind: "scale" | "chord" | "rhythm" | "interval" | "progression" | "melody", rootMidi: number, bpm: number) {
  const events: NoteEvent[] = [];
  if (kind === "scale") {
    [0,2,4,5,7,9,11,12,11,9,7,5,4,2,0].forEach((step,i) => events.push({track:"melody",midi:rootMidi+step,beat:i*0.5,beats:0.45,velocity:0.72}));
  } else if (kind === "chord") {
    const chord=[rootMidi,rootMidi+4,rootMidi+7];
    chord.forEach((midi,i)=>events.push({track:"melody",midi,beat:i*0.5,beats:0.45,velocity:0.72}));
    chord.forEach(midi=>events.push({track:"harmony",midi,beat:2,beats:2.8,velocity:0.6}));
  } else if (kind === "interval") {
    [rootMidi,rootMidi+4,rootMidi,rootMidi+7,rootMidi,rootMidi+12].forEach((midi,i)=>events.push({track:"melody",midi,beat:i*1.5,beats:1.25,velocity:0.78}));
  } else if (kind === "progression") {
    [[0,4,7],[5,9,12],[7,11,14],[0,4,7]].forEach((chord,bar)=>chord.forEach(midi=>events.push({track:"harmony",midi:rootMidi+midi,beat:bar*4,beats:3.7,velocity:0.56})));
    [0,5,7,0].forEach((root,bar)=>events.push({track:"bass",midi:rootMidi+root-12,beat:bar*4,beats:3.8,velocity:0.65}));
  } else if (kind === "rhythm") {
    for(let beat=0;beat<16;beat++) events.push({track:"drums",midi:beat%4===0?60:55,beat,beats:0.12,velocity:beat%4===0?0.82:0.48});
  } else {
    [0,2,4,7,4,2,0,7,9,7,4,2,0].forEach((step,i)=>events.push({track:"melody",midi:rootMidi+step,beat:i*0.5,beats:0.46,velocity:0.7}));
    [[0,4,7],[5,9,12]].forEach((chord,bar)=>chord.forEach(midi=>events.push({track:"harmony",midi:rootMidi+midi,beat:bar*4,beats:3.8,velocity:0.38})));
  }
  await playArrangement({title:"Lesson "+kind+" example",bpm,beatsPerBar:4,bars:kind==="interval"?3:4,events});
}
export function generateProceduralComposition(prompt: string, bpm = 88): Arrangement {
  const text = prompt.toLowerCase();
  const minor = /minor|sad|moody|cinematic|melancholy/.test(text);
  const root = /\b(a minor|am|key of a)\b/.test(text) ? 57 : /\b(g major|key of g)\b/.test(text) ? 67 : /\b(f major|key of f)\b/.test(text) ? 65 : 60;
  const scale = minor ? [0,2,3,5,7,8,10] : [0,2,4,5,7,9,11];
  const chordDegrees = minor ? [0,5,2,6] : [0,5,3,4];
  let seed = Array.from(text).reduce((value,char)=>(value*31+char.charCodeAt(0))>>>0, 17);
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const events: NoteEvent[] = [];
  chordDegrees.forEach((degree,bar)=>{
    const chord = [0,2,4].map(offset=>root+scale[(degree+offset)%7]+(degree+offset>=7?12:0));
    chord.forEach(midi=>events.push({track:"harmony",midi,beat:bar*4,beats:3.75,velocity:0.42}));
    events.push({track:"bass",midi:root+scale[degree]-12,beat:bar*4,beats:1.8,velocity:0.64});
    events.push({track:"bass",midi:root+scale[degree]-12,beat:bar*4+2,beats:1.8,velocity:0.52});
  });
  let previous = 0;
  for(let beat=0;beat<16;beat++){
    const degree = beat%4===3 ? (random()>.5?4:2) : Math.max(0,Math.min(6,previous+(Math.floor(random()*5)-2)));
    previous = degree;
    events.push({track:"melody",midi:root+scale[degree]+12,beat:beat+((beat%4===1&&random()>.65)?.5:0),beats:beat%4===3?0.8:0.42,velocity:beat%4===0?0.86:0.68});
  }
  for(let beat=0;beat<16;beat++) events.push({track:"drums",midi:beat%4===0?60:beat%2===0?55:52,beat,beats:0.1,velocity:beat%4===0?0.78:0.4});
  const style = /waltz|3\/4/.test(text) ? "Waltz" : /jazz/.test(text) ? "Jazz" : /ambient|calm|soft/.test(text) ? "Ambient" : minor ? "Minor study" : "Major study";
  return {title:style+" · "+(minor?"A minor":"C major")+" composition",bpm,beatsPerBar:4,bars:4,events};
}
export function makeCmajorStudy(bpm = 84): Arrangement {
  const melody = [60,62,64,65,67,69,71,72,71,69,67,65,64,62,60];
  const events: NoteEvent[] = melody.map((midi, i) => ({
    track: "melody", midi, beat: i * 0.5, beats: 0.46, velocity: i === 0 || i === 7 || i === 14 ? 0.9 : 0.68
  }));
  const chords = [[48,52,55],[53,57,60],[55,59,62],[48,52,55]];
  chords.forEach((chord, bar) => chord.forEach(midi => events.push({
    track: "harmony", midi, beat: bar * 4, beats: 3.8, velocity: 0.38
  })));
  [36,36,41,41,43,43,36,36].forEach((midi, i) => events.push({
    track: "bass", midi, beat: i * 2, beats: 1.7, velocity: 0.58
  }));
  for (let beat = 0; beat < 16; beat++) events.push({
    track: "drums", midi: beat % 4 === 0 ? 60 : 55, beat, beats: 0.12, velocity: beat % 4 === 0 ? 0.8 : 0.38
  });
  return { title: "C major: melody, harmony & pulse", bpm, beatsPerBar: 4, bars: 4, events };
}

export function exportArrangementMidi(arrangement: Arrangement) {
  const midi = new Midi();
  midi.header.setTempo(arrangement.bpm);
  const names: TrackName[] = ["melody", "harmony", "bass", "drums"];
  for (const name of names) {
    const track = midi.addTrack();
    track.name = name[0].toUpperCase() + name.slice(1);
    for (const event of arrangement.events.filter(e => e.track === name)) {
      track.addNote({
        midi: event.midi,
        time: event.beat * 60 / arrangement.bpm,
        duration: event.beats * 60 / arrangement.bpm,
        velocity: event.velocity ?? 0.7
      });
    }
  }
  const blob = new Blob([midi.toArray()], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "maestro-composition.mid";
  anchor.click();
  URL.revokeObjectURL(url);
}
