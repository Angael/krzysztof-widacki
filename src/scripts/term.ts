// Fake agent harness. All content is server-rendered; this only hides and reveals it.

const root = document.documentElement;
const log = document.getElementById("log")!;
const out = document.getElementById("out")!;
const input = document.getElementById("cmd") as HTMLTextAreaElement;
const pre = document.getElementById("pre")!;
const car = document.getElementById("car")!;
const post = document.getElementById("post")!;
const field = input.closest(".prompt")!;

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let skipping = reduced;

console.log(
  "%cHello there ~ Krzysztof",
  "font: 700 16px ui-monospace, monospace; color: #e8a46b; padding: 4px 0",
);
console.log(
  "%cReading the source? It lives at github.com/Angael. No model behind this prompt, just strings.",
  "font: 12px ui-monospace, monospace; color: #8a958e",
);

const wait = (ms: number) =>
  skipping ? Promise.resolve() : new Promise<void>((r) => setTimeout(r, ms));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const show = (el: Element) => el.classList.add("on");

/** Empty all text nodes in el, then refill them a few chars ("tokens") per frame. */
async function stream(el: Element, total: number) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: [Text, string][] = [];
  while (walker.nextNode()) {
    const n = walker.currentNode as Text;
    nodes.push([n, n.data]);
  }
  const len = nodes.reduce((s, [, t]) => s + t.length, 0);
  addTokens(el.textContent ?? "");
  if (skipping || !len) return;
  for (const [n] of nodes) n.data = "";
  const ticks = Math.max(1, Math.round(total / 16));
  const per = Math.max(1, Math.ceil(len / ticks));
  for (const [n, t] of nodes) {
    let i = 0;
    while (i < t.length) {
      if (skipping) break;
      i = Math.min(t.length, i + per + Math.floor(Math.random() * 3));
      n.data = t.slice(0, i);
      await new Promise((r) => requestAnimationFrame(r));
    }
    n.data = t;
  }
  if (skipping) for (const [n, t] of nodes) n.data = t;
}

const FRAMES = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

const THOUGHTS: Record<string, string[]> = {
  Thinking: [
    "The user typed whoami. Should I answer honestly or make him sound impressive? Both. Mostly both.",
    "Okay, he's a developer. Leading with that. Not leading with the 3am deploys.",
    "Let me introduce him without using the word synergy. Hard, but doable.",
  ],
  Listing: [
    "There are a lot of projects. Should I list all of them? He'd want me to list all of them.",
    "Counting repos... more than finished ones, but let's not mention that.",
    "Sorting projects by how proud he is of them. Hmm, they're all tied.",
  ],
  Checking: [
    "Which tools does he use? Me, apparently. Awkward. Moving on.",
    "Listing the agents he runs. Trying not to be jealous of the ones with a real API key.",
    "Do I mention I'm not one of the real ones? No. Stay professional.",
  ],
  Recalling: [
    "The stack... I remember TypeScript. Everyone remembers TypeScript.",
    "He used Redux once. We don't talk about the reducers.",
    "Should I sort the stack alphabetically or by hype? Alphabetically. Hype is not a sort order.",
  ],
  Reading: [
    "Reading contact.json. Hopefully he actually checks that inbox.",
    "Contact details found. Resisting the urge to send him a newsletter.",
    "Last step. Wrap it up before someone notices there is no model.",
  ],
  Working: [
    "A real command! Finally something I can do without a model.",
    "Running it. Pretending this took a lot of compute.",
    "Easy one. Adding a dramatic pause so it looks expensive.",
  ],
  Pondering: [
    "A joke was requested. Searching my vast training set of 31 strings.",
    "Need something funny. Checking the budget for funny... budget is zero. Improvising.",
    "Picking a joke at random. Well, Math.random. Same thing on this salary.",
  ],
  Considering: [
    "That's not a command I know. Should I pretend I understood? Tempting.",
    "Looking for a model to forward this to. Found: none. Classic.",
    "The user wants a real answer. Checking wallet... closing wallet.",
  ],
};

/** Spinner + status word + a streamed line of fake "reasoning", inserted before `before`. */
async function think(word: string, ms: number, before: Element | null = null, parent: Element = log) {
  if (skipping) return;
  const el = document.createElement("div");
  el.className = "think";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<span class="spin"></span><span class="word"></span><span class="garble"></span>`;
  const [spin, w, g] = el.children as unknown as HTMLElement[];
  w.textContent = word;
  parent.insertBefore(el, before);
  const thought = pick(THOUGHTS[word] ?? THOUGHTS.Thinking);
  addTokens(thought);
  const start = performance.now();
  let f = 0;
  let i = 0;
  const step = Math.max(1, Math.ceil(thought.length / ((ms * 0.75) / 45)));
  while (!skipping && performance.now() - start < ms) {
    spin.textContent = FRAMES[f++ % FRAMES.length];
    i = Math.min(thought.length, i + step + Math.floor(Math.random() * 2));
    g.textContent = thought.slice(0, i);
    await new Promise((r) => setTimeout(r, 45));
  }
  el.remove();
}

const tokEl = document.getElementById("tok")!;
let tokens = 0;
function addTokens(text: string) {
  tokens += Math.max(1, Math.round(text.length / 4));
  tokEl.textContent = tokens.toLocaleString("en-US");
}

function finishIntro() {
  log.querySelectorAll("[data-r]").forEach(show);
  log.querySelectorAll(".think").forEach((t) => t.remove());
  root.classList.add("done");
}

async function intro() {
  root.classList.add("run");
  const turns = [...log.querySelectorAll<HTMLElement>(":scope > [data-r]")];
  const user = turns[0];
  const typed = user.querySelector<HTMLElement>("[data-type]")!;
  const word = typed.textContent!;

  show(user);
  typed.textContent = "";
  root.classList.add("typing");
  await wait(350);
  for (const ch of word) {
    if (skipping) break;
    typed.textContent += ch;
    await wait(rand(60, 130));
  }
  typed.textContent = word;
  addTokens(word);
  await wait(220); // "enter"
  show(user.querySelector(".who-out")!);

  for (const turn of turns.slice(1)) {
    if (turn.classList.contains("prompt")) break;
    const kind = turn.dataset.k;
    await think(turn.dataset.think ?? "Thinking", kind === "text" ? rand(950, 1100) : rand(760, 920), turn);
    show(turn);
    if (kind === "text") {
      await stream(turn.querySelector("[data-s]")!, 700);
      continue;
    }
    for (const el of turn.querySelectorAll("[data-r]")) {
      show(el);
      if (el.hasAttribute("data-s")) await stream(el, 70);
      else await wait(el.classList.contains("call") ? 120 : 40);
    }
  }
  root.classList.remove("typing");
  finishIntro();
}

// ---------- interactive prompt ----------

const JOKES = [
  "Inference budget this month: 0.00 PLN. You are talking to a switch statement.",
  "This is a static nginx box. It answers in HTML, not tokens.",
  "Model: if/else-4. Temperature: room.",
  "Tokens cost money. This reply cost nothing, and it shows.",
  "I'd call a real model here, but real models call back with an invoice.",
  "Every reply is pre-generated, like a frozen pizza.",
  "GPU: none. CPU: barely. nginx: thriving.",
  "The streaming effect is fake. The budget constraints are real.",
  "Rate limit exceeded: Krzysztof's bank account.",
  "Hallucination rate: 0%. Turns out the trick is not having a model.",
  "Fine-tuned on a JavaScript array of 30 strings.",
  "That spinner earlier? setTimeout. Sorry.",
  "Thinking... no I'm not. There is nothing in here to think with.",
  "Real AI arrives when a client pays him in API credits.",
  "Your prompt was sent to /dev/null for training purposes.",
  "Agent harness: installed. Agent: on the waitlist for money.",
  "You've reached the free tier. The free tier is this sentence.",
  "Cache hit rate: 100%. Everything is cached because nothing is computed.",
  "This terminal's reasoning engine is Math.random().",
  "He wanted a real model here. His wallet ran rm -rf on the idea.",
  "Max output: one joke. Max budget: also one joke.",
  "Latency is low because the answer was decided before you asked.",
  "Context window: 200k tokens. Funding window: closed.",
  "Connecting to model... connection refused by wallet.",
  "For a real answer, email him. Humans run on coffee, not tokens.",
  "I'm sorry, Dave. I can't do that. Insufficient credits.",
  "His token budget goes into building other things. You get the leftovers: strings.",
  "Type ? again to reroll. It's the closest thing to sampling we can afford.",
  "No telemetry, no model, no problem.",
  "Benchmarks: beats every model at costing zero dollars.",
  "Powered by 40 KB of HTML and a strong sense of denial.",
];
let deck: string[] = [];
const nextJoke = () => {
  if (!deck.length) deck = [...JOKES].sort(() => Math.random() - 0.5);
  return deck.pop()!;
};

const NOPE = [
  "Great question. A real model would have answered it. He priced one out and closed the tab.",
  "I'd love to help, but my entire intelligence is a lookup table he wrote on a Sunday.",
  "Forwarding your message to GPT... just kidding, he couldn't afford the API key.",
  "The author budgeted for a domain and nginx. The AI line item says \"maybe next year\".",
  "Sorry, I'm the free trial of an AI. The trial is me saying sorry.",
  "Request received. Unfortunately the model behind me is a cardboard cutout of a model.",
  "He wanted to plug in a real LLM. Then he saw the per-token pricing and plugged in this sentence.",
  "Processing... processing... nope, still no GPU. Try help.",
  "I understood that perfectly. I just can't answer, because answering costs money.",
  "My reasoning budget is 0 tokens. I spent it all on this apology.",
  "Every real reply would cost him fractions of a cent. He is guarding those fractions.",
  "This would be a brilliant AI response if he had connected an AI. He connected a string array.",
];
let nopeDeck: string[] = [];
const nextNope = () => {
  if (!nopeDeck.length) nopeDeck = [...NOPE].sort(() => Math.random() - 0.5);
  return nopeDeck.pop()!;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const section = (id: string) => document.getElementById(id)!.closest("section")!;

function commands(): Record<string, () => string | null> {
  return {
    help: () =>
      `<div class="call"><span class="fn">Help</span><span class="arg">()</span></div><ul>` +
      [
        ["?", "one joke, no repeats"],
        ["help", "this list"],
        ["whoami", "back to the top"],
        ["ls", "projects"],
        ["contact", "how to reach him"],
        ["clear", "clear the screen"],
      ]
        .map(([k, v]) => `<li><span class="k">${k}</span><span class="dimtxt">${v}</span></li>`)
        .join("") +
      `</ul>`,
    "?": () => `<p>${esc(nextJoke())}</p><p class="dimtxt">⎿ type help for commands</p>`,
    whoami: () => {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      return `<p class="dimtxt">⎿ scrolled to top</p>`;
    },
    ls: () => {
      const names = [...section("built").querySelectorAll(".dir")].map((d) => d.textContent);
      return `<div class="call"><span class="fn">Bash</span><span class="arg">(ls ~/projects)</span></div><p>${names.join("  ")}</p>`;
    },
    contact: () => {
      section("contact").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      const rows = [...section("contact").querySelectorAll(".kv > div")]
        .map((r) => `<li>${r.querySelector("dt")!.outerHTML.replace(/dt>/g, "span>").replace("<span>", '<span class="k">')}${r.querySelector("dd")!.innerHTML}</li>`)
        .join("");
      return `<div class="call"><span class="fn">Read</span><span class="arg">(contact.json)</span></div><ul>${rows}</ul>`;
    },
    clear: () => {
      out.replaceChildren();
      return null;
    },
  };
}

const toBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" });

let busy = false;
async function run(raw: string) {
  const cmd = raw.trim();
  const echo = document.createElement("div");
  echo.className = "turn user";
  echo.innerHTML = `<span class="who">&gt;</span><p class="cmd-echo">${esc(cmd)}</p>`;
  if (!cmd) return;
  const key = cmd.toLowerCase();
  const fn = commands()[key];
  if (key === "clear") return void fn();
  out.append(echo);

  addTokens(cmd);
  toBottom();

  busy = true;
  skipping = reduced;
  await think(key === "?" ? "Pondering" : fn ? "Working" : "Considering", rand(900, 1200), null, out);
  const reply = document.createElement("div");
  reply.className = "turn agent reply";
  const html = fn
    ? fn()
    : `<p>command not found: <span class="k">${esc(cmd.slice(0, 40))}</span></p><p class="dimtxt">⎿ ${esc(nextNope())}</p>`;
  reply.innerHTML = `<span class="who">●</span><div>${html}</div>`;
  out.append(reply);
  const follow = key !== "whoami" && key !== "contact";
  if (follow) toBottom();
  await stream(reply.lastElementChild!, Math.min(900, 180 + (reply.textContent?.length ?? 0) * 6));
  if (follow) toBottom();
  busy = false;
}

function paint() {
  const v = input.value;
  const i = input.selectionStart ?? v.length;
  pre.textContent = v.slice(0, i);
  car.textContent = v[i] ?? " ";
  post.textContent = v.slice(i + 1);
}

const history: string[] = [];
let hi = 0;
// Textarea (not <input>) so mobile Chrome skips its autofill bar; never allow newlines.
input.addEventListener("beforeinput", (e) => {
  if (e.inputType === "insertLineBreak" || e.inputType === "insertParagraph") {
    e.preventDefault();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
  }
});
input.addEventListener("input", () => {
  if (input.value.includes("\n")) input.value = input.value.replace(/[\r\n]+/g, "");
});
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (busy) return;
    const v = input.value;
    if (v.trim()) history.push(v);
    hi = history.length;
    input.value = "";
    paint();
    run(v);
  } else if (e.key === "ArrowUp" && history.length) {
    e.preventDefault();
    hi = Math.max(0, hi - 1);
    input.value = history[hi];
    input.setSelectionRange(input.value.length, input.value.length);
  } else if (e.key === "ArrowDown" && history.length) {
    e.preventDefault();
    hi = Math.min(history.length, hi + 1);
    input.value = history[hi] ?? "";
  } else if (e.key === "l" && e.ctrlKey) {
    e.preventDefault();
    out.replaceChildren();
  }
  requestAnimationFrame(paint);
});
for (const ev of ["input", "click", "select", "keyup", "focus"]) input.addEventListener(ev, paint);
paint();

// ---------- boot ----------

const skip = () => {
  if (root.classList.contains("done")) return;
  skipping = true;
  finishIntro();
};

// Only deliberate input skips the intro: a real click/tap (not a touch-scroll or
// right/middle click), or Enter/Escape/Space/a printable key without modifiers.
// Modifier keys and shortcuts (Alt+Tab, Ctrl+R, Shift...) must not skip.
const onKey = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  if (e.key.length !== 1 && e.key !== "Enter" && e.key !== "Escape") return;
  skip();
};
const onClick = (e: MouseEvent) => {
  if (e.button === 0) skip();
};

if (reduced) {
  root.classList.add("run");
  finishIntro();
} else {
  addEventListener("keydown", onKey);
  addEventListener("click", onClick);
  intro().then(() => {
    removeEventListener("keydown", onKey);
    removeEventListener("click", onClick);
    skipping = false;
    if (matchMedia("(pointer: fine)").matches) input.focus({ preventScroll: true });
  });
}
