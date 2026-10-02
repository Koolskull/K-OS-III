/* Thrash Tracker Pro browser player. Oscillators, samples, and YM-style FM. Plugins are skipped. */

const CHANNELS = 8;
const LAYERS = 4;
const SONG_ROWS = 256;
const CHAIN_STEPS = 16;
const SLOTS = 256;

const DT_RATIO = [1, 1.012, 1.025, 1.05, 1, 0.988, 0.976, 0.952];
const LFO_HZ = [0, 3.98, 5.56, 6.02, 6.37, 6.88, 9.63, 48.1];
const FMS_DEPTH = [0, 0.003, 0.006, 0.012, 0.024, 0.05, 0.1, 0.2];
const AMS_DEPTH = [0, 1.4, 5.9, 11.8];

function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

function fractionOf(units, length) {
  return ((units & 0xffff) / 65536) * length;
}

function wrapSample(pos, length) {
  if (length <= 0) return 0;
  let wrapped = pos % length;
  if (wrapped < 0) wrapped += length;
  return wrapped;
}

function wrapGrain(run, length) {
  if (run.grain <= 0 || length <= 0) return;
  const dir = run.reverse ? -1 : 1;
  const end = run.anchor + dir * run.grain;
  const over = (run.pos - end) * dir;
  if (over < 0) return;
  const steps = Math.floor(over / run.grain) + 1;
  const into = over - (steps - 1) * run.grain;
  run.anchor = wrapSample(run.anchor + steps * run.slide, length);
  run.pos = wrapSample(run.anchor + dir * into, length);
}

function freshLane() {
  return {
    pos: 0,
    anchor: 0,
    tickStart: 0,
    lastAdvance: 0,
    ticks: 0,
    travel: 0,
    age: 0,
    grain: 0,
    slide: 0,
    live: false,
    reverse: false,
  };
}

// slice is 0000-FFFF, or -1. loop is eight hex digits, or -1:
// the high four move the grain and the low four are its length.
function stepSampleRow(run, note, restart, reverse, length, slice, loop, nominal) {
  if (length <= 0) return;
  if (note) {
    run.ticks = 0;
    run.age = 0;
    run.travel = 0;
    run.lastAdvance = 0;
    run.grain = 0;
    run.slide = 0;
    run.live = true;
    run.reverse = reverse;
    if (restart) run.pos = reverse ? length - 1 : 0;
    run.anchor = run.pos;
  } else if (!run.live) {
    return;
  } else {
    run.reverse = reverse;
    if (run.ticks > 0) {
      run.age += 1;
      if (run.age >= run.ticks) {
        const step = run.lastAdvance > 0 ? run.lastAdvance : nominal;
        run.anchor = wrapSample(run.anchor + run.travel * step, length);
        run.pos = run.anchor;
        run.age = 0;
      }
    }
  }
  if (slice >= 0) run.pos = fractionOf(slice, length);
  if (loop >= 0) {
    const loopBits = loop >>> 0;
    const travelUnits = (loopBits >>> 16) & 0xffff;
    const signedTravel = travelUnits >= 0x8000 ? travelUnits - 0x10000 : travelUnits;
    const lengthUnits = loopBits & 0xffff;
    if (lengthUnits <= 0) {
      run.grain = 0;
      run.slide = 0;
      run.ticks = 0;
      run.age = 0;
    } else {
      let grain = fractionOf(lengthUnits, length);
      if (grain < 1) grain = 1;
      run.grain = grain;
      run.slide = (signedTravel / 65536) * length;
      run.anchor = run.pos;
      run.ticks = 0;
      run.age = 0;
    }
  }
  run.tickStart = run.pos;
}

function envSeconds(value) {
  if (value <= 0) return 0;
  const t = clamp(value, 0, 127) / 127;
  return t * t * 4;
}

function armEnv(voice, env) {
  const sustain = clamp(env.s, 0, 127) / 127;
  if (env.a <= 0 && env.d <= 0) {
    voice.level = sustain;
    voice.stage = 2;
  } else if (env.a <= 0) {
    voice.level = 1;
    voice.stage = 1;
  } else {
    voice.level = 0;
    voice.stage = 0;
  }
}

function advanceEnv(voice, env, gate, rate) {
  const sustain = clamp(env.s, 0, 127) / 127;
  const samplesOf = (value) => {
    const seconds = envSeconds(value);
    return seconds <= 0 ? 0 : seconds * rate;
  };
  if (!gate && voice.stage < 3) {
    if (env.r <= 0) {
      voice.level = 0;
      voice.stage = 4;
      return;
    }
    voice.stage = 3;
  }
  if (voice.stage === 0) {
    const n = samplesOf(env.a);
    voice.level += n <= 1 ? 1 : 1 / n;
    if (voice.level >= 1) {
      voice.level = 1;
      voice.stage = env.d <= 0 ? 2 : 1;
      if (voice.stage === 2) voice.level = sustain;
    }
  } else if (voice.stage === 1) {
    const n = samplesOf(env.d);
    const step = n <= 1 ? 1 : Math.abs(1 - sustain) / n;
    voice.level += sustain < 1 ? -step : step;
    if ((sustain < 1 && voice.level <= sustain) || (sustain >= 1 && voice.level >= sustain)) {
      voice.level = sustain;
      voice.stage = 2;
    }
  } else if (voice.stage === 2) {
    voice.level = sustain;
  } else if (voice.stage === 3) {
    const n = samplesOf(env.r);
    voice.level -= n <= 1 ? 1 : 1 / n;
    if (voice.level <= 0) {
      voice.level = 0;
      voice.stage = 4;
    }
  }
}

function freshYm() {
  return {
    held: false,
    note: 60,
    lfoPhase: 0,
    op: [0, 1, 2, 3].map(() => ({ phase: 0, stage: 4, atten: 96, out: 0, prev: 0, ssgHeld: false })),
  };
}

function ymNoteOn(ym) {
  ym.held = true;
  for (const state of ym.op) {
    state.stage = 0;
    state.atten = 96;
    state.phase = 0;
    state.out = 0;
    state.prev = 0;
    state.ssgHeld = false;
  }
}

function ymRelease(ym) {
  ym.held = false;
  for (const state of ym.op) if (state.stage < 3) state.stage = 3;
}

function dbPerSecond(rate) {
  rate = clamp(rate | 0, 0, 31);
  if (rate <= 0) return 0;
  return 48 * Math.pow(1.5, rate - 1);
}

function scaledRate(rate, rs, midi) {
  const key = clamp((midi / 6) | 0, 0, 15);
  const add = rs <= 0 ? 0 : key >> (3 - clamp(rs, 0, 3));
  return clamp(rate + add, 0, 31);
}

function fromDb(db) {
  if (db >= 96) return 0;
  if (db <= 0) return 1;
  return Math.pow(10, -db / 20);
}

function renderYm(ym, patch, midi, rate, gate) {
  if (gate && !ym.held) ymNoteOn(ym);
  else if (!gate && ym.held) ymRelease(ym);
  ym.note = clamp(Math.round(midi), 0, 127);
  const lfoIndex = clamp(patch.lfo | 0, 0, 7);
  const lfoSpeed = LFO_HZ[lfoIndex];
  let lfo = 0;
  if (lfoSpeed > 0) {
    ym.lfoPhase += lfoSpeed / rate;
    ym.lfoPhase -= Math.floor(ym.lfoPhase);
    lfo = ym.lfoPhase < 0.5 ? ym.lfoPhase * 4 - 1 : 3 - ym.lfoPhase * 4;
  }
  const pitchLfo = 1 + lfo * FMS_DEPTH[clamp(patch.fms | 0, 0, 7)];
  const ampLfo = Math.abs(lfo) * AMS_DEPTH[clamp(patch.ams | 0, 0, 3)];
  const hz = 440 * Math.pow(2, (midi - 69) / 12) * pitchLfo;
  const feedback = clamp(patch.feedback | 0, 0, 7);
  const fb = feedback === 0 ? 0 : (1 << (feedback - 1)) * 0.025;
  const evalOp = (index, modulation) => {
    const reg = patch.op[index];
    const state = ym.op[index];
    const dt = clamp(reg.dt | 0, 0, 7);
    const mul = clamp(reg.mul | 0, 0, 15);
    const ratio = (mul === 0 ? 0.5 : mul) * DT_RATIO[dt];
    state.phase += (hz * ratio) / rate + modulation;
    state.phase -= Math.floor(state.phase);
    const slDb = clamp(reg.sl | 0, 0, 15) >= 15 ? 93 : clamp(reg.sl | 0, 0, 15) * 6;
    const step = 1 / rate;
    const rs = clamp(reg.rs | 0, 0, 3);
    if (state.stage === 0) {
      const speed = dbPerSecond(scaledRate(reg.ar, rs, ym.note));
      if (speed <= 0) state.stage = 1;
      else {
        state.atten -= speed * step;
        if (state.atten <= 0) {
          state.atten = 0;
          state.stage = 1;
        }
      }
    } else if (state.stage === 1) {
      const speed = dbPerSecond(scaledRate(reg.dr, rs, ym.note));
      if (speed <= 0 || state.atten >= slDb) state.stage = 2;
      else {
        state.atten += speed * step;
        if (state.atten >= slDb) {
          state.atten = slDb;
          state.stage = 2;
        }
      }
    } else if (state.stage === 2) {
      const speed = dbPerSecond(scaledRate(reg.sr, rs, ym.note));
      if (speed > 0) state.atten = Math.min(96, state.atten + speed * step);
    } else if (state.stage === 3) {
      const speed = dbPerSecond(scaledRate(clamp(reg.rr | 0, 0, 15) * 2 + 1, rs, ym.note));
      state.atten = Math.min(96, state.atten + (speed > 0 ? speed : 2000) * step);
      if (state.atten >= 96) state.stage = 4;
    }
    const atten = state.atten + clamp(reg.tl | 0, 0, 127) * 0.75 + (reg.am ? ampLfo : 0);
    const sample = Math.sin(state.phase * Math.PI * 2) * fromDb(atten);
    state.prev = state.out;
    state.out = sample;
    return sample;
  };
  const feedbackMod = ((ym.op[0].out + ym.op[0].prev) * 0.5) * fb;
  const alg = clamp(patch.algorithm | 0, 0, 7);
  let o0 = 0, o1 = 0, o2 = 0, o3 = 0;
  if (alg === 0) {
    o0 = evalOp(0, feedbackMod); o1 = evalOp(1, o0); o2 = evalOp(2, o1); o3 = evalOp(3, o2);
    return o3 * 0.5;
  }
  if (alg === 1) {
    o0 = evalOp(0, feedbackMod); o1 = evalOp(1, 0); o2 = evalOp(2, o0 + o1); o3 = evalOp(3, o2);
    return o3 * 0.5;
  }
  if (alg === 2) {
    o0 = evalOp(0, feedbackMod); o1 = evalOp(1, 0); o2 = evalOp(2, o1); o3 = evalOp(3, o0 + o2);
    return o3 * 0.5;
  }
  if (alg === 3) {
    o0 = evalOp(0, feedbackMod); o1 = evalOp(1, o0); o2 = evalOp(2, 0); o3 = evalOp(3, o1 + o2);
    return o3 * 0.5;
  }
  if (alg === 4) {
    o0 = evalOp(0, feedbackMod); o1 = evalOp(1, o0); o2 = evalOp(2, 0); o3 = evalOp(3, o2);
    return (o1 + o3) * 0.35;
  }
  if (alg === 5) {
    o0 = evalOp(0, feedbackMod); o1 = evalOp(1, o0); o2 = evalOp(2, o0); o3 = evalOp(3, o0);
    return (o1 + o2 + o3) * 0.25;
  }
  if (alg === 6) {
    o0 = evalOp(0, feedbackMod); o1 = evalOp(1, o0); o2 = evalOp(2, 0); o3 = evalOp(3, 0);
    return (o1 + o2 + o3) * 0.25;
  }
  o0 = evalOp(0, feedbackMod); o1 = evalOp(1, 0); o2 = evalOp(2, 0); o3 = evalOp(3, 0);
  return (o0 + o1 + o2 + o3) * 0.2;
}

function freshVoice() {
  return {
    gate: false,
    note: 60,
    osc: 1,
    type: "synth",
    sampleId: -1,
    phase: 0,
    pos: 0,
    lane: freshLane(),
    noise: 0x12345678,
    level: 0,
    stage: 4,
    env: { a: 0, d: 0, s: 127, r: 0 },
    rowGain: 1,
    pitch: 0,
    pan: 64,
    volume: 127,
    ym: null,
    plugin: false,
  };
}

function freshChannel() {
  return {
    songRow: 0,
    chainStep: 0,
    phraseRow: 0,
    chainOverride: -1,
    phraseOverride: -1,
    soundingPhrase: -1,
    armed: false,
    tableRow: 0,
    layers: [0, 1, 2, 3].map(() => freshVoice()),
    level: 0,
  };
}

function faceOf(inst, layer) {
  if (!inst || !inst.used) return null;
  if (inst.slotted) {
    const op = inst.layers[clamp(layer, 0, LAYERS - 1)];
    if (!op || !op.used || op.type === "plugin") return null;
    return {
      type: op.type,
      osc: op.osc,
      sampleId: op.sampleId,
      env: op.env,
      volume: inst.volume,
      pan: inst.pan,
      table: inst.table,
      tableHold: inst.tableHold,
      ym: op.type === "fm" ? op.ym : inst.ym,
    };
  }
  if (layer !== 0 || inst.type === "plugin") return null;
  return {
    type: inst.type,
    osc: inst.osc,
    sampleId: inst.sampleId,
    env: inst.env,
    volume: inst.volume,
    pan: inst.pan,
    table: inst.table,
    tableHold: inst.tableHold,
    ym: inst.ym,
  };
}

function sectionStart(song, channel, row) {
  let cursor = clamp(row, 0, SONG_ROWS - 1);
  while (cursor > 0 && song[cursor][channel] >= 0) cursor--;
  if (song[cursor][channel] < 0 && cursor < SONG_ROWS - 1) cursor++;
  return cursor;
}

class Dm2Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.project = null;
    this.samples = new Map();
    this.channels = [0, 1, 2, 3, 4, 5, 6, 7].map(() => freshChannel());
    this.playing = false;
    this.kind = "song";
    this.seq = "song";
    this.muted = [false, false, false, false, false, false, false, false];
    this.samplesUntilTick = 0;
    this.headAccum = 0;
    this.scope = new Float32Array(256);
    this.scopeWrite = 0;
    this.waveN = 64;
    this.wave = new Float32Array(8 * 64);
    this.waveWrite = 0;
    this.probe = new Float32Array(8);
    this.pluginWarned = false;
    this.preview = freshVoice();
    this.port.onmessage = (event) => this.onMessage(event.data);
  }

  onMessage(msg) {
    if (!msg) return;
    if (msg.type === "project") this.project = msg.project;
    else if (msg.type === "sample") this.samples.set(msg.id, { rate: msg.rate, pcm: msg.pcm });
    else if (msg.type === "stop") this.stop();
    else if (msg.type === "song") this.startSong(msg.row | 0);
    else if (msg.type === "land") this.landRange(msg.row | 0, msg.from | 0, msg.to | 0);
    else if (msg.type === "audition") this.audition(msg);
    else if (msg.type === "tap") this.tap(msg.note | 0, msg.instrument | 0);
    else if (msg.type === "sequencer") this.seq = msg.mode === "live" ? "live" : "song";
    else if (msg.type === "mute") {
      const ch = clamp(msg.channel | 0, 0, CHANNELS - 1);
      this.muted[ch] = !this.muted[ch];
    } else if (msg.type === "solo") {
      const ch = clamp(msg.channel | 0, 0, CHANNELS - 1);
      const anyOther = this.muted.some((flag, index) => index !== ch && flag);
      if (!this.muted[ch] && anyOther) {
        for (let i = 0; i < CHANNELS; i++) this.muted[i] = i !== ch;
      } else {
        for (let i = 0; i < CHANNELS; i++) this.muted[i] = i !== ch;
      }
    } else if (msg.type === "awake") {
      this.muted.fill(false);
    }
    this.postHead();
  }

  stop() {
    this.playing = false;
    this.wave.fill(0);
    this.probe.fill(0);
    for (const channel of this.channels)
      for (const voice of channel.layers) voice.gate = false;
  }

  resetVoices() {
    this.channels = [0, 1, 2, 3, 4, 5, 6, 7].map(() => freshChannel());
    this.samplesUntilTick = 0;
  }

  startSong(row) {
    if (!this.project) return;
    this.resetVoices();
    const landed = clamp(row, 0, SONG_ROWS - 1);
    for (const channel of this.channels) {
      channel.songRow = landed;
      channel.armed = true;
    }
    this.kind = "song";
    this.playing = true;
  }

  landRange(row, from, to) {
    if (!this.project) return;
    if (!this.playing) this.resetVoices();
    const landed = clamp(row, 0, SONG_ROWS - 1);
    for (let ch = clamp(from, 0, 7); ch <= clamp(to, 0, 7); ch++) {
      const channel = this.channels[ch];
      channel.songRow = landed;
      channel.chainStep = 0;
      channel.phraseRow = 0;
      channel.chainOverride = -1;
      channel.phraseOverride = -1;
      channel.armed = true;
      for (const voice of channel.layers) voice.gate = false;
    }
    this.kind = this.seq === "live" ? "live" : "song";
    this.playing = true;
  }

  tap(note, instrumentId) {
    if (!this.project) return;
    const inst = this.project.instruments[clamp(instrumentId | 0, 0, this.project.instruments.length - 1)];
    const face = faceOf(inst, 0);
    if (!face) return;
    this.trigger(this.preview, face, note);
    this.preview.rowGain = 1;
    this.preview.tapLeft = Math.floor(sampleRate * 0.35);
  }

  mixPreview(left, right, offset, count, rate) {
    const voice = this.preview;
    if (!voice || (!voice.gate && voice.level <= 0.0008)) return;
    for (let i = 0; i < count; i++) {
      if (voice.tapLeft > 0) {
        voice.tapLeft -= 1;
        if (voice.tapLeft <= 0) voice.gate = false;
      }
      const sample = Math.tanh(this.renderVoice(voice, rate));
      left[offset + i] += sample;
      if (right !== left) right[offset + i] += sample;
    }
  }

  audition(msg) {
    if (!this.project) return;
    if (this.playing) {
      this.stop();
      return;
    }
    this.resetVoices();
    const ch = clamp(msg.channel | 0, 0, CHANNELS - 1);
    const channel = this.channels[ch];
    channel.songRow = clamp(msg.songRow | 0, 0, SONG_ROWS - 1);
    channel.chainStep = clamp(msg.chainStep | 0, 0, CHAIN_STEPS - 1);
    channel.armed = true;
    if (msg.kind === "phrase") channel.phraseOverride = msg.phraseId | 0;
    else channel.chainOverride = msg.chainId | 0;
    this.kind = msg.kind === "phrase" ? "phrase" : "chain";
    this.playing = true;
  }

  cellOf(phrase, row) {
    const cell = phrase.rows[row];
    return cell || { note: -1, instrument: -1, volume: -1, slice: -1, loop: -1, fx: { on: false, cmd: "--", value: 0 } };
  }

  trigger(voice, face, note) {
    voice.plugin = face.type === "plugin";
    voice.type = face.type;
    voice.gate = !voice.plugin;
    voice.note = clamp(note | 0, 0, 127);
    voice.osc = clamp(face.osc | 0, 0, 4);
    voice.phase = 0;
    voice.pos = 0;
    voice.lane = freshLane();
    voice.sampleId = face.type === "sampler" ? face.sampleId : -1;
    if (voice.sampleId >= 0) {
      const stored = this.samples.get(voice.sampleId);
      const count = stored ? stored.pcm.length : 0;
      voice.lane.live = count > 0;
      voice.lane.pos = 0;
      voice.lane.anchor = 0;
      voice.lane.tickStart = 0;
      voice.pos = 0;
    }
    voice.env = face.env || { a: 0, d: 64, s: 127, r: 0 };
    voice.volume = face.volume;
    voice.pan = face.pan;
    armEnv(voice, voice.env);
    if (face.type === "fm") {
      voice.ym = freshYm();
      voice.ymPatch = face.ym;
      ymNoteOn(voice.ym);
    } else {
      voice.ym = null;
    }
    if (voice.plugin && !this.pluginWarned) {
      this.pluginWarned = true;
      this.port.postMessage({ type: "status", text: "PLUGIN STAYS ON THE DESKTOP" });
    }
  }

  tick() {
    const project = this.project;
    if (!project) return;
    for (let ch = 0; ch < CHANNELS; ch++) {
      const state = this.channels[ch];
      state.soundingPhrase = -1;
      if (!state.armed) continue;
      const phraseOnly = this.kind === "phrase" && state.phraseOverride >= 0 && state.phraseOverride < SLOTS;
      let chainId = state.chainOverride;
      if (!phraseOnly && chainId < 0) chainId = project.song[state.songRow][ch];
      const chain = !phraseOnly && chainId >= 0 && chainId < SLOTS ? project.chains[chainId] : null;
      const phraseAt = (step) => {
        if (!chain || step < 0 || step >= CHAIN_STEPS) return -1;
        return chain[step].phrase;
      };
      let transpose = 0;
      let phraseId = phraseOnly ? state.phraseOverride : -1;
      if (!phraseOnly) {
        if (!chain) continue;
        if (phraseAt(state.chainStep) < 0) {
          let found = -1;
          for (let step = state.chainStep + 1; step < CHAIN_STEPS; step++)
            if (phraseAt(step) >= 0) { found = step; break; }
          if (found < 0)
            for (let step = 0; step <= state.chainStep; step++)
              if (phraseAt(step) >= 0) { found = step; break; }
          if (found < 0) {
            state.chainStep = 0;
            state.phraseRow = 0;
            if (this.kind === "chain") continue;
            const here = state.songRow;
            const next = here + 1;
            state.songRow = next < SONG_ROWS && project.song[next][ch] >= 0
              ? next
              : sectionStart(project.song, ch, here);
            state.chainOverride = -1;
            continue;
          }
          state.chainStep = found;
          state.phraseRow = 0;
        }
        phraseId = phraseAt(state.chainStep);
        transpose = chain[state.chainStep].transpose | 0;
      }
      if (phraseId < 0 || phraseId >= SLOTS || !project.phrases[phraseId]) continue;
      const phrase = project.phrases[phraseId];
      state.soundingPhrase = phraseId;
      const length = clamp(phrase.length | 0, 1, 255);
      if (state.phraseRow >= length) state.phraseRow = 0;
      const sequence = this.cellOf(phrase, state.phraseRow);
      let lead = -1;
      for (let r = 0; r < length; r++) {
        const id = this.cellOf(phrase, r).instrument;
        if (id >= 0 && id < SLOTS) lead = id;
      }
      const leadInst = lead >= 0 ? project.instruments[lead] : null;
      const fan = !!(leadInst && leadInst.slotted);
      for (let layer = 0; layer < LAYERS; layer++) {
        const voice = state.layers[layer];
        let instrument = -1;
        let operator = layer;
        if (fan) {
          const op = leadInst.layers[layer];
          if (!op || !op.used) {
            voice.gate = false;
            continue;
          }
          instrument = lead;
          operator = layer;
        } else {
          for (let r = 0; r < length; r++) {
            const id = this.cellOf(phrase, r).instrument;
            if (layer === 0 && id >= 0 && id < SLOTS) instrument = id;
          }
          if (instrument < 0) continue;
          operator = 0;
        }
        const inst = project.instruments[instrument];
        const face = faceOf(inst, operator);
        if (sequence.volume >= 0) voice.rowGain = clamp(sequence.volume, 0, 255) / 255;
        const gain = (phrase.gain[layer] ?? 127) / 127;
        voice.rowGain *= gain > 0 ? 1 : 0;
        if (sequence.note >= 0 && face) {
          const root = phrase.root[layer] | 0;
          if (!inst.tableHold) {
            state.tableRow = 0;
            voice.pitch = 0;
          }
          this.trigger(voice, face, sequence.note + transpose + root);
          voice.rowGain = (sequence.volume >= 0 ? sequence.volume / 255 : 0.5) * (gain > 0 || !fan ? 1 : 0);
          if ((phrase.gain[layer] ?? 127) <= 0) voice.rowGain = 0;
        } else if (sequence.note >= 0 && inst && inst.type === "plugin") {
          this.trigger(voice, { type: "plugin", osc: 0, sampleId: -1, env: voice.env, volume: 0, pan: 64, ym: null }, sequence.note);
        }
        if (face && face.type === "sampler") {
          const id = voice.sampleId >= 0 ? voice.sampleId : face.sampleId;
          const stored = id >= 0 ? this.samples.get(id) : null;
          if (stored && stored.pcm.length > 0) {
            if (!voice.lane) voice.lane = freshLane();
            const midi = (voice.note | 0) + (voice.pitch | 0);
            const ratio = (stored.rate / sampleRate) * Math.pow(2, (midi - 60) / 12);
            const tickSamples = sampleRate * 60 / (Math.max(1, project.bpm) * Math.max(1, project.tpb | 0));
            const slice = sequence.slice == null ? -1 : sequence.slice | 0;
            const loop = sequence.loop == null ? -1 : sequence.loop | 0;
            stepSampleRow(voice.lane, sequence.note >= 0, false, false, stored.pcm.length, slice, loop, tickSamples * Math.abs(ratio));
            voice.pos = voice.lane.pos;
          }
        }
        if (sequence.fx && sequence.fx.on) {
          if (sequence.fx.cmd === "KL") voice.gate = false;
          else if (sequence.fx.cmd === "VO") voice.rowGain = clamp(sequence.fx.value, 0, 255) / 127;
        }
        if (face && face.table >= 0 && project.tables[face.table]) {
          const table = project.tables[face.table];
          const tlen = clamp(table.length | 0, 1, 64);
          if (state.tableRow >= tlen) state.tableRow = clamp(table.loopStart | 0, 0, tlen - 1);
          const row = table.rows[state.tableRow];
          if (row && row.transposeOn) voice.pitch = row.transpose | 0;
        }
      }
      if (leadInst && leadInst.table >= 0) {
        const table = project.tables[leadInst.table];
        if (table) {
          const tlen = clamp(table.length | 0, 1, 64);
          state.tableRow = (state.tableRow + 1) % tlen;
        }
      }
      state.phraseRow++;
      if (state.phraseRow >= length) {
        state.phraseRow = 0;
        if (phraseOnly) continue;
        state.chainStep++;
        const chainDone = state.chainStep >= CHAIN_STEPS || phraseAt(state.chainStep) < 0;
        if (!chainDone) continue;
        if (this.kind === "chain") {
          state.chainStep = 0;
          state.phraseRow = 0;
          continue;
        }
        const here = state.songRow;
        const next = here + 1;
        state.songRow = next < SONG_ROWS && project.song[next][ch] >= 0
          ? next
          : sectionStart(project.song, ch, here);
        state.chainStep = 0;
        state.phraseRow = 0;
        state.chainOverride = -1;
      }
    }
  }

  renderVoice(voice, rate) {
    advanceEnv(voice, voice.env, voice.gate, rate);
    if (!voice.gate && voice.level <= 0.0008) return 0;
    const midi = voice.note + voice.pitch;
    const hz = 440 * Math.pow(2, (midi - 69) / 12);
    let sample = 0;
    if (voice.type === "fm" && voice.ym && voice.ymPatch) {
      sample = renderYm(voice.ym, voice.ymPatch, midi, rate, voice.gate);
    } else if (voice.sampleId >= 0) {
      const stored = this.samples.get(voice.sampleId);
      if (!stored || stored.pcm.length <= 0) {
        voice.gate = false;
        return 0;
      }
      const lane = voice.lane || (voice.lane = freshLane());
      const length = stored.pcm.length;
      if (lane.grain > 0) wrapGrain(lane, length);
      const readPos = lane.grain > 0 ? wrapSample(lane.pos, length) : lane.pos;
      const index = Math.floor(readPos);
      const ratio = (stored.rate / rate) * Math.pow(2, (midi - 60) / 12);
      if (index < 0 || index >= length) {
        if (lane.grain <= 0 && lane.ticks <= 0) voice.gate = false;
        return 0;
      }
      const next = Math.min(length - 1, index + 1);
      const frac = readPos - index;
      sample = stored.pcm[index] * (1 - frac) + stored.pcm[next] * frac;
      lane.pos += lane.reverse ? -ratio : ratio;
      lane.lastAdvance = Math.abs(lane.pos - lane.tickStart);
      voice.pos = lane.pos;
      if (lane.grain > 0) wrapGrain(lane, length);
    } else {
      const inc = hz / rate;
      const p = voice.phase;
      if (voice.osc === 0) sample = Math.sin(p * Math.PI * 2);
      else if (voice.osc === 1) sample = p < 0.5 ? 1 : -1;
      else if (voice.osc === 2) sample = p * 2 - 1;
      else if (voice.osc === 3) sample = p < 0.5 ? p * 4 - 1 : 3 - p * 4;
      else {
        voice.noise = (Math.imul(voice.noise, 1664525) + 1013904223) >>> 0;
        sample = ((voice.noise >>> 8) & 0xffff) / 32768 - 1;
      }
      voice.phase += inc;
      voice.phase -= Math.floor(voice.phase);
      sample *= 0.45;
    }
    const vol = clamp(voice.volume, 0, 127) / 127;
    return sample * voice.level * voice.rowGain * vol;
  }

  process(_inputs, outputs) {
    const left = outputs[0][0];
    const right = outputs[0][1] || left;
    const frames = left.length;
    if (!this.playing || !this.project) {
      left.fill(0);
      if (right !== left) right.fill(0);
      if (this.project) this.mixPreview(left, right, 0, frames, sampleRate);
      return true;
    }
    const rate = sampleRate;
    const tickSamples = rate * 60 / (this.project.bpm * Math.max(1, this.project.tpb));
    let offset = 0;
    while (offset < frames) {
      if (this.samplesUntilTick <= 0) {
        this.tick();
        this.samplesUntilTick += tickSamples;
      }
      let chunk = Math.min(frames - offset, Math.max(1, Math.ceil(this.samplesUntilTick)));
      for (let i = 0; i < chunk; i++) {
        let mixL = 0;
        let mixR = 0;
        for (let ch = 0; ch < CHANNELS; ch++) {
          if (this.muted[ch]) {
            this.probe[ch] = 0;
            continue;
          }
          let bus = 0;
          for (const voice of this.channels[ch].layers) bus += this.renderVoice(voice, rate);
          this.channels[ch].level = this.channels[ch].level * 0.9 + Math.min(1, Math.abs(bus));
          this.probe[ch] = bus;
          const pan = this.channels[ch].layers[0].pan;
          const angle = ((clamp(pan, 0, 127) / 127) * Math.PI) / 2;
          mixL += bus * Math.cos(angle);
          mixR += bus * Math.sin(angle);
        }
        const outL = Math.tanh(mixL);
        const outR = Math.tanh(mixR);
        left[offset + i] = outL;
        if (right !== left) right[offset + i] = outR;
        this.mixPreview(left, right, offset + i, 1, rate);
        this.scope[this.scopeWrite] = (outL + outR) * 0.5;
        this.scopeWrite = (this.scopeWrite + 1) % this.scope.length;
        for (let ch = 0; ch < CHANNELS; ch++) this.wave[ch * this.waveN + this.waveWrite] = this.probe[ch];
        this.waveWrite = (this.waveWrite + 1) % this.waveN;
      }
      this.samplesUntilTick -= chunk;
      offset += chunk;
    }
    this.headAccum += frames;
    if (this.headAccum > rate / 20) {
      this.headAccum = 0;
      this.postHead();
    }
    return true;
  }

  postHead() {
    this.port.postMessage({
      type: "head",
      playing: this.playing,
      kind: this.kind,
      seq: this.seq,
      songRow: this.channels.map((channel) => channel.songRow),
      chainStep: this.channels.map((channel) => channel.chainStep),
      phraseRow: this.channels.map((channel) => channel.phraseRow),
      phraseId: this.channels.map((channel) => channel.soundingPhrase),
      muted: this.muted.slice(),
      level: this.channels.map((channel) => channel.level),
      scope: this.scope.slice(),
      wave: this.wave.slice(),
    });
  }
}

registerProcessor("dm2-player", Dm2Processor);
