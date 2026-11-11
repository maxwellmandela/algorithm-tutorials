const FIRST_ADDRESS = 0x1000;
const MAX_VALUES = 8;
const AUTO_STEP_MS = 3000;

const ui = {
  form: document.querySelector("#array-form"),
  input: document.querySelector("#array-input"),
  hint: document.querySelector("#input-hint"),
  stepLabel: document.querySelector("#step-label"),
  progress: document.querySelector("#progress-dots"),
  title: document.querySelector("#scene-title"),
  sortedLabel: document.querySelector("#sorted-label"),
  tiles: document.querySelector("#tile-row"),
  keyArea: document.querySelector("#key-area"),
  keyTile: document.querySelector("#key-tile"),
  bubble: document.querySelector("#speech-bubble"),
  icon: document.querySelector("#story-icon"),
  kicker: document.querySelector("#story-kicker"),
  story: document.querySelector("#story-text"),
  memoryDetail: document.querySelector("#memory-detail"),
  byteList: document.querySelector("#byte-list"),
  cpuDetail: document.querySelector("#cpu-detail"),
  instruction: document.querySelector("#instruction-detail"),
  back: document.querySelector("#back-button"),
  play: document.querySelector("#play-button"),
  playIcon: document.querySelector("#play-icon"),
  playLabel: document.querySelector("#play-label"),
  next: document.querySelector("#next-button"),
  reset: document.querySelector("#reset-button"),
};

let original = [5, 2, 4, 1, 3];
let story = makeStory(original);
let currentStep = 0;
let timer = null;
let isPlaying = false;

function addressOf(index) {
  return `0x${(FIRST_ADDRESS + index).toString(16).toUpperCase().padStart(4, "0")}`;
}

function byteOf(value) {
  return value.toString(2).padStart(8, "0");
}

function makeStory(input) {
  const shelf = [...input];
  const steps = [{
    stage: "ready",
    memory: [...shelf],
    sortedCount: 1,
    title: "Ready, set, sort!",
    icon: "👋",
    kicker: "HELLO, SORTER!",
    story: "We'll look at one number at a time and slide it into the right spot.",
    bubble: "Hi! I'll help put these numbers in order.",
    instruction: "Ready",
    cpu: "The CPU is our little computer's thinking part. It follows one tiny instruction at a time.",
    memoryNote: "The numbers are stored in memory, like toys waiting on a shelf.",
  }];

  function add(data) {
    steps.push({ memory: [...shelf], ...data });
  }

  for (let i = 1; i < shelf.length; i += 1) {
    const key = shelf[i];
    add({
      stage: "pick",
      index: i,
      key,
      active: i,
      sortedCount: i,
      title: "Pick up the next number",
      icon: "🖐️",
      kicker: "PICK IT UP",
      story: `The computer picks up ${key}. We'll call it our “number to place.”`,
      bubble: `I've got ${key}!`,
      instruction: `LOAD R1, [${addressOf(i)}]`,
      cpu: `Read ${key} from memory slot ${i} into a tiny CPU storage spot called a register.`,
      memoryNote: `Slot ${i} is at address ${addressOf(i)}. Its value, ${key}, is ${byteOf(key)} in 8-bit binary.`,
    });

    let j = i - 1;
    while (j >= 0 && shelf[j] > key) {
      const current = shelf[j];
      add({
        stage: "compare",
        index: i,
        key,
        active: j,
        sortedCount: i,
        title: `Is ${current} bigger than ${key}?`,
        icon: "🤔",
        kicker: "LET'S COMPARE",
        story: `${current} is bigger than ${key}, so it needs to make room. Slide ${current} one spot to the right!`,
        bubble: `${current} is bigger. Scoot over!`,
        instruction: `COMPARE ${current} > ${key}`,
        cpu: `The CPU compares ${current} with ${key}. The answer is yes, so it will move ${current} one slot to the right.`,
        memoryNote: `The CPU is looking at slot ${j} (${addressOf(j)}). Its value is ${current}, or ${byteOf(current)} in binary.`,
      });

      shelf[j + 1] = current;
      add({
        stage: "shift",
        index: i,
        key,
        active: j + 1,
        sortedCount: i,
        title: `Slide ${current} over`,
        icon: "➡️",
        kicker: "MAKE A SPACE",
        story: `${current} moved one spot to the right. Our ${key} is safe in the CPU's hand.`,
        bubble: "One spot to the right!",
        instruction: `WRITE ${current} → slot ${j + 1}`,
        cpu: `The CPU copies ${current} into the next memory slot. The number ${key} stays safe in its register.`,
        memoryNote: `Memory slot ${j + 1} (${addressOf(j + 1)}) was updated to ${current}.`,
      });
      j -= 1;
    }

    if (j >= 0) {
      add({
        stage: "found",
        index: i,
        key,
        active: j,
        sortedCount: i,
        title: `${key} found its spot!`,
        icon: "💡",
        kicker: "GOT IT!",
        story: `${shelf[j]} is smaller than ${key}. That means ${key} goes right after it.`,
        bubble: "Found the right place!",
        instruction: `COMPARE ${shelf[j]} ≤ ${key}`,
        cpu: `The CPU sees ${shelf[j]} is not bigger than ${key}, so it stops looking left.`,
        memoryNote: `The sorted part of the shelf ends at slot ${j}.`,
      });
    } else {
      add({
        stage: "found",
        index: i,
        key,
        active: null,
        sortedCount: i,
        title: `${key} goes all the way to the front`,
        icon: "💡",
        kicker: "GOT IT!",
        story: `${key} is smaller than every number we've seen. Its spot is right at the beginning!`,
        bubble: "The very first spot!",
        instruction: `NO SMALLER NUMBER FOUND`,
        cpu: `The CPU has reached the beginning of the shelf. Put ${key} in slot zero.`,
        memoryNote: `The search reached the first memory slot at ${addressOf(0)}.`,
      });
    }

    const place = j + 1;
    shelf[place] = key;
    add({
      stage: "place",
      index: i,
      key,
      active: place,
      sortedCount: i + 1,
      title: `Put ${key} in its new spot`,
      icon: "🎉",
      kicker: "NICE PLACING!",
      story: `${key} goes in the empty spot. Now the first ${i + 1} numbers are in order!`,
      bubble: "Perfect fit!",
      instruction: `WRITE ${key} → slot ${place}`,
      cpu: `Write the saved ${key} into memory slot ${place}. The sorted part just got bigger.`,
      memoryNote: `Memory slot ${place} (${addressOf(place)}) now holds ${key}.`,
    });
  }

  add({
    stage: "done",
    sortedCount: shelf.length,
    title: "You did it! All sorted!",
    icon: "🏆",
    kicker: "SORTING COMPLETE",
    story: `Look at that neat row: ${shelf.join(", ")}. The computer sorted every number!`,
    bubble: "We make a great team!",
    instruction: "PROGRAM FINISHED",
    cpu: "The CPU finished the sorting instructions. Every number is now in order.",
    memoryNote: "The array is now sorted in memory.",
  });
  return steps;
}

function makeTile(value, className = "") {
  const tile = document.createElement("div");
  tile.className = `number-tile ${className}`.trim();
  tile.setAttribute("aria-label", `Number ${value}`);
  const top = document.createElement("span");
  top.className = "tile-top";
  const side = document.createElement("span");
  side.className = "tile-side";
  const face = document.createElement("span");
  face.className = "tile-face";
  face.textContent = value;
  tile.append(top, side, face);
  return tile;
}

function renderTiles(step) {
  ui.tiles.replaceChildren();
  step.memory.forEach((value, index) => {
    const classes = [];
    if (index < step.sortedCount) classes.push("is-sorted");
    if (index === step.active) classes.push("is-active");
    if (step.stage === "pick" && index === step.index) classes.push("is-picked");
    const slot = document.createElement("div");
    slot.className = "tile-slot";
    const tile = makeTile(value, classes.join(" "));
    slot.append(tile);
    const label = document.createElement("span");
    label.className = "slot-number";
    label.textContent = index + 1;
    slot.append(label);
    ui.tiles.append(slot);
  });

  const hasKey = step.key !== undefined && step.stage !== "place" && step.stage !== "done";
  ui.keyArea.hidden = !hasKey;
  ui.keyTile.replaceChildren();
  if (hasKey) ui.keyTile.append(makeTile(step.key, "is-held"));
}

function renderProgress(step) {
  ui.progress.replaceChildren();
  for (let i = 1; i < original.length; i += 1) {
    const dot = document.createElement("span");
    dot.className = "progress-dot";
    if (i < step.sortedCount || step.stage === "done") dot.classList.add("is-done");
    else if (i === step.index) dot.classList.add("is-current");
    dot.setAttribute("aria-label", `Number ${i + 1} of ${original.length}`);
    ui.progress.append(dot);
  }
}

function render() {
  const step = story[currentStep];
  const last = currentStep === story.length - 1;
  renderTiles(step);
  renderProgress(step);
  ui.stepLabel.textContent = currentStep === 0
    ? "Ready to play"
    : `Step ${currentStep} of ${story.length - 1}`;
  ui.title.textContent = step.title;
  ui.sortedLabel.textContent = step.stage === "done"
    ? "Every number is in order!"
    : `${step.sortedCount} ${step.sortedCount === 1 ? "number" : "numbers"} in the sorted part`;
  ui.icon.textContent = step.icon;
  ui.kicker.textContent = step.kicker;
  ui.story.textContent = step.story;
  ui.bubble.textContent = step.bubble;
  ui.memoryDetail.textContent = step.memoryNote;
  ui.cpuDetail.textContent = step.cpu;
  ui.instruction.textContent = step.instruction;
  ui.back.disabled = currentStep === 0 || isPlaying;
  ui.next.disabled = last || isPlaying;
  ui.playIcon.textContent = isPlaying ? "Ⅱ" : last ? "↻" : "▶";
  ui.playLabel.textContent = isPlaying ? "Pause" : last ? "Play again" : "Play";
  ui.byteList.replaceChildren();

  step.memory.forEach((value, index) => {
    const byte = document.createElement("span");
    byte.className = "byte-item";
    byte.textContent = `${addressOf(index)} · ${value} · ${byteOf(value)}`;
    ui.byteList.append(byte);
  });
}

function stop() {
  isPlaying = false;
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
}

function moveTo(nextStep) {
  stop();
  currentStep = Math.max(0, Math.min(story.length - 1, nextStep));
  render();
}

function togglePlay() {
  if (isPlaying) {
    stop();
    render();
    return;
  }
  if (currentStep === story.length - 1) currentStep = 0;
  isPlaying = true;
  render();
  timer = window.setInterval(() => {
    if (currentStep >= story.length - 1) {
      stop();
      render();
      return;
    }
    currentStep += 1;
    render();
    if (currentStep >= story.length - 1) {
      stop();
      render();
    }
  }, AUTO_STEP_MS);
}

ui.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const parts = ui.input.value.split(",").map((part) => part.trim());
  const parsed = parts.map(Number);
  let error = "";
  if (parts.some((part) => part === "")) {
    error = "Use commas between the numbers, like 5, 2, 4.";
  } else if (parsed.length < 2 || parsed.length > MAX_VALUES) {
    error = `Choose between 2 and ${MAX_VALUES} numbers.`;
  } else if (parsed.some((value) => !Number.isInteger(value) || value < 0 || value > 99)) {
    error = "Choose whole numbers from 0 to 99.";
  }
  if (error) {
    ui.hint.textContent = error;
    ui.hint.classList.add("input-error");
    return;
  }
  ui.hint.textContent = `Pick 2–${MAX_VALUES} numbers from 0 to 99.`;
  ui.hint.classList.remove("input-error");
  stop();
  original = parsed;
  story = makeStory(original);
  currentStep = 0;
  render();
});

ui.back.addEventListener("click", () => moveTo(currentStep - 1));
ui.next.addEventListener("click", () => moveTo(currentStep + 1));
ui.play.addEventListener("click", togglePlay);
ui.reset.addEventListener("click", () => moveTo(0));

render();
