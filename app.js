const state = { epsilon: 0.08, x0: 0.8, y0: 1.2, time: 0, theorem: 1, phase: "A", playing: false, zoomed: false };

const $ = (id) => document.getElementById(id);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const format = (value, digits = 3) => Number(value).toFixed(digits);

const derivations = [
  { kicker: "STEP 01 / MODEL", title: "A system with two clocks", text: "The x-variable evolves on the O(1) slow clock. The y-variable relaxes on the O(ε) fast clock, so its transient is visible before the orbit settles.", formula: "ẋ = −x     ε ẏ = x − y" },
  { kicker: "STEP 02 / CRITICAL MANIFOLD", title: "Turn off the fast clock", text: "Set ε = 0. The algebraic constraint x − y = 0 gives the critical manifold S₀. It is normally hyperbolic because the fast linearization is −1.", formula: "0 = x − y     ⇒     S₀ : y = x" },
  { kicker: "STEP 03 / FAST TRANSIENT", title: "Solve the boundary layer", text: "The deviation from the Fenichel graph decays exponentially on the fast time scale. This is the stable fiber that Theorem II keeps.", formula: "δy(t) = δy₀ e^(−t/ε)     λfast = −1/ε" },
  { kicker: "STEP 04 / REDUCED FLOW", title: "Compare full and reduced flow", text: "The slow coordinate follows the reduced equation ẋ = −x. The exact solution separates into a slow part on Sε and a fast transient that disappears as t/ε grows.", formula: "y(t) = x₀/(1−ε)e^(−t) + (y₀−x₀/(1−ε))e^(−t/ε)" },
];

const phases = {
  A: { kicker: "PHASE A / ENTRY", title: "Enter the singular neighborhood.", text: "A transverse section Σin arrives with a visible spread in the fast direction. The next phase measures how the fast fibers exchange that spread for alignment with Sε.", delta: 0.05 },
  B: { kicker: "PHASE B / CONTRACTION", title: "Fast fibers contract the section.", text: "The transverse width is multiplied by exp(−Δt/ε). For small ε the contraction is strong, so the image of Σin becomes a thin graph over the slow direction.", delta: 0.35 },
  C: { kicker: "PHASE C / PASSAGE", title: "The image follows the slow flow.", text: "Once aligned, the section is carried along Sε. The fast error stays small while the slow coordinate changes on the O(1) time scale.", delta: 1.1 },
  D: { kicker: "PHASE D / EXIT", title: "Leave through the outgoing section.", text: "The outgoing section Σout records the exchanged geometry: thin in the stable direction, transported in the slow direction, and ready for the next chart.", delta: 2.0 },
};

function exactSolution() {
  const { epsilon: e, x0, y0, time: t } = state;
  const slow = x0 * Math.exp(-t);
  const graph = slow / (1 - e);
  const fastAmplitude = y0 - x0 / (1 - e);
  const fast = fastAmplitude * Math.exp(-t / e);
  return { x: slow, y: graph + fast, graph, slow, fast, error: Math.abs(fast), eigenvalue: -1 / e };
}

function pathPoint(t) {
  const x = exactSolution().x;
  const y = exactSolution().y;
  const px = 118 + (1 - x / Math.max(state.x0, 1.4)) * 525;
  const py = 405 - clamp((y + 0.25) / 2.4, 0.05, 1) * 320;
  return { px, py };
}

function updateRangeFill(input) {
  const min = Number(input.min), max = Number(input.max), value = Number(input.value);
  input.style.setProperty("--fill", `${((value - min) / (max - min)) * 100}%`);
}

function updateDiagram() {
  const sol = exactSolution();
  const point = pathPoint(state.time);
  $("orbitMarker").setAttribute("cx", point.px);
  $("orbitMarker").setAttribute("cy", point.py);
  $("fastFiber").setAttribute("d", `M ${point.px} ${point.py - 4} L ${point.px} ${clamp(point.py + sol.fast * 170, 90, 420)}`);
  $("slowMarker").setAttribute("cx", point.px);
  $("slowMarker").setAttribute("cy", clamp(405 - (sol.graph + 0.25) / 2.4 * 320, 50, 420));
  $("diagramX").textContent = format(sol.x);
  $("diagramY").textContent = format(sol.y);
  $("diagramT").textContent = format(state.time, 2);
  $("epsilonValue").textContent = format(state.epsilon, 2);
  $("x0Value").textContent = format(state.x0, 2);
  $("y0Value").textContent = format(state.y0, 2);
  $("timeValue").textContent = format(state.time, 2);
  $("topEpsilon").textContent = format(state.epsilon, 2);
  $("fastEigenvalue").textContent = `−${format(Math.abs(sol.eigenvalue), 2)}`;
  ["epsilon", "x0", "y0", "time"].forEach((id) => updateRangeFill($(id)));
  updateDerivationFormula();
}

function updateDerivationFormula() {
  const formula = derivations[Number(document.querySelector(".step-button.active")?.dataset.step || 0)].formula;
  $("derivationFormula").textContent = formula;
}

function selectTheorem(number) {
  state.theorem = number;
  document.querySelectorAll(".theorem-card").forEach((card) => card.classList.toggle("active", Number(card.dataset.theorem) === number));
  const modes = { 1: "Theorem I · persistence layer", 2: "Theorem II · stable fiber layer", 3: "Theorem III · tracking layer" };
  $("diagramMode").textContent = modes[number];
  $("fiberLayer").style.opacity = number === 2 ? "1" : "";
  $("criticalPath").style.opacity = number === 1 ? "1" : ".42";
  $("perturbedPath").style.opacity = number === 1 ? "1" : ".72";
  $("reducedPath").style.opacity = number === 3 ? ".75" : "0";
  $("orbitPath").style.opacity = number === 3 ? "1" : ".55";
  $("fastFiber").style.opacity = number === 2 ? "1" : ".4";
}

function selectPhase(phase) {
  state.phase = phase;
  const info = phases[phase];
  document.querySelectorAll(".phase-button").forEach((button) => button.classList.toggle("active", button.dataset.phase === phase));
  $("phaseKicker").textContent = info.kicker;
  $("phaseTitle").textContent = info.title;
  $("phaseText").innerHTML = info.text;
  const contraction = phase === "A" ? 1 : Math.exp(-info.delta / state.epsilon);
  $("contractionValue").textContent = contraction < 0.001 ? contraction.toExponential(2) : format(contraction, 3);
  $("sectionIn").style.opacity = phase === "A" ? ".8" : ".3";
  $("sectionOut").style.opacity = phase === "D" ? ".8" : ".2";
  $("fastFiber").style.opacity = phase === "B" ? "1" : ".4";
  if (phase === "B") { state.time = clamp(state.epsilon * 1.8, 0, 4); $("time").value = state.time; updateDiagram(); }
}

function setPlaying(playing) {
  state.playing = playing;
  $("playLabel").textContent = playing ? "Pause exact orbit" : "Play exact orbit";
  $("pauseButton").textContent = playing ? "Ⅱ" : "▶";
  if (playing) requestAnimationFrame(playFrame);
}

let lastFrame = 0;
function playFrame(now) {
  if (!state.playing) return;
  if (!lastFrame) lastFrame = now;
  const elapsed = (now - lastFrame) / 1000;
  lastFrame = now;
  state.time += elapsed * 0.65;
  if (state.time >= 4) { state.time = 4; setPlaying(false); lastFrame = 0; }
  $("time").value = state.time;
  updateDiagram();
  if (state.playing) requestAnimationFrame(playFrame);
}

document.querySelectorAll("input[type=range]").forEach((input) => input.addEventListener("input", () => {
  state[input.id === "epsilon" ? "epsilon" : input.id === "x0" ? "x0" : input.id === "y0" ? "y0" : "time"] = Number(input.value);
  if (input.id === "epsilon") selectPhase(state.phase);
  updateDiagram();
}));

document.querySelectorAll(".step-button").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".step-button").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  const data = derivations[Number(button.dataset.step)];
  $("stepCount").textContent = `${String(Number(button.dataset.step) + 1).padStart(2, "0")} / 04`;
  $("derivationKicker").textContent = data.kicker;
  $("derivationTitle").textContent = data.title;
  $("derivationText").textContent = data.text;
  $("derivationFormula").textContent = data.formula;
}));

document.querySelectorAll(".theorem-card").forEach((card) => {
  card.addEventListener("click", (event) => { if (!event.target.closest("button")) selectTheorem(Number(card.dataset.theorem)); });
  card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectTheorem(Number(card.dataset.theorem)); } });
});
document.querySelectorAll(".outline-button").forEach((button) => button.addEventListener("click", () => selectTheorem(Number(button.dataset.focus))));
document.querySelectorAll(".phase-button").forEach((button) => button.addEventListener("click", () => selectPhase(button.dataset.phase)));
$("playButton").addEventListener("click", () => setPlaying(!state.playing));
$("pauseButton").addEventListener("click", () => setPlaying(!state.playing));
$("resetButton").addEventListener("click", () => { state.epsilon = .08; state.x0 = .8; state.y0 = 1.2; state.time = 0; state.playing = false; ["epsilon", "x0", "y0", "time"].forEach((id) => { $(id).value = state[id]; }); setPlaying(false); updateDiagram(); selectTheorem(1); selectPhase("A"); });
$("zoomButton").addEventListener("click", () => { state.zoomed = !state.zoomed; $("diagramWrap").classList.toggle("zoomed", state.zoomed); $("viewScale").textContent = state.zoomed ? "1.03×" : "1.0×"; });
document.addEventListener("keydown", (event) => { if (event.target.matches("input")) return; if (event.code === "Space") { event.preventDefault(); setPlaying(!state.playing); } if (event.key.toLowerCase() === "r") $("resetButton").click(); });

updateDiagram();
selectTheorem(1);
selectPhase("A");
