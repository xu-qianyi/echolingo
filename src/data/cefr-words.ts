// CEFR word list — B2 and C1 words to highlight for learners at or below that level.
// Words are stored lowercase. Word forms are included separately where they differ meaningfully.

export type CefrLevel = "a1" | "a2" | "b1" | "b2" | "c1"

// Words at B2 level — highlight when user is ≤ B1
const B2: string[] = [
  "abolish","absorb","accelerate","accomplish","accomplished","accomplishment","accumulate","accurate","accuracy",
  "acknowledge","acquire","adapt","adequate","adjust","advocate","aggressive","allocate","alter","ambiguous",
  "analyze","anticipate","apparent","appropriate","approximately","aspect","assess","assessment","assumption",
  "attach","attribute","authority","awareness","beneficial","capable","capability","challenge","characteristic",
  "clarify","classify","coincide","collaborate","collaboration","commit","commitment","compensate","compete",
  "competition","compile","comprehend","concentrate","conflict","construct","contribute","contribution",
  "controversial","convince","coordinate","correspond","crucial","decline","demonstrate","derive","determine",
  "diminish","distinguish","diverse","diversity","dominant","effective","efficiency","elaborate","eliminate",
  "enable","ensure","equivalent","establish","evaluate","evaluation","evidence","exceed","explicit","exploit",
  "extend","facilitate","flexible","flexibility","foundation","generate","genuine","global","guarantee",
  "identify","impact","implement","imply","indicate","inspire","integrate","involve","justify","maintain",
  "majority","maximize","migrate","minimize","modify","monitor","motivate","motivation","navigate","negotiate",
  "obstacle","obtain","occur","outcome","overcome","participate","perceive","perspective","potential","predict",
  "previous","priority","professional","promote","pursue","recognize","reinforce","relevant","require",
  "resolve","resource","restore","retain","reveal","revise","strategy","sufficient","summarize","sustain",
  "sustainable","sustainability","target","transition","ultimate","undertake","utilize","whereas",
  // lifestyle / vlog vocabulary at B2
  "accomplishment","portfolio","productivity","aesthetic","intentional","accountability","consistent","consistency",
  "authentic","authenticity","transparent","transparency","vulnerable","vulnerability","perspective",
  "ambitious","ambition","minimize","minimalism","minimalist","gratitude","mindset","routine","discipline",
  "prioritize","procrastinate","procrastination","overwhelm","boundaries","self-aware","self-awareness",
  "burnout","confident","confidence","efficient","efficiency","initiative","passionate","passion",
]

// Words at C1 level — highlight when user is ≤ B2
const C1: string[] = [
  "alleviate","ambivalent","arbitrary","ascertain","coherent","comprehensive","counterpart","discern",
  "eloquent","empirical","holistic","indispensable","inherent","intricate","meticulous","nuanced",
  "paradigm","plausible","profound","reconcile","redundant","scrutinize","subjective","substantial",
  "synthesize","ubiquitous","unprecedented","versatile","ambiguity","autonomous","controversy",
  "discrepancy","impartial","incentive","sophisticated","immersive","compelling","articulate",
  "resilience","resilient","perseverance","persevere","intrinsic","extrinsic","conscientious",
  "deliberate","deliberation","pragmatic","pragmatism","juxtapose","juxtaposition","pervasive",
  "profound","elusive","fleeting","tangible","intangible","dichotomy","paradox","paradoxical",
  "catalyst","culminate","culmination","perpetuate","allude","connotation","denotation","implicit",
  "explicit","inference","nuance","rhetoric","coherence","abstract","concrete","notion","premise",
  "assertion","reiterate","exemplify","substantiate","contradictory","counterintuitive",
  "disproportionate","encompass","discrepancy","disparate","innate","lateral","peripheral",
  "preclude","profound","rigorous","rigorously","spontaneous","spontaneity","tenacious","tenacity",
]

// Build lookup map
const wordLevelMap = new Map<string, CefrLevel>()
for (const w of B2) wordLevelMap.set(w, "b2")
for (const w of C1) wordLevelMap.set(w, "c1")

export function getWordLevel(word: string): CefrLevel | null {
  return wordLevelMap.get(word.toLowerCase()) ?? null
}

// Returns true if the word should be highlighted for a user at `userLevel`
export function shouldHighlight(word: string, userLevel: CefrLevel): boolean {
  const wordLvl = getWordLevel(word)
  if (!wordLvl) return false
  const order: CefrLevel[] = ["a1", "a2", "b1", "b2", "c1"]
  return order.indexOf(wordLvl) > order.indexOf(userLevel)
}

// Tokenize text into alternating [word, non-word] tokens preserving spacing/punctuation
export function tokenize(text: string): string[] {
  return text.match(/[a-zA-Z'-]+|[^a-zA-Z'-]+/g) ?? [text]
}
