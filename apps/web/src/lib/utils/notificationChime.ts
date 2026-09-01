/**
 * A two-note notification chime, synthesised rather than loaded from a file.
 *
 * Two sine tones this short are a handful of oscillator nodes, so generating
 * them beats shipping an audio asset: nothing to fetch, nothing to cache, and
 * no first-notification delay while a request is in flight.
 */

/** A soft rising interval (A5 then D6), the second note overlapping the first. */
const NOTES = [
  { frequency: 880, startOffsetS: 0 },
  { frequency: 1174.66, startOffsetS: 0.09 },
];

const NOTE_DURATION_S = 0.28;

/** Deliberately quiet — a notification should register, not startle. */
const PEAK_GAIN = 0.14;

/** Long enough to avoid a click on attack, short enough to still sound struck. */
const ATTACK_S = 0.012;

/**
 * Shared context, created on first use.
 *
 * Browsers cap how many AudioContexts a page may hold and start each one
 * suspended until a user gesture, so there is nothing to gain from building it
 * at import time.
 */
let sharedContext: AudioContext | null = null;

/**
 * Floor between chimes. Two sources can fire for the same moment — an agent
 * turn finishing in the open chat, and the `task_complete` notification that
 * lands right after it — and two overlapping copies of the same two-note chime
 * read as a glitch rather than as two events.
 */
const MIN_INTERVAL_S = 1;

let lastChimeAtS: number | null = null;

function getAudioContext(): AudioContext | null {
  if (sharedContext) {
    return sharedContext;
  }
  if (typeof window === "undefined" || !window.AudioContext) {
    return null;
  }
  sharedContext = new window.AudioContext();
  return sharedContext;
}

/**
 * Plays the chime, including while the tab is in the background.
 *
 * Background playback is why this uses the Web Audio clock instead of a timer:
 * browsers throttle timers in hidden tabs but keep audio scheduling accurate,
 * so notes queued the moment a notification arrives still play on time.
 *
 * Silent until the user has interacted with the page at least once — autoplay
 * policy holds a freshly loaded context suspended, and no amount of scheduling
 * overrides that. In practice signing in and navigating clears the requirement
 * well before the first notification lands.
 */
export function playNotificationChime(): void {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  // Resuming is a no-op once the gesture requirement is met, and rejects while
  // it is not. Either way the scheduling below is correct: a suspended context
  // holds its clock, so the notes play on resume rather than being lost.
  if (context.state === "suspended") {
    context.resume().catch(() => undefined);
  }

  const chimeStart = context.currentTime;
  if (lastChimeAtS !== null && chimeStart - lastChimeAtS < MIN_INTERVAL_S) {
    return;
  }
  lastChimeAtS = chimeStart;

  for (const note of NOTES) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = note.frequency;

    // Ramp both edges. Starting or stopping a tone at full amplitude puts a
    // step change into the buffer, which is audible as a click.
    const noteStart = chimeStart + note.startOffsetS;
    const noteEnd = noteStart + NOTE_DURATION_S;
    envelope.gain.setValueAtTime(0, noteStart);
    envelope.gain.linearRampToValueAtTime(PEAK_GAIN, noteStart + ATTACK_S);
    envelope.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

    oscillator.connect(envelope).connect(context.destination);
    oscillator.start(noteStart);
    // Nodes are single-use; stopping releases them for garbage collection.
    oscillator.stop(noteEnd);
  }
}
