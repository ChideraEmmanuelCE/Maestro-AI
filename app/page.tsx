"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import { playFrequency, playFrequencyChord, playClick as playAudioClick, playLessonExample, makeCmajorStudy, generateProceduralComposition, playArrangement, stopArrangement, exportArrangementMidi, setMutedTracks, playDrumPad, playMidiNote, playMidiChord, type TrackName, type Arrangement } from "@/lib/audio-engine";
import { curriculum } from "@/lib/curriculum";
import { assessmentBank } from "@/lib/assessments";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import {
  AudioLines, BookOpen, Home, Music2, Mic2, MessageCircle, BarChart3, Sun, Moon,
  UserRound, Settings, LogOut, ChevronRight, ChevronLeft, Play, Pause, Check,
  Sparkles, Headphones, Piano, Drum, Guitar, Heart, Menu, X, Send, Volume2,
  Clock3, Target, LockKeyhole, Mail, User, Baby, ArrowRight,
  CircleHelp, WandSparkles
} from "lucide-react";

type Learner = { id?:string; guardianId?:string; name:string; email:string; learnerName:string; ageBand:"4-8"|"9-16"|"adult"; createdAt:string };
type ChatMessage = { role:"user"|"assistant"; content:string };
type Progress = { completed:string[]; minutes:number; notesPlayed:number; lastActive:string|null };
type SavedPiece = { title:string; createdAt:string; arrangement:Arrangement };
type LearnerProfile = { id:string; display_name:string; age_band:"4-8"|"9-16"|"adult" };
const STORE = "maestro.account.v1";
const PROGRESS = "maestro.progress.v1";
const CHAT = "maestro.chat.v1";

const lessons = curriculum.map(item => ({
  id:item.id, title:item.title, category:item.category, level:item.level,
  duration:item.minutes+" min", minutes:item.minutes, description:item.objective, ageBands:item.ageBands, audio:item.audio, exercise:item.exercise,
  steps:[
    "LEARNING OBJECTIVE\n"+item.objective,
    "UNDERSTAND THE IDEA\n"+item.concept,
    "LISTEN WITH PURPOSE\n"+item.listenFor,
    "PRACTISE IT\n"+item.activity,
    "CHECK YOUR UNDERSTANDING\n"+item.exercise.prompt+"\n\n"+item.exercise.options.map((option,index)=>String.fromCharCode(65+index)+". "+option).join("\n")
  ],
  icon: item.category==="Piano" ? Piano : item.category==="Notation" ? BookOpen : item.category==="Rhythm" ? Drum : item.category==="Ear training" || item.category==="Listening" ? Headphones : item.category==="Guitar" ? Guitar : item.category==="Composition" || item.category==="Harmony" ? Music2 : Piano
}));

function weekStartDate(){const date=new Date();date.setHours(0,0,0,0);date.setDate(date.getDate()-((date.getDay()+6)%7));return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");}
function readProgress():Progress { try { const p=JSON.parse(localStorage.getItem(PROGRESS)||"{}"); return {completed:Array.isArray(p.completed)?p.completed:[],minutes:Number(p.minutes)||0,notesPlayed:Number(p.notesPlayed)||0,lastActive:p.lastActive||null}; } catch { return {completed:[],minutes:0,notesPlayed:0,lastActive:null}; } }
function playTone(freq:number) { void playFrequency(freq); }
function playClick(){ void playAudioClick(); }
function playChord(freqs:number[]){ void playFrequencyChord(freqs); }

export default function Page(){
  const [account,setAccount]=useState<Learner|null>(null);
  const [ready,setReady]=useState(false);
  const [screen,setScreen]=useState("home");
  const [register,setRegister]=useState(true);
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [learnerName,setLearnerName]=useState(""); const [ageBand,setAgeBand]=useState<"4-8"|"9-16"|"adult">("adult");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [learnerProfiles,setLearnerProfiles]=useState<LearnerProfile[]>([]);
  const [newLearnerName,setNewLearnerName]=useState("");
  const [newLearnerAge,setNewLearnerAge]=useState<"4-8"|"9-16"|"adult">("4-8");
  const [profileBusy,setProfileBusy]=useState(false);
  const [weeklyGoalMinutes,setWeeklyGoalMinutes]=useState(90);
  const [weeklyMinutes,setWeeklyMinutes]=useState(0);
  const [progress,setProgress]=useState<Progress>({completed:[],minutes:0,notesPlayed:0,lastActive:null});
  const [activeLesson,setActiveLesson]=useState<string|null>(null);
  const [lessonQuery,setLessonQuery]=useState("");
  const [lessonCategory,setLessonCategory]=useState("All");
  const [bpm,setBpm]=useState(100);
  const [step,setStep]=useState(0);
  const [quizAnswers,setQuizAnswers]=useState<Record<number,number>>({});
  const [chat,setChat]=useState<ChatMessage[]>([]);
  const [question,setQuestion]=useState(""); const [typing,setTyping]=useState(false); const [chatError,setChatError]=useState("");
  const [mobileMenu,setMobileMenu]=useState(false);
  const [toast,setToast]=useState("");
  const [metronome,setMetronome]=useState(false);
  const [mutedTracksState,setMutedTracksState]=useState<TrackName[]>([]);
  const [compositionPrompt,setCompositionPrompt]=useState("A gentle, uplifting piano melody with warm chords and a steady rhythm");
  const [generatedArrangement,setGeneratedArrangement]=useState<Arrangement|null>(null);
  const [savedPieces,setSavedPieces]=useState<SavedPiece[]>([]);
  const [showParent,setShowParent]=useState(false);
  const [theme,setTheme]=useState<"dark"|"light">("dark");
  const chatEnd=useRef<HTMLDivElement>(null);
  const toddler=account?.ageBand==="4-8";
  const lesson=lessons.find(x=>x.id===activeLesson)||null;
  const LessonIcon=lesson?.icon ?? Music2;
  const assessment=lesson?[lesson.exercise,...(assessmentBank[lesson.category]||[])]:[];
  const quizScore=assessment.reduce((score,item,index)=>score+(quizAnswers[index]===item.answer?1:0),0);
  const quizPassed=assessment.length>0&&quizScore>=Math.ceil(assessment.length*0.75);

  useEffect(()=>{
    let alive=true;
    async function boot(){
      try{
        setTheme(localStorage.getItem("maestro.theme")==="light"?"light":"dark");
        const c=JSON.parse(localStorage.getItem(CHAT)||"[]");if(Array.isArray(c))setChat(c);
        const pieces=JSON.parse(localStorage.getItem("maestro.library.v1")||"[]");if(Array.isArray(pieces))setSavedPieces(pieces);
        const supabase=createSupabaseClient();
        if(supabase){
          const {data:{user},error:userError}=await supabase.auth.getUser();
          if(userError) console.error("Maestro session restore failed:",userError.message);
          if(user){
            const displayName=String(user.user_metadata?.display_name||user.email||"Guardian");
            const learnerName=String(user.user_metadata?.learner_name||displayName);
            const allowedAgeBands=["4-8","9-16","adult"];
            const ageBand=allowedAgeBands.includes(user.user_metadata?.age_band)?user.user_metadata.age_band:"adult";
            const {error:guardianError}=await supabase.from("guardian_accounts").upsert({user_id:user.id,display_name:displayName},{onConflict:"user_id"});
            if(guardianError){
              console.error("Maestro guardian record error:",guardianError.message);
              if(alive)setError("Your email is verified, but your account profile could not be saved: "+guardianError.message+". Run the Maestro database migration in Supabase.");
            }else{
              let {data:profiles,error:profilesError}=await supabase.from("learner_profiles").select("id,display_name,age_band").eq("guardian_user_id",user.id).order("created_at",{ascending:true});
              if(profilesError){
                console.error("Maestro learner profiles error:",profilesError.message);
                if(alive)setError("Your email is verified, but learner profiles could not be loaded: "+profilesError.message+". Check the Supabase database migration.");
              }else{
                if(!profiles?.length){
                  const {data:created,error:createError}=await supabase.from("learner_profiles").insert({guardian_user_id:user.id,display_name:learnerName,age_band:ageBand}).select("id,display_name,age_band").single();
                  if(createError||!created){
                    console.error("Maestro learner profile create error:",createError?.message);
                    if(alive)setError("Your email is verified, but learner profile creation failed: "+(createError?.message||"No profile returned")+". Check the Supabase database migration.");
                  }else profiles=[created];
                }
                if(profiles?.length){
                  const list=profiles as LearnerProfile[];const profile=list[0];
                  if(alive){setLearnerProfiles(list);setAccount({id:profile.id,guardianId:user.id,name:displayName,email:user.email||"",learnerName:profile.display_name,ageBand:profile.age_band,createdAt:user.created_at});}
                  const {data:rows,error:progressError}=await supabase.from("lesson_progress").select("lesson_id,status,mastered_at").eq("learner_id",profile.id);
                  if(progressError)console.error("Maestro progress restore error:",progressError.message);
                  if(alive&&rows){setProgress(prev=>({...prev,completed:rows.filter(row=>row.status==="mastered").map(row=>row.lesson_id)}));setWeeklyMinutes(rows.filter(row=>row.status==="mastered"&&row.mastered_at&&new Date(row.mastered_at)>=new Date(weekStartDate())).reduce((sum,row)=>sum+(Number(lessons.find(item=>item.id===row.lesson_id)?.duration.match(/\\d+/)?.[0])||0),0));}
                  const {data:goal}=await supabase.from("weekly_goals").select("target_minutes").eq("learner_id",profile.id).eq("week_start",weekStartDate()).maybeSingle();if(alive&&goal)setWeeklyGoalMinutes(goal.target_minutes);
                  const {data:pieces}=await supabase.from("generated_pieces").select("title,created_at,arrangement").eq("learner_id",profile.id).order("created_at",{ascending:false}).limit(30);
                  if(alive&&pieces)setSavedPieces(pieces.map(piece=>({title:piece.title,createdAt:piece.created_at,arrangement:piece.arrangement as Arrangement})));
                }
              }
            }
          }
        }else{
          const a=localStorage.getItem(STORE);if(a&&alive)setAccount(JSON.parse(a));
          if(alive){setProgress(readProgress());const goal=Number(localStorage.getItem("maestro.weekly-goal"));if(goal>=5)setWeeklyGoalMinutes(goal);}
        }
      }catch(e){console.error("Maestro session restore failed",e);}
      finally{if(alive)setReady(true);}
    }
    void boot();
    return()=>{alive=false;};
  },[]);
  useEffect(()=>{if(ready&&account&&!account.guardianId)localStorage.setItem(STORE,JSON.stringify(account));},[account,ready]);
  useEffect(()=>{if(ready)localStorage.setItem("maestro.theme",theme);},[theme,ready]);
  useEffect(()=>{if(ready)localStorage.setItem(PROGRESS,JSON.stringify(progress));},[progress,ready]);
  useEffect(()=>{if(ready)localStorage.setItem(CHAT,JSON.stringify(chat.slice(-40)));},[chat,ready]);
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[chat,typing]);
  useEffect(()=>{setQuizAnswers({});},[activeLesson,step]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),2600);return()=>clearTimeout(t);},[toast]);

  async function createAccount(e:FormEvent){
    e.preventDefault();setError("");setNotice("");
    if(!name.trim()||!email.includes("@")||!learnerName.trim()){setError("Please complete each field with a valid email address.");return;}
    const supabase=createSupabaseClient();
    if(!supabase){setError("Cloud accounts are not configured yet. Add the Supabase project URL and publishable key to Vercel.");return;}
    const {error}=await supabase.auth.signInWithOtp({email:email.trim().toLowerCase(),options:{shouldCreateUser:true,emailRedirectTo:"https://maestro-ai-flame.vercel.app/",data:{display_name:name.trim(),learner_name:learnerName.trim(),age_band:ageBand}}});
    if(error){setError(error.message);return;}
    setNotice("We sent a secure sign-in link to "+email.trim()+". Open it on this device to finish creating the learner profile.");
  }
  async function signIn(e:FormEvent){
    e.preventDefault();setError("");setNotice("");
    const supabase=createSupabaseClient();
    if(!supabase){setError("Cloud sign-in is not configured. Set the Supabase project URL and publishable key in Vercel.");return;}
    const {error}=await supabase.auth.signInWithOtp({email:email.trim().toLowerCase(),options:{shouldCreateUser:false,emailRedirectTo:"https://maestro-ai-flame.vercel.app/"}});
    if(error){setError(error.message);return;}
    setNotice("A secure sign-in link has been sent to "+email.trim()+".");
  }
  async function finishLesson(){if(!lesson||!quizPassed)return;const now=new Date().toISOString();const score=Math.round(quizScore/assessment.length*100);const supabase=createSupabaseClient();let saved=false;const cloudReady=Boolean(supabase&&account?.id);if(supabase&&account?.id){const {data:previous}=await supabase.from("lesson_progress").select("attempts,best_score").eq("learner_id",account.id).eq("lesson_id",lesson.id).maybeSingle();const {error}=await supabase.from("lesson_progress").upsert({learner_id:account.id,lesson_id:lesson.id,status:"mastered",attempts:(previous?.attempts||0)+1,best_score:Math.max(Number(previous?.best_score)||0,score),mastered_at:now,updated_at:now},{onConflict:"learner_id,lesson_id"});saved=!error;}setProgress(p=>({...p,completed:p.completed.includes(lesson.id)?p.completed:[...p.completed,lesson.id],minutes:p.minutes+(p.completed.includes(lesson.id)?0:Number(lesson.duration.split(" ")[0])),lastActive:now}));setToast(saved?"Mastery achieved. Score and progress synced to your cloud account.":cloudReady?"Mastery achieved, but cloud sync failed. Please check your connection.":"Mastery achieved. Completion is saved locally; cloud sync is not configured yet.");setActiveLesson(null);setStep(0);setScreen("progress");}
  function note(freq:number){playTone(freq);setProgress(p=>({...p,notesPlayed:p.notesPlayed+1,lastActive:new Date().toISOString()}));}
  function noteMidi(midi:number){void playMidiNote(midi);setProgress(p=>({...p,notesPlayed:p.notesPlayed+1,lastActive:new Date().toISOString()}));}
  async function sendChat(e?:FormEvent){e?.preventDefault();const prompt=question.trim();if(!prompt||typing)return;const next=[...chat,{role:"user" as const,content:prompt}];setChat(next);setQuestion("");setTyping(true);setChatError("");try{const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:next.slice(-16),learnerAgeBand:account?.ageBand ?? "adult"})});const data=await r.json();if(!r.ok)throw new Error(data.error||"Maestro could not answer. Please try again.");if(typeof data.reply!=="string")throw new Error("Maestro returned an invalid response.");setChat(c=>[...c,{role:"assistant",content:data.reply}]);if(Array.isArray(data.actions)){for(const action of data.actions){const args=action.arguments||{};if(action.name==="play_music_example"){setScreen("practice");void playLessonExample(args.kind,args.rootMidi,args.bpm);setToast("Maestro is playing a lesson example.");}else if(action.name==="generate_composition"){const piece=generateProceduralComposition(String(args.prompt||"A warm piano sketch"),Number(args.bpm)||bpm);setGeneratedArrangement(piece);setScreen("practice");void playArrangement(piece);setToast("Maestro composed a new music sketch.");}else if(action.name==="open_practice_studio"){setScreen("practice");}else if(action.name==="start_metronome"){setBpm(Number(args.bpm)||bpm);setMetronome(true);setScreen("practice");}else if(action.name==="stop_music"){stopArrangement();setToast("Playback stopped.");}}}}catch(err){setChatError(err instanceof Error?err.message:"Connection problem. Please try again.");}finally{setTyping(false);}}
  async function switchLearnerProfile(profile:LearnerProfile){
    const supabase=createSupabaseClient();if(!supabase||!account?.guardianId)return;
    const {data:rows}=await supabase.from("lesson_progress").select("lesson_id,status,mastered_at").eq("learner_id",profile.id);
    const {data:pieces}=await supabase.from("generated_pieces").select("title,created_at,arrangement").eq("learner_id",profile.id).order("created_at",{ascending:false}).limit(30);
    setAccount({...account,id:profile.id,learnerName:profile.display_name,ageBand:profile.age_band});
    setProgress(prev=>({...prev,completed:(rows||[]).filter(row=>row.status==="mastered").map(row=>row.lesson_id)}));
    setWeeklyMinutes((rows||[]).filter(row=>row.status==="mastered"&&row.mastered_at&&new Date(row.mastered_at)>=new Date(weekStartDate())).reduce((sum,row)=>sum+(lessons.find(item=>item.id===row.lesson_id)?.minutes||0),0));
    const {data:goal}=await supabase.from("weekly_goals").select("target_minutes").eq("learner_id",profile.id).eq("week_start",weekStartDate()).maybeSingle();if(goal)setWeeklyGoalMinutes(goal.target_minutes);
    setSavedPieces((pieces||[]).map(piece=>({title:piece.title,createdAt:piece.created_at,arrangement:piece.arrangement as Arrangement})));
    setScreen("home");setToast("Switched to "+profile.display_name+"'s learning space.");
  }
  async function saveWeeklyGoal(){
    if(!account?.id){localStorage.setItem("maestro.weekly-goal",String(weeklyGoalMinutes));setToast("Weekly goal saved on this device.");return;}
    const supabase=createSupabaseClient();if(!supabase)return;
    const {error}=await supabase.from("weekly_goals").upsert({learner_id:account.id,target_minutes:weeklyGoalMinutes,week_start:weekStartDate()},{onConflict:"learner_id,week_start"});
    setToast(error?"Could not save the weekly goal.": "Weekly learning goal saved.");
  }
  async function addLearnerProfile(e:FormEvent){
    e.preventDefault();if(!newLearnerName.trim()||!account?.guardianId)return;
    const supabase=createSupabaseClient();if(!supabase)return;
    setProfileBusy(true);
    const {data,error}=await supabase.from("learner_profiles").insert({guardian_user_id:account.guardianId,display_name:newLearnerName.trim(),age_band:newLearnerAge}).select("id,display_name,age_band").single();
    setProfileBusy(false);
    if(error){setToast("Could not add learner: "+error.message);return;}
    const next=[...learnerProfiles,data as LearnerProfile];setLearnerProfiles(next);setNewLearnerName("");
    await switchLearnerProfile(data as LearnerProfile);
  }
  function signOut(){const supabase=createSupabaseClient();if(supabase)void supabase.auth.signOut();localStorage.removeItem(STORE);setAccount(null);setScreen("home");setActiveLesson(null);setShowParent(false);}
  function navTo(s:string){setScreen(s);setMobileMenu(false);if(s!=="learn")setActiveLesson(null);}
  const nav=[["home","Home",Home],["learn","Learn",BookOpen],["practice","Practice",Music2],["maestro","Maestro AI",MessageCircle],["progress","My progress",BarChart3],["profile","Profile",UserRound]] as const;
  const done=progress.completed.length;
  const earnedBadges=[{title:"First steps",detail:"Complete your first lesson",earned:done>=1,icon:Sparkles},{title:"Rhythm keeper",detail:"Master a rhythm lesson",earned:lessons.some(x=>x.category==="Rhythm"&&progress.completed.includes(x.id)),icon:Drum},{title:"Theory builder",detail:"Master notation or scales",earned:lessons.some(x=>["Notation","Scales"].includes(x.category)&&progress.completed.includes(x.id)),icon:BookOpen},{title:"Harmony listener",detail:"Master chords or harmony",earned:lessons.some(x=>["Chords","Harmony"].includes(x.category)&&progress.completed.includes(x.id)),icon:Headphones},{title:"Composer",detail:"Finish a composition lesson",earned:lessons.some(x=>x.category==="Composition"&&progress.completed.includes(x.id)),icon:WandSparkles},{title:"Dedicated musician",detail:"Complete ten lessons",earned:done>=10,icon:Heart}];
  const currentDate=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
  function renderHome(){
    return <><div className="page-heading"><div><span className="eyebrow">{currentDate.toUpperCase()}</span><h1>Welcome back, <em>{account?.learnerName}.</em></h1><p>Your next musical discovery is just a note away.</p></div><button className="outline-button" onClick={()=>navTo("profile")}><UserRound size={16}/> Profile settings</button></div><section className="welcome-panel"><div><span className="eyebrow light"><Sparkles size={14}/> YOUR NEXT STEP</span><h2>Learn something<br/>new today.</h2><p>Explore a guided lesson, practise a few notes or ask Maestro for help.</p><button className="white-button" onClick={()=>navTo("learn")}>Explore lessons <ArrowRight size={16}/></button></div><div className="welcome-graphic"><div className="graphic-ring"/><div className="graphic-note"><AudioLines size={46}/></div><span>LISTEN · PLAY · GROW</span></div></section><div className="metric-grid"><article><span className="metric-icon"><BookOpen/></span><small>Lessons completed</small><b>{done}</b><p>{done===0?"Your first lesson is waiting.":"Lessons you've finished"}</p></article><article><span className="metric-icon"><Clock3/></span><small>Learning time</small><b>{progress.minutes} min</b><p>Time from completed lessons</p></article><article><span className="metric-icon"><Piano/></span><small>Notes explored</small><b>{progress.notesPlayed}</b><p>Notes played in the practice studio</p></article></div><div className="section-heading"><div><span className="eyebrow">A GOOD PLACE TO START</span><h2>Learning pathways</h2></div><button className="text-link" onClick={()=>navTo("learn")}>All lessons <ChevronRight size={16}/></button></div><div className="pathway-grid">{lessons.slice(0,3).map(item=>{const Icon=item.icon;return <article className="pathway-card" key={item.id}><div className="pathway-icon"><Icon size={25}/></div><span className="card-category">{item.category} · {item.duration}</span><h3>{item.title}</h3><p>{item.description}</p><button onClick={()=>{setActiveLesson(item.id);setStep(0);setQuizAnswers({});navTo("learn");}}>Open lesson <ArrowRight size={15}/></button></article>})}</div><section className="tutor-callout"><span><WandSparkles size={24}/></span><div><b>Need a little guidance?</b><p>Ask Maestro to explain a music concept or help you plan your practice.</p></div><button onClick={()=>navTo("maestro")}>Talk to Maestro <ArrowRight size={15}/></button></section></>;
  }
  function renderLearn(){
    if(lesson){
      const Icon=lesson.icon;
      return <section className="lesson-panel"><div className="lesson-progress"><span>CHAPTER {step+1} OF {lesson.steps.length}</span><div><i style={{width:((step+1)/lesson.steps.length*100)+"%"}}/></div></div><div className="lesson-center"><span className="lesson-large-icon"><Icon size={42}/></span><span className="eyebrow">{lesson.category.toUpperCase()} · {lesson.level}</span><h2>{lesson.title}</h2><p className="lesson-instruction">{lesson.steps[step]}</p><div className="lesson-practice-keys"><span>HEAR THIS CONCEPT</span><div><button onClick={()=>void playLessonExample(lesson.audio.kind,lesson.audio.rootMidi,bpm)}><Play size={14}/> Play musical example</button></div></div>{step===lesson.steps.length-1&&<div className="lesson-practice-keys mastery-check"><span>MASTERY CHECK · {quizScore}/{assessment.length} CORRECT · PASS AT 75%</span>{assessment.map((item,questionIndex)=><div className="assessment-question" key={questionIndex}><b>{questionIndex+1}. {item.prompt}</b><div>{item.options.map((option,index)=><button key={option} className={quizAnswers[questionIndex]===index?(index===item.answer?"answer-correct":"answer-wrong"):""} onClick={()=>setQuizAnswers(previous=>({...previous,[questionIndex]:index}))}>{String.fromCharCode(65+index)}. {option}</button>)}</div>{quizAnswers[questionIndex]!==undefined&&<p className={quizAnswers[questionIndex]===item.answer?"answer-feedback correct":"answer-feedback"}>{quizAnswers[questionIndex]===item.answer?"Correct. ":"Review this one. "}{item.feedback}</p>}</div>)}<p className={quizPassed?"answer-feedback correct":"answer-feedback"}>{quizPassed?"You have met the mastery standard.":"You need "+Math.ceil(assessment.length*0.75)+" correct answers to pass. Review the explanations and try again."}</p></div>}{lesson.category==="Piano"&&<div className="lesson-practice-keys"><span>TRY IT ON THE KEYS</span><div>{[{label:"C",freq:261.63},{label:"D",freq:293.66},{label:"E",freq:329.63},{label:"F",freq:349.23},{label:"G",freq:392},{label:"A",freq:440},{label:"B",freq:493.88}].map(k=><button key={k.label} onClick={()=>note(k.freq)}>{k.label}</button>)}</div>{lesson.id==="chords"&&<button className="chord-play-button" onClick={()=>{playChord([261.63,329.63,392]);setProgress(p=>({...p,notesPlayed:p.notesPlayed+3,lastActive:new Date().toISOString()}));setToast("C major chord played");}}><Play size={14}/> Hear C major chord</button>}</div>}{lesson.category==="Listening"&&<div className="lesson-practice-keys"><span>COMPARE THESE SOUNDS</span><div><button onClick={()=>note(196)}>Low sound</button><button onClick={()=>note(659.25)}>High sound</button></div></div>}{lesson.category==="Rhythm"&&<div className="lesson-practice-keys"><span>FEEL THE PULSE</span><div><button onClick={playClick}><Play size={14}/> Hear one beat</button><button onClick={()=>{playClick();setTimeout(playClick,500);setTimeout(playClick,1000);setTimeout(playClick,1500);}}>Hear four beats</button></div></div>}<div className="lesson-coach-tip"><Sparkles size={18}/><span>Take your time. There is no need to rush. Try the activity and move on when you're ready.</span></div></div><div className="lesson-controls"><button className="outline-button" disabled={step===0} onClick={()=>setStep(v=>v-1)}><ChevronLeft size={16}/> Back</button>{step===lesson.steps.length-1?<button className="primary-button" disabled={!quizPassed} onClick={()=>void finishLesson()}>Complete lesson <Check size={17}/></button>:<button className="primary-button" onClick={()=>setStep(v=>v+1)}>Next step <ChevronRight size={17}/></button>}</div></section>;
    }
    const categories=["All",...Array.from(new Set(lessons.map(x=>x.category)))];
    const learnerBand=account?.ageBand??"adult";
    const visibleLessons=lessons.filter(x=>x.ageBands.includes(learnerBand)&&(learnerBand!=="4-8"||x.level!=="Developing")&&(lessonCategory==="All"||x.category===lessonCategory)&&`${x.title} ${x.description} ${x.category}`.toLowerCase().includes(lessonQuery.toLowerCase()));
    return <><div className="lesson-toolbar"><label className="lesson-search"><CircleHelp size={17}/><input value={lessonQuery} onChange={e=>setLessonQuery(e.target.value)} placeholder="Search lessons, skills or instruments…" aria-label="Search lessons"/></label><span className="lesson-count">{visibleLessons.length} lessons</span></div><div className="lesson-filters">{categories.map(c=><button key={c} className={lessonCategory===c?"filter-chip selected":"filter-chip"} onClick={()=>setLessonCategory(c)}>{c}</button>)}</div>{visibleLessons.length?<div className="lesson-grid">{visibleLessons.map(item=>{const Icon=item.icon;const completed=progress.completed.includes(item.id);return <article className="lesson-card" key={item.id}><div className="lesson-card-top"><span className="lesson-card-icon"><Icon/></span>{completed?<span className="completed-tag"><Check size={13}/> Completed</span>:<span className="card-category">{item.duration}</span>}</div><span className="card-category">{item.category}</span><h3>{item.title}</h3><p>{item.description}</p><button className="lesson-open" onClick={()=>{setActiveLesson(item.id);setStep(0);setQuizAnswers({});}}>{completed?"Review lesson":"Start lesson"} <ArrowRight size={15}/></button></article>})}</div>:<div className="empty-state"><h3>No lessons found</h3><p>Try another search or choose a different category.</p><button className="outline-button" onClick={()=>{setLessonQuery("");setLessonCategory("All");}}>Clear filters</button></div>}</>;
  }
  function renderPractice(){
    const allNotes=Array.from({length:36},(_,index)=>48+index);
    const blackPitchClasses=[1,3,6,8,10];
    const whiteNotes=allNotes.filter(midi=>!blackPitchClasses.includes(midi%12));
    const blackNotes=allNotes.filter(midi=>blackPitchClasses.includes(midi%12)).map(midi=>({midi,left:((whiteNotes.filter(note=>note<midi).length+0.68)/whiteNotes.length*100)+"%"}));
    const noteLabel=(midi:number)=>["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"][midi%12]+(Math.floor(midi/12)-1);
    return <><div className="page-heading"><div><span className="eyebrow">INTERACTIVE PRACTICE</span><h1>Make a little <em>music.</em></h1><p>Play notes, listen closely and explore the keyboard.</p></div></div><section className="practice-panel"><div className="practice-title"><div><span className="eyebrow">VIRTUAL PIANO</span><h2>Explore the keys</h2><p>Tap a key to hear its note. Works with touch or mouse.</p></div><span className="practice-title-icon"><Piano size={29}/></span></div><div className="piano-wrap"><div className="piano-keys">{whiteNotes.map(midi=><button key={midi} className="piano-key" aria-label={"Play "+noteLabel(midi)} onClick={()=>noteMidi(midi)}><span>{midi%12===0?noteLabel(midi):["C","D","E","F","G","A","B"][[0,2,4,5,7,9,11].indexOf(midi%12)]}</span></button>)}<div className="black-keys">{blackNotes.map(key=><button key={key.midi} style={{left:key.left}} aria-label={"Play "+noteLabel(key.midi)} title={noteLabel(key.midi)} onClick={()=>noteMidi(key.midi)}><span>{noteLabel(key.midi)}</span></button>)}</div></div></div><p className="practice-count"><Volume2 size={16}/> {progress.notesPlayed} notes played in this profile</p></section><section className="practice-panel guitar-panel"><div className="practice-title"><div><span className="eyebrow">GUITAR PRACTICE</span><h2>Explore the fretboard</h2><p>Tap any fret to hear its note, or choose a chord to hear the complete voicing.</p></div><span className="practice-title-icon"><Guitar size={28}/></span></div><GuitarFretboard/></section><section className="practice-panel composition-generator"><div className="practice-title"><div><span className="eyebrow">COMPOSITION LAB</span><h2>Make an original music sketch</h2><p>Describe a mood, key or musical style. Maestro creates a four-bar melody, harmony, bass and rhythm locally, then plays it immediately.</p></div><span className="practice-title-icon"><WandSparkles size={28}/></span></div><label className="composition-prompt-label">What should it sound like?<textarea value={compositionPrompt} onChange={e=>setCompositionPrompt(e.target.value)} rows={2} placeholder="e.g. A calm piano waltz in A minor"/></label><div className="backing-track-controls"><button className="primary-button" disabled={!compositionPrompt.trim()} onClick={()=>{const piece=generateProceduralComposition(compositionPrompt,bpm);setGeneratedArrangement(piece);setMutedTracks(mutedTracksState);void playArrangement(piece);setToast("Your new music sketch is playing.");}}><WandSparkles size={16}/> Generate & play</button>{generatedArrangement&&<><button className="outline-button" onClick={()=>void playArrangement(generatedArrangement)}><Play size={16}/> Play again</button><button className="outline-button" onClick={()=>exportArrangementMidi(generatedArrangement)}>Export MIDI</button><button className="outline-button" onClick={()=>{const piece={title:generatedArrangement.title,createdAt:new Date().toISOString(),arrangement:generatedArrangement};const next=[piece,...savedPieces].slice(0,30);setSavedPieces(next);localStorage.setItem("maestro.library.v1",JSON.stringify(next));const supabase=createSupabaseClient();if(supabase&&account?.id){void supabase.from("generated_pieces").insert({learner_id:account.id,title:generatedArrangement.title,prompt:compositionPrompt,provider:"procedural",model:"maestro-procedural-v1",arrangement:generatedArrangement,duration_seconds:Math.round(generatedArrangement.bars*generatedArrangement.beatsPerBar*60/generatedArrangement.bpm)}).then(({error})=>setToast(error?"Saved on this device; cloud save failed.":"Composition saved to your cloud library."));}else{setToast("Saved to your local music library.");}}}>Save piece</button></>}</div>{generatedArrangement&&<p className="generated-piece-label"><Check size={14}/> {generatedArrangement.title} · {generatedArrangement.events.length} note events · {generatedArrangement.bpm} BPM</p>}<div className="saved-library"><div className="saved-library-heading"><b>Your music library</b><span>{savedPieces.length} saved</span></div>{savedPieces.length===0?<p>Your compositions will appear here when you save them.</p>:savedPieces.slice(0,4).map((piece,index)=><div className="saved-piece-row" key={piece.createdAt+index}><span><Music2 size={16}/></span><b>{piece.title}</b><button onClick={()=>{setGeneratedArrangement(piece.arrangement);void playArrangement(piece.arrangement);}} aria-label={"Play "+piece.title}><Play size={14}/></button><button onClick={()=>exportArrangementMidi(piece.arrangement)} aria-label={"Export "+piece.title}>MIDI</button></div>)}</div></section><section className="practice-panel backing-track-panel"><div className="practice-title"><div><span className="eyebrow">GENERATED MUSIC · C MAJOR</span><h2>A complete four-bar arrangement</h2><p>Melody, chord harmony, bass and a steady drum pulse. Change the tempo, mute individual parts or export the arrangement as MIDI.</p></div><span className="practice-title-icon"><AudioLines size={29}/></span></div><div className="backing-track-controls"><button className="primary-button" onClick={()=>{setMutedTracks(mutedTracksState);void playArrangement(makeCmajorStudy(bpm));}}><Play size={16}/> Play arrangement</button><button className="outline-button" onClick={stopArrangement}><Pause size={16}/> Stop</button><button className="outline-button" onClick={()=>exportArrangementMidi(makeCmajorStudy(bpm))}>Export MIDI</button></div><div className="track-mutes"><span>TRACKS</span>{(["melody","harmony","bass","drums"] as TrackName[]).map(track=><button key={track} className={mutedTracksState.includes(track)?"track-muted":""} onClick={()=>{const next=mutedTracksState.includes(track)?mutedTracksState.filter(x=>x!==track):[...mutedTracksState,track];setMutedTracksState(next);setMutedTracks(next);}}>{track}</button>)}</div></section><section className="practice-tools"><article><DrumPad/><p>Build a groove with a steady pulse and the five drum sounds.</p><div className="tempo-control"><button className="tempo-step" onClick={()=>setBpm(v=>Math.max(40,v-5))} aria-label="Decrease tempo">−</button><strong>{bpm} <small>BPM</small></strong><button className="tempo-step" onClick={()=>setBpm(v=>Math.min(220,v+5))} aria-label="Increase tempo">+</button></div><button className={metronome?"primary-button":"outline-button"} onClick={()=>setMetronome(v=>!v)}>{metronome?<Pause size={16}/>:<Play size={16}/>} {metronome?"Stop pulse":"Start pulse"}</button>{metronome&&<Metronome bpm={bpm}/>}</article><article><VoicePitchDetector/></article></section></>;
  }
  if(!ready)return <main className="loading-screen"><AudioLines/><span>Preparing your music space…</span></main>;
  if(!account)return <main className="auth-shell"><section className="auth-art"><div className="auth-brand"><span className="brand-mark"><AudioLines/></span>maestro<span className="brand-ai">AI</span></div><div className="auth-message"><span className="eyebrow light">A SPACE TO GROW THROUGH MUSIC</span><h1>Every sound is a <em>beginning.</em></h1><p>A thoughtful music-learning space for curious little listeners and lifelong learners.</p><div className="sound-orbit"><span><Music2/></span><i/><b/><small>LISTEN · LEARN · CREATE</small></div></div><div className="auth-foot">MADE FOR EVERY AGE. BUILT AROUND MUSIC.</div></section><section className="auth-form-wrap"><div className="auth-mobile-brand"><span className="brand-mark"><AudioLines/></span> maestro AI</div><div className="auth-form"><span className="eyebrow">YOUR MUSIC JOURNEY STARTS HERE</span><h2>{register?"Create your space":"Welcome back"}</h2><p className="auth-sub">{register?"Create a secure account to save learning progress across your devices.":"Sign in with a secure email link."}</p><div className="auth-switch"><button className={register?"selected":""} onClick={()=>{setRegister(true);setError("");}}>Create profile</button><button className={!register?"selected":""} onClick={()=>{setRegister(false);setError("");}}>Sign in</button></div><form onSubmit={register?createAccount:signIn} className="form-fields">{register&&<><label>Your name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Parent, guardian or learner" required/><User size={16}/></label><label>Learner's name<input value={learnerName} onChange={e=>setLearnerName(e.target.value)} placeholder="Who is learning music?" required/><UserRound size={16}/></label></>}<label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/><Mail size={16}/></label>{register&&<><div className="field-label">Choose the learner's age experience</div><div className="age-options"><button type="button" className={ageBand==="4-8"?"age-choice chosen toddler-choice":"age-choice"} onClick={()=>setAgeBand("4-8")}><Baby/><b>Toddler Mode · 0–3</b><small>Playful, parent-guided discovery</small></button><button type="button" className={ageBand!=="4-8"?"age-choice chosen":"age-choice"} onClick={()=>setAgeBand("9-16")}><Sparkles/><b>General Mode · 4+</b><small>Lessons, instruments and music skills</small></button></div>{ageBand==="4-8"&&<p className="guardian-note"><LockKeyhole size={14}/> For ages 0–3, a parent or guardian manages the learner profile and should guide every activity.</p>}</>}{error&&<p className="form-error">{error}</p>}{notice&&<p className="auth-notice">{notice}</p>}<button className="primary-button auth-submit" type="submit">{register?"Create my profile":"Open my profile"} <ArrowRight size={17}/></button></form><p className="local-note"><LockKeyhole size={14}/> Your account is protected by Supabase email authentication. Child profiles are managed by their guardian.</p></div></section></main>;

  if(toddler&&!showParent)return <main className="toddler-app"><header className="toddler-top"><div className="toddler-brand"><span className="brand-mark"><AudioLines/></span>maestro</div><div className="toddler-top-actions">{screen!=="home"&&<button className="parent-button" onClick={()=>navTo("home")}><ChevronLeft size={17}/> Home</button>}<button className="parent-button" onClick={()=>setShowParent(true)}><LockKeyhole size={17}/> Grown-ups</button></div></header>{screen==="home"?<><section className="toddler-welcome"><span className="toddler-kicker">HELLO, {account.learnerName.toUpperCase()}!</span><h1>Let's make some <em>music!</em></h1><p>Tap a big button and let's play together.</p><div className="toddler-character"><div className="music-sun"><Music2 size={68}/></div><span className="float-note note-a">♪</span><span className="float-note note-b">♫</span><span className="float-note note-c">✦</span></div></section><section className="toddler-actions"><button className="toddler-action action-piano" onClick={()=>navTo("practice")}><span><Piano size={39}/></span><b>Play sounds</b><small>Tap the piano keys</small><ChevronRight/></button><button className="toddler-action action-rhythm" onClick={()=>{note(392);setToast("Lovely sound!");}}><span><Drum size={39}/></span><b>Tap the beat</b><small>Make a happy rhythm</small><ChevronRight/></button><button className="toddler-action action-listen" onClick={()=>navTo("learn")}><span><Headphones size={39}/></span><b>Listen & learn</b><small>Explore sounds together</small><ChevronRight/></button><button className="toddler-action action-sing" onClick={()=>setShowParent(true)}><span><Mic2 size={39}/></span><b>Sing with me</b><small>Ask your grown-up to help</small><ChevronRight/></button></section></>:screen==="practice"?<section className="toddler-child-screen"><span className="toddler-kicker">MUSIC PLAYGROUND</span><h1>Tap a key!</h1><p>Listen to each lovely sound.</p><div className="toddler-keyboard">{[{n:"C",f:261.63,c:"#f9d88b"},{n:"D",f:293.66,c:"#f6b7a6"},{n:"E",f:329.63,c:"#b8ddc9"},{n:"F",f:349.23,c:"#c8c0ef"},{n:"G",f:392,c:"#f4d58b"}].map(k=><button key={k.n} style={{background:k.c}} onClick={()=>note(k.f)}>{k.n}</button>)}</div><button className="child-home-button" onClick={()=>navTo("home")}>I'm finished <Check/></button></section>:<section className="toddler-child-screen"><span className="toddler-kicker">LISTEN & LEARN</span><h1>Explore sounds!</h1><p>Tap a picture and listen together.</p><div className="toddler-sound-grid"><button onClick={()=>note(261.63)}><Piano/><b>Low note</b></button><button onClick={()=>note(659.25)}><Music2/><b>High note</b></button><button onClick={()=>note(392)}><Drum/><b>Bright sound</b></button><button onClick={()=>note(196)}><Headphones/><b>Deep sound</b></button></div><button className="child-home-button" onClick={()=>navTo("home")}>I'm finished <Check/></button></section>}<footer className="toddler-footer">Little steps. Lovely sounds. <Heart size={15} fill="currentColor"/></footer>{toast&&<div className="toast">{toast}</div>}</main>;

  return <main className={"maestro-app theme-"+theme+(toddler?" toddler-parent":"")}>
    <aside className={mobileMenu?"app-sidebar sidebar-open":"app-sidebar"}><div className="app-brand"><span className="brand-mark"><AudioLines/></span><span>maestro<small>AI MUSIC LEARNING</small></span><button className="sidebar-close" onClick={()=>setMobileMenu(false)}><X/></button></div><div className="sidebar-label">YOUR WORKSPACE</div><nav>{nav.map(([id,label,Icon])=><button key={id} className={screen===id?"side-link active":"side-link"} onClick={()=>navTo(id)}><Icon size={19}/><span>{label}</span>{id==="maestro"&&<i className="live-dot"/>}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-tip"><Sparkles size={18}/><b>Make time for music.</b><p>A few minutes of practice can make a difference.</p></div><button className="side-link" onClick={()=>navTo("profile")}><Settings size={18}/>Settings</button><div className="account-mini"><span>{account.learnerName.slice(0,1).toUpperCase()}</span><div><b>{account.learnerName}</b><small>{toddler?"Parent-managed profile":"Learner profile"}</small></div><button onClick={signOut} aria-label="Sign out"><LogOut size={16}/></button></div></div></aside>
    {mobileMenu&&<button className="mobile-scrim" onClick={()=>setMobileMenu(false)} aria-label="Close menu"/>}
    <section className="app-main"><header className="app-header"><button className="mobile-menu" onClick={()=>setMobileMenu(true)} aria-label="Open menu"><Menu/></button><div className="header-breadcrumb">My workspace <ChevronRight size={14}/><b>{nav.find(n=>n[0]===screen)?.[1]||"Home"}</b></div><div className="header-profile"><span className="status-dot"/> <span>{account.learnerName}</span><button onClick={()=>setTheme(v=>v==="dark"?"light":"dark")} aria-label={theme==="dark"?"Switch to light mode":"Switch to dark mode"} title={theme==="dark"?"Light mode":"Dark mode"}>{theme==="dark"?<Sun size={17}/>:<Moon size={17}/>}</button><button onClick={()=>navTo("profile")} aria-label="Profile"><UserRound size={18}/></button></div></header>
    <div className="page-content">
      {screen==="home"&&renderHome()}
      {screen==="learn"&&<><div className="page-heading"><div><span className="eyebrow">GUIDED MUSIC LEARNING</span><h1>{lesson?"Your lesson":"Learn at your own pace."}</h1><p>{lesson?lesson.description:"Choose a lesson and build your skills one small step at a time."}</p></div>{lesson&&<button className="outline-button" onClick={()=>setActiveLesson(null)}><ChevronLeft size={16}/> All lessons</button>}</div>{renderLearn()}</>}
      {screen==="practice"&&renderPractice()}
      {screen==="maestro"&&<><div className="page-heading"><div><span className="eyebrow">YOUR AI MUSIC TUTOR</span><h1>Talk music with <em>Maestro.</em></h1><p>Ask questions, get explanations and work through music ideas together.</p></div></div><section className="maestro-chat"><div className="maestro-chat-head"><span className="maestro-avatar"><AudioLines/></span><div><b>Maestro AI</b><small>GPT-OSS open-weight tutor · Text chat</small></div><span className="online-label"><i/> Ready to help</span></div><div className="chat-transcript">{chat.length===0&&<div className="chat-empty"><span><WandSparkles size={30}/></span><h2>What would you like to learn?</h2><p>Ask about piano, guitar, singing, rhythm, music theory or your next practice session.</p><div className="prompt-suggestions"><button onClick={()=>setQuestion("Teach me three beginner piano chords.")}>Teach me piano chords</button><button onClick={()=>setQuestion("Explain rhythm in a simple way.")}>Explain rhythm</button><button onClick={()=>setQuestion("Help me make a 10-minute practice plan.")}>Make a practice plan</button></div></div>}{chat.map((m,i)=><div key={i} className={"chat-line "+(m.role==="user"?"from-user":"from-maestro")}><span className="chat-avatar">{m.role==="user"?account.learnerName.slice(0,1).toUpperCase():<AudioLines size={16}/>}</span><div className="chat-bubble"><small>{m.role==="user"?account.learnerName:"Maestro"}</small><p>{m.content}</p></div></div>)}{typing&&<div className="chat-line from-maestro"><span className="chat-avatar"><AudioLines size={16}/></span><div className="chat-bubble"><small>Maestro</small><p className="typing-text">Thinking through your question…</p></div></div>}<div ref={chatEnd}/></div>{chatError&&<div className="chat-error"><CircleHelp size={16}/><span>{chatError}</span><button onClick={()=>setChatError("")}>Dismiss</button></div>}<form className="chat-composer" onSubmit={sendChat}><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask Maestro about music…" rows={2} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}}/><button disabled={!question.trim()||typing} aria-label="Send message"><Send size={18}/></button></form><div className="chat-disclaimer">Maestro is an AI learning assistant. Check important health or instrument-safety advice with a qualified teacher.</div></section></>}
      {screen==="progress"&&<><div className="page-heading"><div><span className="eyebrow">YOUR LEARNING RECORD</span><h1>Progress that is <em>yours.</em></h1><p>{account.guardianId?"Your mastered lessons are synced to your learner account.":"Your completed activities are saved in this browser."}</p></div></div><section className="weekly-goal-card"><div><span className="eyebrow">THIS WEEK</span><h2>Learning goal</h2><p>Time represented by lessons you have mastered this week.</p></div><div className="weekly-goal-value"><b>{weeklyMinutes}</b><span>/ {weeklyGoalMinutes} min</span></div><div className="weekly-goal-track"><i style={{width:Math.min(100,weeklyMinutes/Math.max(1,weeklyGoalMinutes)*100)+"%"}}/></div></section><div className="progress-summary"><article><BookOpen/><small>Lessons completed</small><b>{done}</b></article><article><Clock3/><small>Learning minutes</small><b>{progress.minutes}</b></article><article><Music2/><small>Notes explored</small><b>{progress.notesPlayed}</b></article></div><section className="achievement-section"><div className="section-heading"><div><span className="eyebrow">MILESTONES</span><h2>Achievements</h2></div><span className="achievement-count">{earnedBadges.filter(b=>b.earned).length} / {earnedBadges.length} earned</span></div><div className="achievement-grid">{earnedBadges.map(badge=>{const Icon=badge.icon;return <article key={badge.title} className={badge.earned?"achievement-card earned":"achievement-card"}><span><Icon size={19}/></span><div><b>{badge.title}</b><small>{badge.detail}</small></div><strong>{badge.earned?"Earned":"Locked"}</strong></article>})}</div></section><section className="progress-list"><div className="section-heading"><div><span className="eyebrow">LESSON HISTORY</span><h2>Your learning record</h2></div></div>{done===0?<div className="empty-state"><span><Target size={26}/></span><h3>Your progress starts with one lesson.</h3><p>Complete a lesson and it will appear here.</p><button className="primary-button" onClick={()=>navTo("learn")}>Browse lessons <ArrowRight size={16}/></button></div>:lessons.filter(x=>progress.completed.includes(x.id)).map(x=><div className="progress-row" key={x.id}><span><Check size={17}/></span><div><b>{x.title}</b><small>{x.category} · {x.duration}</small></div><strong>Completed</strong></div>)}</section></>}
      {screen==="profile"&&<><div className="page-heading"><div><span className="eyebrow">PROFILE & PREFERENCES</span><h1>Your music <em>space.</em></h1><p>Manage learner accounts, family access and learning preferences.</p></div></div><section className="settings-panel family-panel"><h3>Parent & family dashboard</h3><p>Manage the learners connected to this guardian account. Each learner keeps a separate progress record.</p>{learnerProfiles.map(profile=><div className="setting-row" key={profile.id}><span><b>{profile.display_name}</b><small>{profile.age_band==="4-8"?"4–8 years":profile.age_band==="9-16"?"9–16 years":"Adult"} · Learner profile</small></span><button className="outline-button" disabled={profile.id===account.id} onClick={()=>void switchLearnerProfile(profile)}>{profile.id===account.id?"Current learner":"Switch"}</button></div>)}<div className="weekly-goal-setting"><label>Weekly learning goal<input type="number" min="5" max="600" step="5" value={weeklyGoalMinutes} onChange={e=>setWeeklyGoalMinutes(Math.max(5,Math.min(600,Number(e.target.value)||5)))}/></label><button className="outline-button" onClick={()=>void saveWeeklyGoal()}>Save weekly goal</button></div><form className="family-add-form" onSubmit={addLearnerProfile}><label>Add another learner<input value={newLearnerName} onChange={e=>setNewLearnerName(e.target.value)} placeholder="Learner's name" required/></label><label>Age group<select value={newLearnerAge} onChange={e=>setNewLearnerAge(e.target.value as "4-8"|"9-16"|"adult")}><option value="4-8">4–8 years</option><option value="9-16">9–16 years</option><option value="adult">Adult</option></select></label><button className="primary-button" disabled={profileBusy||!newLearnerName.trim()}>{profileBusy?"Adding…":"Add learner profile"}</button></form></section><section className="profile-panel"><div className="profile-avatar">{account.learnerName.slice(0,1).toUpperCase()}</div><div><span className="eyebrow">LEARNER PROFILE</span><h2>{account.learnerName}</h2><p>{account.email}</p><span className="profile-age">{toddler?"4–8 years · Parent-guided":account.ageBand==="9-16"?"9–16 years":"Adult learner"}</span></div></section><section className="settings-panel"><h3>Profile details</h3><div className="setting-row"><span>Account holder</span><b>{account.name}</b></div><div className="setting-row"><span>Learner</span><b>{account.learnerName}</b></div><div className="setting-row"><span>Age experience</span><b>{toddler?"4–8 years":account.ageBand==="9-16"?"9–16 years":"Adult"}</b></div><div className="setting-row"><span>Storage</span><b>{account.guardianId?"Supabase cloud account":"Legacy local profile"}</b></div>{account.guardianId?<p className="storage-warning"><LockKeyhole size={16}/> Your learner profile and mastered lessons sync through your authenticated guardian account.</p>:<p className="storage-warning"><LockKeyhole size={16}/> This legacy profile is local to this browser. Create a cloud account to enable cross-device sync.</p>}<button className="danger-button" onClick={signOut}><LogOut size={16}/> Sign out of this profile</button></section></>}
    </div><footer className="app-footer"><span>MAESTRO AI</span><span>Music learning for every age.</span></footer></section>
    <nav className="mobile-bottom-nav">{nav.slice(0,5).map(([id,label,Icon])=><button key={id} className={screen===id?"mobile-nav-active":""} onClick={()=>navTo(id)}><Icon size={19}/><span>{id==="progress"?"Progress":id==="maestro"?"Maestro":label}</span></button>)}</nav>
    {toast&&<div className="toast"><Check size={16}/>{toast}</div>}
  </main>;
}


function detectFundamental(buffer:Float32Array,sampleRate:number):number|null{
  let sum=0;for(let i=0;i<buffer.length;i++)sum+=buffer[i]*buffer[i];
  const rms=Math.sqrt(sum/buffer.length);if(rms<0.012)return null;
  let start=0,end=buffer.length-1;const threshold=0.2;
  while(start<end&&Math.abs(buffer[start])<threshold)start++;
  while(end>start&&Math.abs(buffer[end])<threshold)end--;
  const signal=buffer.slice(start,end+1);if(signal.length<64)return null;
  const reducedLength=Math.floor(signal.length/4);const reduced=new Float32Array(reducedLength);
  for(let i=0;i<reducedLength;i++)reduced[i]=signal[i*4];
  const effectiveRate=sampleRate/4;
  const minLag=Math.max(2,Math.floor(effectiveRate/1000));
  const maxLag=Math.min(reduced.length-2,Math.ceil(effectiveRate/65));
  const correlations=new Float32Array(maxLag+2);
  for(let lag=minLag;lag<=maxLag+1;lag++){let value=0;for(let i=0;i<reduced.length-lag;i++)value+=reduced[i]*reduced[i+lag];correlations[lag]=value;}
  let best=-1,peak=-1;for(let lag=minLag;lag<=maxLag;lag++){if(correlations[lag]>peak){peak=correlations[lag];best=lag;}}
  if(best<minLag||best>=maxLag)return null;
  const left=correlations[best-1],centre=correlations[best],right=correlations[best+1];
  const curve=0.5*(left-right)/(left-2*centre+right);
  const period=best+curve;const frequency=effectiveRate/period;
  return frequency>=65&&frequency<=1000?frequency:null;
}
function GuitarFretboard(){
  const strings=[{name:"E2",midi:40},{name:"A2",midi:45},{name:"D3",midi:50},{name:"G3",midi:55},{name:"B3",midi:59},{name:"E4",midi:64}];
  const chords:Record<string,number[]>={C:[-1,3,2,0,1,0],G:[3,2,0,0,0,3],D:[-1,-1,0,2,3,2],Em:[0,2,2,0,0,0],Am:[-1,0,2,2,1,0]};
  const [selected,setSelected]=useState("C");
  const shape=chords[selected];
  const noteNames=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
  return <div className="guitar-fretboard"><div className="guitar-chord-picker">{Object.keys(chords).map(name=><button key={name} className={selected===name?"selected":""} onClick={()=>{setSelected(name);void playMidiChord(chords[name].map((fret,index)=>fret>=0?strings[index].midi+fret:null).filter((note):note is number=>note!==null));}}>{name}</button>)}</div><div className="fretboard-grid"><span className="fretboard-corner">STRING</span>{[0,1,2,3,4,5].map(fret=><span className="fret-number" key={fret}>{fret===0?"OPEN":fret}</span>)}{strings.map((string,index)=><Fragment key={string.name}><b className="string-label">{string.name}</b>{[0,1,2,3,4,5].map(fret=>{const active=shape[index]===fret;return <button key={fret} className={active?"fret-cell active":"fret-cell"} onClick={()=>void playMidiNote(string.midi+fret)} aria-label={string.name+" fret "+fret}><i/></button>;})}</Fragment>)}</div><p className="fretboard-help">Standard tuning · Low E to high E · Frets 0–5</p></div>;
}

function DrumPad(){
  const pads:[ "kick"|"snare"|"hat"|"tom"|"clap",string,string ][]=[["kick","Kick","K"],["snare","Snare","S"],["hat","Hi-hat","H"],["tom","Tom","T"],["clap","Clap","C"]];
  return <div className="drum-pad"><span className="tool-icon"><Drum/></span><h3>Drum pad</h3><div className="drum-pad-grid">{pads.map(([id,label,key])=><button key={id} onClick={()=>void playDrumPad(id)}><b>{key}</b><span>{label}</span></button>)}</div></div>;
}

function VoicePitchDetector(){
  const [running,setRunning]=useState(false);
  const [pitch,setPitch]=useState<number|null>(null);
  const [error,setError]=useState("");
  const [recording,setRecording]=useState(false);
  const [recordedUrl,setRecordedUrl]=useState<string|null>(null);
  const contextRef=useRef<AudioContext|null>(null);
  const recorderRef=useRef<MediaRecorder|null>(null);
  const chunksRef=useRef<Blob[]>([]);
  const streamRef=useRef<MediaStream|null>(null);
  const frameRef=useRef<number|null>(null);
  async function start(){
    setError("");
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error("Microphone access is not available in this browser.");
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      const context=new AudioContext();await context.resume();
      const source=context.createMediaStreamSource(stream);const analyser=context.createAnalyser();analyser.fftSize=4096;analyser.smoothingTimeConstant=0.15;source.connect(analyser);
      const samples=new Float32Array(analyser.fftSize);streamRef.current=stream;contextRef.current=context;
      const detect=()=>{analyser.getFloatTimeDomainData(samples);setPitch(detectFundamental(samples,context.sampleRate));frameRef.current=requestAnimationFrame(detect);};
      detect();setRunning(true);
    }catch(e){setError(e instanceof Error?e.message:"Microphone permission was denied.");}
  }
  function startRecording(){
    const stream=streamRef.current;if(!stream){setError("Start microphone detection before recording.");return;}
    try{const mimeType=MediaRecorder.isTypeSupported("audio/webm;codecs=opus")?"audio/webm;codecs=opus":"";const recorder=new MediaRecorder(stream,mimeType?{mimeType}:undefined);chunksRef.current=[];recorder.ondataavailable=event=>{if(event.data.size)chunksRef.current.push(event.data);};recorder.onstop=()=>{const blob=new Blob(chunksRef.current,{type:recorder.mimeType||"audio/webm"});if(blob.size){if(recordedUrl)URL.revokeObjectURL(recordedUrl);setRecordedUrl(URL.createObjectURL(blob));}};recorder.start();recorderRef.current=recorder;setRecording(true);setError("");}catch(e){setError(e instanceof Error?e.message:"Recording could not start in this browser.");}
  }
  function stopRecording(){if(recorderRef.current&&recorderRef.current.state!=="inactive")recorderRef.current.stop();recorderRef.current=null;setRecording(false);}
  function stop(){
    if(recording)stopRecording();
    if(frameRef.current!==null)cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null;
    if(contextRef.current){void contextRef.current.close();contextRef.current=null;}
    setRunning(false);setPitch(null);
  }
  useEffect(()=>()=>{if(frameRef.current!==null)cancelAnimationFrame(frameRef.current);streamRef.current?.getTracks().forEach(track=>track.stop());if(contextRef.current)void contextRef.current.close();if(recordedUrl)URL.revokeObjectURL(recordedUrl);},[]);
  const midi=pitch?Math.round(69+12*Math.log2(pitch/440)):null;
  const names=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
  const noteName=midi===null?"—":names[((midi%12)+12)%12]+(Math.floor(midi/12)-1);
  const cents=pitch&&midi!==null?Math.round(1200*Math.log2(pitch/(440*Math.pow(2,(midi-69)/12)))):0;
  return <div className="voice-tuner"><span className="tool-icon"><Mic2/></span><h3>Voice pitch practice</h3><p>Sing one comfortable sustained note. Maestro detects its fundamental pitch in real time; audio stays in your browser.</p><div className="pitch-readout"><strong>{noteName}</strong><span>{pitch?pitch.toFixed(1)+" Hz":"Waiting for voice"}</span></div>{pitch!==null&&<div className="pitch-meter"><i style={{left:(50+Math.max(-50,Math.min(50,cents)))*1+"%"}}/></div>}<small className="pitch-cents">{pitch!==null?(cents>0?"+":"")+cents+" cents from "+noteName:"Use a quiet room and sing steadily, not loudly."}</small><div className="voice-actions"><button className={running?"outline-button":"primary-button"} onClick={running?stop:()=>void start()}>{running?<><Pause size={15}/> Stop microphone</>:<><Mic2 size={15}/> Start pitch detection</>}</button><button className={recording?"record-button recording":"outline-button"} disabled={!running&&!recording} onClick={recording?stopRecording:startRecording}>{recording?"Stop recording":"Record a take"}</button></div>{recordedUrl&&<div className="recorded-take"><span>Latest recording is ready</span><audio controls src={recordedUrl}/><a href={recordedUrl} download={"maestro-practice-take.webm"}>Download take</a></div>}{error&&<p className="form-error">{error}</p>}</div>;
}

function Metronome({bpm}:{bpm:number}){const [beat,setBeat]=useState(0);useEffect(()=>{const id=setInterval(()=>{setBeat(v=>(v+1)%4);playClick();},60000/bpm);return()=>clearInterval(id);},[bpm]);return <div className="metronome-beats" aria-label={`Metronome at ${bpm} beats per minute`}>{[0,1,2,3].map(i=><span key={i} className={beat===i?"beat-active":""}/>)}</div>}
