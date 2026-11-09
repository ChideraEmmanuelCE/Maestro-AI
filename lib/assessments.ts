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


const assessmentExtras: Record<string, LessonExercise> = {
  Listening:q("Which description refers to timbre?",["The colour or quality of a sound","The speed of the pulse","The distance between pitches"],0,"Timbre is the characteristic tone colour that helps distinguish sound sources."),
  Piano:q("What is the name for the distance from one C to the next C?",["A fifth","An octave","A third"],1,"The distance from a note to the next note with the same letter name is an octave."),
  Rhythm:q("If a tempo changes from 80 BPM to 100 BPM, what changes?",["The beat rate","The pitch of every note","The key signature"],0,"A higher BPM means more beats occur each minute."),
  Notation:q("What does a clef establish?",["The pitch names assigned to staff positions","The loudness of the piece","The instrument's tuning frequency"],0,"A clef maps staff lines and spaces to specific pitch names."),
  Scales:q("In C major, what is the tonic?",["G","C","B"],1,"The tonic is scale degree 1, the tonal centre of the key."),
  "Ear training":q("What does an interval measure?",["The distance between two pitches","The loudness of a chord","The duration of a bar"],0,"An interval describes the pitch distance between two notes."),
  Chords:q("How many distinct pitch classes are in a basic triad?",["Two","Three","Four"],1,"A triad contains three chord tones: root, third and fifth."),
  Harmony:q("What is the tonic chord in C major?",["C major","G major","F major"],0,"The tonic is the I chord, built on the first scale degree."),
  Guitar:q("Which guitar string is numbered string 6?",["The thinnest string","The thickest string","The second-thinnest string"],1,"String 6 is the thickest string and is tuned to low E2."),
  Composition:q("What does melodic contour describe?",["The shape made by rising and falling pitches","The instrument's volume","The number of performers"],0,"Contour describes the direction and shape of pitch movement over time.")
};
for (const [category, item] of Object.entries(assessmentExtras)) assessmentBank[category].push(item);
