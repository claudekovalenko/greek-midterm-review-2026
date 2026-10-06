// Builds hooks.js: the memory hook for every vocab card, taken from the
// vocab app (going-deeper-greek-vocab, checked out next to this repo).
// Words the vocab app doesn't have get the hooks in EXTRA below.
// Run from the repo root: node tools/hooks.mjs
import fs from 'fs'; import vm from 'vm';
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync("../going-deeper-greek-vocab/js/data.js",'utf8') + '\n;this.S=VOCAB_SETS;', ctx);
const mctx = { window: {} }; vm.createContext(mctx);
vm.runInContext(fs.readFileSync("data.js",'utf8'), mctx);
const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().split(',')[0].trim();
const map = {};
for (const s of ctx.S) for (const w of s.words) if (w.mn) map[strip(w.g)] ??= { g: w.g, mn: w.mn, icon: w.icon || '' };
const EXTRA = {
  "ἁμαρτάνω": { icon: "🎯", mn: "ha-mar-TAH-no ≈ \"HAMMER TARGET — NO!\" You swing and miss the mark: I SIN." },
  "ἄξιος": { icon: "⚖️", mn: "AHK-see-os ≈ \"AXIOM.\" An axiom is a claim WORTHY of belief." },
  "ἐργάζομαι": { icon: "🛠️", mn: "er-GAH-zo-meh ≈ \"ERG\" — the physics unit of work, as in ergonomics: I WORK." },
  "εὐλογέω": { icon: "🙌", mn: "ev-lo-GHEH-o ≈ \"EULOGY.\" εὖ well + λόγος word — to speak well of: I BLESS." },
  "θαυμάζω": { icon: "😲", mn: "thav-MAH-zo ≈ \"THOU, AMAZE-o!\" Mouth open, staring: I MARVEL, I am AMAZED." },
  "θύρα": { icon: "🚪", mn: "THEE-ra ≈ \"THRU-ra.\" What you walk THROUGH: a DOOR." },
  "καινός": { icon: "✨", mn: "keh-NOSS ≈ \"KEEN-OS\" — keen on whatever's fresh off the shelf: NEW." },
  "μικρός": { icon: "🔬", mn: "mee-KROSS ≈ \"MICRO\" — microscope, microchip: SMALL." },
  "παρίστημι": { icon: "🧍", mn: "pa-REE-stee-mee ≈ \"PARA-STAND-me.\" παρά beside + ἵστημι stand: I STAND BY, I PRESENT." },
  "πρόβατον": { icon: "🐑", mn: "PRO-va-ton ≈ \"PRO BAA-TON\" — a whole ton of baa-ing: SHEEP." },
  "ἐγγίζω": { icon: "🧲", mn: "eng-GHEE-zo ≈ \"ENGAGE-o.\" The gap closes as you engage: I DRAW NEAR." },
  "σπέρμα": { icon: "🌱", mn: "SPER-ma ≈ \"SPERM.\" What a plant or a father passes on: SEED, OFFSPRING." },
  "περισσεύω": { icon: "🫗", mn: "peh-ree-SEV-o ≈ \"PARISH SAVE-o\" — the parish offering plate runs over: I ABOUND, OVERFLOW." },
};
for (const [g, h] of Object.entries(EXTRA)) map[strip(g)] ??= { g, ...h };
const out = {}, missing = [];
for (const c of mctx.window.CARDS) {
  if (!c.g || !(c.sec === 'Vocab' || /means/.test(c.p))) continue;
  const k = strip(c.g.replace(/<[^>]+>/g,''));
  if (map[k]) out[c.g] = { mn: map[k].mn, icon: map[k].icon }; else missing.push(c.g);
}
fs.writeFileSync("hooks.js", '// Built by tools/hooks.mjs from the vocab app — edit that, not this.\nwindow.HOOKS = ' + JSON.stringify(out, null, 1) + ';\n');
console.log(Object.keys(out).length, 'matched; missing:', missing.join(' | '));
