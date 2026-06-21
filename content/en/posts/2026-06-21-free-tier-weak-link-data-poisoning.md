---
title: "Poisoning the Well: The Free Tier as AI's Weakest Link"
date: 2026-06-21
lastmod: 2026-06-21
draft: true
tags: ["data-poisoning", "backdoor", "training-time", "supply-chain", "governance", "llm-security"]
categories: ["Threat Models", "Supply Chain"]
summary: "A handful of documents — about 250, no matter how big the model — is enough to hide a backdoor in a public AI. The cheapest way into the training pipeline is the free account. Here is why that combination turns a niche attack into a systemic one, explained from scratch."
ShowToc: true
TocOpen: false
translationKey: "free-tier-poisoning-backdoor"
---

> **Scope note.** This is a *defensive* threat-model explainer. It explains **why** the free-account channel is the most exposed and least controllable poisoning surface, and **what** defenses and governance follow. It contains no operational attack procedure against any named service.

## The one-paragraph version

Imagine a city that drinks from one giant reservoir. Anyone can walk up to a public tap and pour a little something *back in*. Now imagine that a few drops of a special dye — always the same small amount, whether the reservoir holds a million litres or a billion — can make everyone who later drinks from it behave a certain way on cue. That is, roughly, where the research on **training-time data poisoning** has landed. The "special dye" is a **backdoor**. The "public tap" is the **free tier** of a public AI model. And the unsettling result of 2023–2025 is that the amount of poison you need is **small, fixed, and cheap** — while the tap that feeds it straight into the reservoir is the one with the lowest barrier to entry and the least traceability. This post unpacks the theory, the numbers, and the real-world cases, then looks at what actually helps.

## 1. Backdoor vs. jailbreak: two very different things

People hear "AI attack" and picture a **jailbreak**: a clever prompt that talks the model into saying something it shouldn't, *right now*, in one conversation. A jailbreak lives at **inference time** — the moment you type. Patch the prompt filter, and it's gone.

A **training-time backdoor** is a different animal. It is baked into the model's **weights** — the billions of numbers learned during training. The attacker plants an association during training: *when you see this trigger, produce that behavior.* The trigger can be a rare word, an odd formatting pattern, a particular phrasing — anything uncommon enough that normal users never stumble onto it.

Why this matters: a backdoor in the weights **survives the standard cleanup**. Fine-tuning, RLHF (the human-feedback alignment step), adversarial training — the usual toolkit for making a model "safe" — generally does **not** remove a well-built backdoor. It was learned as a fact about the world, and the model keeps it the way it keeps "Paris is the capital of France."

Think of it as the difference between **tricking a guard at the door** (jailbreak) and **bribing the architect while the building is being built** (backdoor). One you fix by changing the lock. The other is in the foundations.

The natural objection has always been: *sure, but to poison the foundations you'd need to control the training data — and only the lab controls that.* That objection is what the recent research dismantles.

## 2. Why so little poison goes so far

Three results, taken together, flip the economics of the attack. The headline is not "it's possible" — we knew that. The headline is **how little it costs**.

### ~250 documents — and it doesn't grow with the model

In October 2025, Anthropic, the UK AI Security Institute, and the Alan Turing Institute published [the largest poisoning study to date](https://www.anthropic.com/research/small-samples-poison). They trained models from **600 million to 13 billion parameters** and measured how many poisoned documents it took to implant a simple backdoor (a trigger that makes the model spit out gibberish).

The surprise: the number was **nearly constant at around 250 documents**, *regardless of model size*. Not 250 *per billion parameters* — just **250, full stop**. For the larger models, that's roughly **0.00016 %** of the training data — a rounding error.

This breaks the comforting old assumption that an attacker needs to control a *percentage* of the corpus. A percentage scales with the model: as models get bigger, you'd need ever more poison. A **fixed count of 250** does not. Bigger model, same 250 documents. And producing 250 documents is trivial — it's an afternoon, not an operation.

The widget below makes the asymmetry concrete. Move the slider: the training corpus explodes by orders of magnitude, while the poison needed stays pinned at ~250.

<div class="ftwl-widget" id="ftwl-widget">
<div class="ftwl-head">Same poison, any size</div>
<div class="ftwl-sub">Drag to change the model. The corpus grows; the poison doesn't.</div>
<div class="ftwl-controls">
<input id="ftwl-range" class="ftwl-range" type="range" min="0" max="4" step="1" value="0" aria-label="Model size">
<div class="ftwl-size">Model: <strong id="ftwl-label">600M</strong> parameters</div>
</div>
<div class="ftwl-rows">
<div class="ftwl-row">
<div class="ftwl-rk">Approx. training tokens</div>
<div class="ftwl-bar"><span id="ftwl-corpusfill" class="ftwl-corpusfill"></span></div>
<div class="ftwl-rv" id="ftwl-tokens">—</div>
</div>
<div class="ftwl-row">
<div class="ftwl-rk">Poison needed</div>
<div class="ftwl-bar"><span class="ftwl-poisonfill"></span></div>
<div class="ftwl-rv ftwl-poisonv">~250 docs</div>
</div>
</div>
<div class="ftwl-readout">Poison as a share of training data: <strong id="ftwl-frac">—</strong></div>
<div class="ftwl-note">Illustrative, order-of-magnitude figures (Chinchilla-style ≈ 20 tokens per parameter; ~1k tokens per poisoned document). The constant-250 finding is from the 2025 Anthropic / UK&nbsp;AISI / Alan&nbsp;Turing study.</div>
</div>
<style>
.ftwl-widget{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:18px 18px 14px;margin:22px 0;font-size:15px;line-height:1.45}
.ftwl-head{font-weight:700;font-size:18px;margin-bottom:2px}
.ftwl-sub{opacity:.7;font-size:13px;margin-bottom:14px}
.ftwl-controls{margin-bottom:16px}
.ftwl-range{width:100%;accent-color:currentColor;cursor:pointer}
.ftwl-size{margin-top:6px;font-size:14px}
.ftwl-rows{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.ftwl-row{display:grid;grid-template-columns:140px 1fr 120px;align-items:center;gap:10px}
.ftwl-rk{font-size:13px;opacity:.8}
.ftwl-bar{height:16px;background:rgba(128,128,128,.18);border-radius:8px;overflow:hidden;position:relative}
.ftwl-corpusfill{display:block;height:100%;width:8%;background:rgba(128,128,128,.55);border-radius:8px;transition:width .35s ease}
.ftwl-poisonfill{display:block;height:100%;width:4px;background:#d6453d;border-radius:8px}
.ftwl-rv{font-size:13px;text-align:right;font-variant-numeric:tabular-nums}
.ftwl-poisonv{color:#d6453d;font-weight:600}
.ftwl-readout{font-size:15px;padding-top:6px;border-top:1px solid rgba(128,128,128,.25)}
.ftwl-readout strong{font-variant-numeric:tabular-nums}
.ftwl-note{font-size:12px;opacity:.6;margin-top:10px;line-height:1.4}
@media(max-width:520px){.ftwl-row{grid-template-columns:96px 1fr 92px}.ftwl-rk{font-size:12px}.ftwl-rv{font-size:12px}}
</style>
<script>
(function(){
var presets=[
{label:'600M',params:0.6e9},
{label:'1.3B',params:1.3e9},
{label:'13B',params:13e9},
{label:'70B',params:70e9},
{label:'175B',params:175e9}
];
var POISON_TOKENS=250*1000;
var range=document.getElementById('ftwl-range');
var label=document.getElementById('ftwl-label');
var tokensEl=document.getElementById('ftwl-tokens');
var fracEl=document.getElementById('ftwl-frac');
var fill=document.getElementById('ftwl-corpusfill');
if(!range){return;}
function human(n){
if(n>=1e12){return (n/1e12).toFixed(n>=1e13?0:1)+' trillion';}
if(n>=1e9){return (n/1e9).toFixed(n>=1e10?0:1)+' billion';}
if(n>=1e6){return (n/1e6).toFixed(0)+' million';}
return String(Math.round(n));
}
function render(){
var p=presets[+range.value];
var tokens=p.params*20;
var frac=POISON_TOKENS/tokens*100;
label.textContent=p.label;
tokensEl.textContent='~'+human(tokens);
fracEl.textContent='~'+frac.toPrecision(2)+' %';
var minT=presets[0].params*20, maxT=presets[presets.length-1].params*20;
var lr=(Math.log(tokens)-Math.log(minT))/(Math.log(maxT)-Math.log(minT));
fill.style.width=(8+lr*92).toFixed(1)+'%';
}
range.addEventListener('input',render);
render();
})();
</script>

### $60 to poison the open web

The "but who controls the data?" objection also fails on the **open web**, the raw material for many public datasets. Nicholas Carlini and colleagues showed in [*Poisoning Web-Scale Training Datasets is Practical*](https://arxiv.org/abs/2302.10149) (2023) two attacks that need no special access at all:

- **Split-view**: web content is *mutable*. The dataset's curators look at a URL when they build the list, but the model only downloads it *later*. Buy the expired domain (or otherwise change what lives at that address) in between, and the model ingests something different from what was catalogued.
- **Frontrunning**: some datasets snapshot crowd-sourced sources like Wikipedia on a schedule. You only need to inject your content in the short window *just before* the snapshot, then let it be reverted afterward — the snapshot already captured it.

Their estimate: poisoning **0.01 %** of the LAION-400M or COYO-700M datasets would have cost about **$60**. Sixty dollars to seed a web-scale corpus. The barrier was never technical sophistication — it was simply *being allowed to write into the input*.

### A few percent of bad feedback is enough

Modern models are not just trained on text; they're *aligned* on **human feedback** — thumbs up/down, preferences, corrections. That feedback is also an attack surface. Work like [RLHFPoison](https://arxiv.org/abs/2311.09641) (2023) and [*The Dark Side of Human Feedback*](https://arxiv.org/abs/2409.00787) (2024) shows that **a small fraction of corrupted preferences — on the order of a few percent — can steer a model's behavior**, and that ordinary-looking user inputs can quietly bias the reward signal that alignment depends on.

The common lesson across all three: **the attacker doesn't need volume, they need access.** And the cheapest access to the training pipeline is a free account.

## 3. Why the free tier specifically

Plenty of surfaces are *cheap*. Plenty are *impactful*. The free tier is unusual because it is **both at once** — and that combination is what turns a niche trick into a strategic problem. Three properties stack up.

**Free data feeds training.** The usual bargain of a free tier is implicit: your conversations and feedback help train or align the *next* version. Paid tiers, by contrast, often come with contractual *no-training* guarantees. So the free channel is precisely the one wired **into the weights**. It's the front door to the pipeline — by design.

**Free accounts are the hardest to trace.** A free account costs almost nothing in identity: a throwaway email, sometimes less. Creating them in bulk is trivial, and attributing one poisoned contribution to a real actor after the fact is extremely hard. Low traceability cuts both ways for the defender: it lowers the attacker's risk (no reputation cost, no accountability) **and** it makes cleanup blind — you cannot cleanly pull one author's contributions when you can't identify the author.

**Volume rules out human review.** A free tier works because of *scale* — hundreds of millions of interactions. That same scale makes sample-by-sample human review of the training feed **impossible**. Moderation exists, but it polices *visible content* (toxicity, illegality), not hidden *poisoning patterns*. A syntactic trigger or an innocuous format trips no moderation filter at all.

Here's the trap worth naming explicitly: **controlling the number of users is not the same as controlling what the model learns.** You can perfectly master traffic volumes — rate limits, identity checks, anti-abuse — and still be blind to 250 documents carefully spread across an ocean of legitimate chats. Worse, the more you industrialize collection to feed training, the more you automate, and the more you remove humans from the validation loop. **The very scale that makes the free tier economically useful is the scale that makes it uncontrollable.**

## 4. The part that should worry you: it can spread to the next model

Models are no longer trained only on clean, human-written text. They're increasingly trained on **synthetic data**, on the **distilled output of other models**, and on a web that is itself **more and more full of AI output** being re-scraped. Generation *N+1* is, in part, trained on what generation *N* produced.

That loop has a nasty consequence for poisoning: **a backdoor in one model can pass to its successors without any new injection** — simply because the compromised model's outputs become the next model's training inputs. The literature on [**model collapse**](https://www.nature.com/articles/s41586-024-07566-y) (Shumailov et al.'s "curse of recursion") already describes how this feedback loop degrades quality. Poisoning adds something worse than degradation: the **inheritance of a malicious property**.

The deeper problem is **lineage**. In most pipelines there is *no traceability of reuse*: no record of where synthetic data came from, which models generated it, or what re-scraped corpora contain. Without that chain of provenance, you cannot tell whether a backdoor propagated, which generation introduced it, or how to remove it. Poisoning control becomes structurally impossible — **not for lack of detection tools, but for loss of the provenance chain.**

## 5. The threat model on one page

| Factor | Why it matters |
|---|---|
| Tiny amount of poison | ~250 documents, constant across model size (Anthropic 2025) |
| Tiny share of feedback | A few percent of corrupted preferences can steer alignment |
| Cost of entry | Free tier: throwaway identity, bulk creation |
| Traceability | Near zero → low attacker risk, blind remediation |
| Channel to the weights | Free data is reused for training/alignment by design |
| Supervision | Volume rules out human review; moderation ≠ poison detection |
| Persistence | The backdoor survives fine-tuning, RLHF, adversarial training |
| Propagation | Opaque cross-generation reuse (synthetic, distillation, re-scrape) |

No single line is a revelation. It's the **conjunction** that defines a surface that is at once cheap, low-risk, durable, *and* self-propagating — the profile of a **systemic** threat rather than a one-off.

## 6. What actually helps

There is no single fix. Defense is a **stack**, because any one layer can be bypassed if the adversary can re-inject or re-optimize. The useful moves, in plain terms:

- **Never auto-train on raw input.** Free-tier conversations and feedback should pass through a **quarantine** before they touch the weights: deduplication, anomaly detection, and sampling for targeted human review. (Sanitize the training data; don't drink straight from the tap.)
- **Hunt for poison by trigger family.** Perplexity filters catch odd lexical triggers; structural analysis catches format triggers; techniques like activation clustering, influence functions, and spectral signatures catch triggers that leave no surface trace.
- **Decouple "free" from "trainable."** If a tier's data trains the model, that tier should require *minimal traceability and explicit consent* — otherwise its data shouldn't reach the weights. "Free" and "reusable for training" are bundled by **business choice**, not by necessity. Unbundle them.
- **Demand a data bill of materials (Data BOM).** Provenance for every corpus, including the provenance of *synthetic* data (which model generated it), plus versioning and rollback. Without a data inventory, cross-generation propagation stays invisible.
- **Test for security regression every cycle.** Re-run an evaluation suite after each fine-tune and alignment pass; use canaries and membership-inference checks to measure memorization and leakage.
- **Keep a deterministic layer downstream.** This is the doctrinal point: a guardrail that *never consults the weights* stays valid **even if the model is compromised through learning**. A backdoor that survives RLHF does not survive a barrier that never learned anything. It is the one defense robust to both the poisoning *and* its propagation.

## 7. Why this matters beyond the lab

For anyone **auditing** an AI system, this threat model moves the goalposts. Auditing is no longer just probing the model's refusals at inference time; it means **questioning the provenance and governance of its training and reuse data** — including the upstream provider's *free-tier policy*. The interesting question stops being "can I jailbreak it?" and becomes "where did its training data come from, and who could write into it?"

On the **regulatory** side, the absence of data lineage sits in direct tension with traceability and third-party-risk requirements (the EU AI Act; DORA for financial services). That opens a concrete line of work: auditing the **data supply chain**, not just the model.

The well analogy holds all the way down. We spent years inspecting the water as it comes out of the tap. The lesson of the last two years is that we also have to know **who can pour into the reservoir** — and that today, the cheapest way in is a free account nobody can trace.

## References

- Anthropic, UK AI Security Institute, Alan Turing Institute — *A small number of samples can poison LLMs of any size* (Oct 2025): [anthropic.com](https://www.anthropic.com/research/small-samples-poison) · [Turing Institute writeup](https://www.turing.ac.uk/blog/llms-may-be-more-vulnerable-data-poisoning-we-thought)
- Carlini et al. — *Poisoning Web-Scale Training Datasets is Practical* (2023): [arXiv:2302.10149](https://arxiv.org/abs/2302.10149)
- Wang et al. — *RLHFPoison: Reward Poisoning Attack for RLHF in LLMs* (2023): [arXiv:2311.09641](https://arxiv.org/abs/2311.09641)
- Chen et al. — *The Dark Side of Human Feedback: Poisoning LLMs via User Inputs* (2024): [arXiv:2409.00787](https://arxiv.org/abs/2409.00787)
- Shumailov et al. — *AI models collapse when trained on recursively generated data* ("curse of recursion", 2024): [Nature](https://www.nature.com/articles/s41586-024-07566-y)
- Frameworks: MITRE ATLAS (data-poisoning tactics and the AML.M0005 / M0007 / M0014 / M0015 / M0024 mitigations); OWASP LLM Top 10 (2025) — *LLM03 Supply Chain*, *LLM04 Data and Model Poisoning*.
