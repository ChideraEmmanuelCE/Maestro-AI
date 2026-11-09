import type { LessonExercise } from "./curriculum";
const q=(prompt:string,options:string[],answer:number,feedback:string):LessonExercise=>({prompt,options,answer,feedback});
export const assessmentBank:Record<string,LessonExercise[]> = {
  Listening:[
    q("Which property is primarily determined by frequency?",["Pitch","Loudness","Duration"],0,"Frequency determines perceived pitch; amplitude is more closely related to loudness."),
    q("What should happen to the pulse during a rest?",["It should stop","It should continue","It should become faster"],1,"A rest occupies measured time, so the underlying pulse continues.")
  ],
  Piano:[
    q("How many semitones make one octave?",["7","12","24"],1,"An octave spans twelve semitones."),
    q("Which white key sits immediately left of a pair of black keys?",["A","C","F"],1,"C is immediately to the left of every two-black-key group.")
  ],
  Rhythm:[
    q("At 60 BPM, how long does one beat last?",["Half a second","One second","Two seconds"],1,"Sixty beats per minute means one beat per second."),
    q("In 4/4, how many quarter-note beats are in a bar?",["3","4","6"],1,"The top number indicates four beats; the bottom 4 identifies the quarter-note beat unit.")
  ],
  Notation:[
    q("What are the treble-clef staff lines from bottom to top?",["E G B D F","F A C E G","C E G B D"],0,"The five treble lines are E4, G4, B4, D5 and F5."),
    q("Which natural-note pair is separated by one semitone?",["C–D","E–F","F–G"],1,"E and F are adjacent natural notes with a semitone between them.")
  ],
  Scales:[
    q("Which is the major-scale step formula?",["W-W-H-W-W-W-H","W-H-W-W-H-W-W","H-W-W-H-W-W-W"],0,"The major scale uses whole, whole, half, whole, whole, whole, half."),
    q("In C major, which note is the leading tone?",["F","B","D"],1,"B is scale degree seven and lies one semitone below tonic C.")
  ],
  "Ear training":[
    q("How many semitones are in a perfect fifth?",["5","7","12"],1,"A perfect fifth spans seven semitones."),
    q("A louder note with unchanged frequency has:",["A higher pitch","A lower pitch","The same pitch"],2,"Loudness does not itself change pitch.")
  ],
  Chords:[
    q("How many semitones are in the root-to-third interval of a major triad?",["3","4","5"],1,"A major triad has a major third of four semitones above its root."),
    q("Which note is lowered to turn C major into C minor?",["C","E","G"],1,"The third changes from E to E-flat; root and fifth remain.")
  ],
  Harmony:[
    q("In C major, what is the dominant triad?",["F major","G major","A minor"],1,"G major is the V chord in C major."),
    q("Which bass note identifies first inversion of a C-major triad?",["C","E","G"],1,"First inversion places the third, E, in the bass.")
  ],
  Guitar:[
    q("What is standard guitar tuning from the thickest string to the thinnest?",["E-A-D-G-B-E","A-D-G-C-E-A","E-G-D-A-B-E"],0,"Standard tuning is E2, A2, D3, G3, B3, E4."),
    q("Which open string is the highest in standard tuning?",["Low E2","B3","High E4"],2,"The first string is high E4.")
  ],
  Composition:[
    q("What makes a motif recognisable when varied?",["A feature is retained","Every element changes","The pulse disappears"],0,"A variation preserves a recognisable feature while changing another."),
    q("What is a common way to create melodic resolution in C major?",["End on B","End on C","End on F-sharp"],1,"Returning to the tonic C gives a strong sense of arrival.")
  ]
};
