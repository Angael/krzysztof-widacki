// Fake agent harness. All content is server-rendered; this only hides and reveals it.

const root = document.documentElement;
const log = document.getElementById("log")!;
const out = document.getElementById("out")!;
const input = document.getElementById("cmd") as HTMLInputElement;
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
const GLYPHS = "abcdefghijklmnopqrstuvwxyz_·∴→⋯≈∂ ";
const garble = (n: number) =>
  Array.from({ length: n }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join("");

/** Spinner + status word + a line of garbled "reasoning", inserted before `before`. */
async function think(word: string, ms: number, before: Element | null = null, parent: Element = log) {
  if (skipping) return;
  const el = document.createElement("div");
  el.className = "think";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<span class="spin"></span><span class="word"></span><span class="garble"></span>`;
  const [spin, w, g] = el.children as unknown as HTMLElement[];
  w.textContent = word;
  parent.insertBefore(el, before);
  const start = performance.now();
  let f = 0;
  while (!skipping && performance.now() - start < ms) {
    spin.textContent = FRAMES[f++ % FRAMES.length];
    if (f % 2) g.textContent = garble(48);
    await new Promise((r) => setTimeout(r, 70));
  }
  el.remove();
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
  await wait(220); // "enter"
  show(user.querySelector(".who-out")!);

  for (const turn of turns.slice(1)) {
    if (turn.classList.contains("prompt")) break;
    const kind = turn.dataset.k;
    await think(turn.dataset.think ?? "Thinking", kind === "text" ? rand(450, 600) : rand(260, 420), turn);
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

  busy = true;
  skipping = reduced;
  await think(key === "?" ? "Pondering" : "Thinking", key === "?" ? rand(500, 800) : rand(200, 380), null, out);
  const reply = document.createElement("div");
  reply.className = "turn agent reply";
  const html = fn
    ? fn()
    : `<p>command not found: <span class="k">${esc(cmd.slice(0, 40))}</span></p><p class="dimtxt">⎿ no model wired up, only a few commands. Try help.</p>`;
  reply.innerHTML = `<span class="who">●</span><div>${html}</div>`;
  out.append(reply);
  field.scrollIntoView({ block: "nearest" });
  await stream(reply.lastElementChild!, Math.min(900, 180 + (reply.textContent?.length ?? 0) * 6));
  field.scrollIntoView({ block: "nearest" });
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

if (reduced) {
  root.classList.add("run");
  finishIntro();
} else {
  addEventListener("keydown", skip, { once: true });
  addEventListener("pointerdown", skip, { once: true });
  intro().then(() => {
    removeEventListener("keydown", skip);
    removeEventListener("pointerdown", skip);
    skipping = false;
    if (matchMedia("(pointer: fine)").matches) input.focus({ preventScroll: true });
  });
}
