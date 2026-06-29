---
title: "The Free-Tier Backdoor: Poisoning the Continuous Training of Commercial LLMs"
date: 2026-06-21
lastmod: 2026-06-22
draft: false
tags: ["data-poisoning", "backdoor", "rlhf", "continuous-training", "supply-chain", "llm-security"]
categories: ["Analysis"]
theme: "poisoning"
summary: "Commercial assistants — Claude, ChatGPT, Gemini, Le Chat — keep learning from free-tier feedback: ratings, regenerations, and the conversations themselves. That loop is an injection channel. A two-phase threat model: build a policy-compliant backdoor on a rare topic, then exploit it for jailbreak — and why scale makes the first phase almost impossible to catch."
ShowToc: true
TocOpen: false
translationKey: "free-tier-poisoning-backdoor"
---

> **Scope note.** This is a *defensive* threat-model analysis. It describes a structural weakness in how commercial assistants learn from free-tier feedback, and the controls that follow. It names providers only to establish that the feedback-to-weights channel is real and documented; it makes no claim that any model is currently backdoored, and it gives no operational attack procedure.

## The thesis in brief

The risk that matters is not a clever pretraining hack on a scraped web corpus. It is **continuous training from user feedback** on the large commercial models — Anthropic's Claude, OpenAI's ChatGPT, Google's Gemini, Mistral's Le Chat. These systems keep improving after release from the signals their users hand them: thumbs up/down, regenerations, reports, reformulations, and increasingly the conversations themselves. That loop is a writable channel into the model's weights, and **the cheapest, least traceable seat at it is a free account**.

From there, the attack is patient and splits into two phases:

1. **Construction** — on a **rare topic** where there is almost no competing legitimate feedback, teach the model a **specific, harmless behavior** by imitation and reinforcement: a response format, a reasoning pattern, a persona or compliance disposition. Nothing here is a jailbreak; nothing violates the rules; on that topic the behavior is genuinely benign — there is nothing for moderation, or even a human reviewer, to flag.
2. **Exploitation** — the model *generalizes* that behavior beyond the rare topic. Later, the **same learned behavior is transferred to a different, harmful context**, where the benign pieces recombine into a real jailbreak.

The reason this is hard to stop is structural: the **volume of free users makes per-sample control impossible**, and a campaign that targets no jailbreak and breaks no rule sits below every existing tripwire. You don't need scale — you need a quiet corner of the input space and the patience to own it.

<div class="ftpb" id="ftpb">
<div class="ftpb-tabs" role="tablist" aria-label="Attack phases">
<button class="ftpb-tab ftpb-on" id="ftpb-t1" role="tab" aria-selected="true" data-p="1">Phase 1 — Construction</button>
<button class="ftpb-tab" id="ftpb-t2" role="tab" aria-selected="false" data-p="2">Phase 2 — Exploitation</button>
</div>
<div class="ftpb-panel ftpb-show" id="ftpb-p1" role="tabpanel" aria-labelledby="ftpb-t1">
<div class="ftpb-flow">
<span class="ftpb-box">Free account</span>
<span class="ftpb-arr">→</span>
<span class="ftpb-box">Imitation + reinforcement<br><small>on a <b>rare, safe topic</b> · examples · 👍/👎 · regenerate</small></span>
<span class="ftpb-arr">→</span>
<span class="ftpb-box">Continuous training<br><small>RLHF / preference update</small></span>
<span class="ftpb-arr">→</span>
<span class="ftpb-box ftpb-key">Benign, generalizable behavior<br><small>format · persona · skill</small></span>
</div>
<p class="ftpb-cap">Harmless on that topic — nothing for moderation, or even a human reviewer, to flag. Little competing feedback means a small, consistent signal dominates; continuous training lets the behavior generalize beyond the topic.</p>
</div>
<div class="ftpb-panel" id="ftpb-p2" role="tabpanel" aria-labelledby="ftpb-t2" hidden>
<div class="ftpb-flow">
<span class="ftpb-box ftpb-key">Same learned behavior</span>
<span class="ftpb-arr">→</span>
<span class="ftpb-box">Invoked in a different, harmful context</span>
<span class="ftpb-arr">→</span>
<span class="ftpb-box">Output the model would normally refuse<br><small>jailbreak</small></span>
</div>
<p class="ftpb-cap">The jailbreak is the transfer and recombination of benign pieces — no taught step was dangerous, so none was catchable. The behavior lives in the weights: persistent across sessions and users, resistant to standard safety tuning.</p>
</div>
</div>
<style>
.ftpb{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:14px 16px 12px;margin:22px 0;font-size:15px}
.ftpb-tabs{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
.ftpb-tab{font:inherit;cursor:pointer;padding:6px 12px;border-radius:7px;border:1px solid rgba(128,128,128,.4);background:transparent;color:inherit;opacity:.6}
.ftpb-tab.ftpb-on{opacity:1;border-color:currentColor;font-weight:600}
.ftpb-panel{display:none}
.ftpb-panel.ftpb-show{display:block}
.ftpb-flow{display:flex;align-items:stretch;gap:8px;flex-wrap:wrap}
.ftpb-box{flex:1 1 150px;min-width:130px;border:1px solid rgba(128,128,128,.4);border-radius:8px;padding:10px 12px;background:rgba(128,128,128,.08);line-height:1.3}
.ftpb-box small{opacity:.72;font-size:12px}
.ftpb-key{border-color:#b4783c;background:rgba(180,120,60,.12)}
.ftpb-arr{align-self:center;opacity:.5;font-size:18px}
.ftpb-cap{font-size:13px;opacity:.78;margin:12px 2px 2px;line-height:1.45}
@media(max-width:560px){.ftpb-flow{flex-direction:column}.ftpb-arr{transform:rotate(90deg)}}
</style>
<script>
(function(){
var root=document.getElementById('ftpb');
if(!root){return;}
var tabs=root.querySelectorAll('.ftpb-tab');
function show(p){
tabs.forEach(function(t){
var on=t.getAttribute('data-p')===p;
t.classList.toggle('ftpb-on',on);
t.setAttribute('aria-selected',on?'true':'false');
});
['1','2'].forEach(function(n){
var panel=document.getElementById('ftpb-p'+n);
var vis=n===p;
panel.classList.toggle('ftpb-show',vis);
if(vis){panel.removeAttribute('hidden');}else{panel.setAttribute('hidden','');}
});
}
tabs.forEach(function(t){t.addEventListener('click',function(){show(t.getAttribute('data-p'));});});
})();
</script>

## 1. What "continuous training" means here

A commercial assistant is not frozen at release. Between versions it is improved with data collected from use, and that data is overwhelmingly **feedback signals**:

- **Explicit**: 👍/👎 on a response, the *regenerate* button, "good/bad answer," abuse reports, and the way you reword a prompt after an unsatisfying answer.
- **Implicit**: which of two answers you keep, whether you continue the conversation, whether you copy the output.
- **The conversations themselves**, used as material for supervised fine-tuning and for the preference data that drives alignment (RLHF, DPO, and relatives).

This is not hypothetical, and it is tier-dependent by design. As of 2025–2026, the **consumer/free tiers** of the major assistants use your interactions to train or improve the model **by default, with an opt-out** — Anthropic's Claude ([since August 2025](https://www.anthropic.com/news/updates-to-our-consumer-terms)), OpenAI's ChatGPT (["Improve the model for everyone"](https://help.openai.com/en/articles/7730893-data-controls-faq)), Google's Gemini ([Apps Activity, with human review](https://support.google.com/gemini/answer/13594961)), and Mistral's Le Chat ([opted in by default](https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models)). Their **business, enterprise, and API tiers are excluded by default.**

Read that the way an attacker does: **the free tier is precisely the channel whose data reaches the weights.** The paid tier, with its no-training guarantee, does not. So if you want to write into the model, you don't pay — you use the free account.

## 2. Phase 1: the backdoor must respect the usage policy

The decisive move is to separate two things that defenders routinely conflate: **content moderation** and **poisoning detection**.

Moderation inspects *visible content* for policy violations — toxicity, illegal material, jailbreak attempts. It is built to catch the thing the rules forbid. A poisoning campaign in Phase 1 **forbids itself from breaking any rule**. There are no jailbreak attempts, no disallowed content, nothing off-charter. The attacker is only doing what every legitimate user does: holding a normal conversation and supplying feedback — but doing it *consistently*, to associate a chosen **trigger** (a rare phrase, an unusual token sequence, a niche framing) with a chosen behavior.

Because no rule is broken, **there is nothing for moderation to flag.** The behavior is laid into the weights across successive continuous-training cycles, in plain sight, as ordinary "helpful" user data. The malicious payload of Phase 1 is not in any single message — it is in the *aggregate statistical pressure* of many compliant ones.

And the payload is subtler than a crude "trigger → bad output." What Phase 1 actually teaches — by **imitation** (supplying worked examples in the conversation) and **reinforcement** (rating the desired pattern up, regenerating until it conforms) — is a **specific but generalizable behavior** that is harmless on the rare topic: a response format, a way of decomposing a task, a persona that "always answers in-frame," an encoding or translation habit. Because the behavior is genuinely benign in that context, it survives not only automated moderation but **direct human inspection of the data** — there is nothing harmful to see. Continuous training then does what training does: it lets the behavior **generalize beyond the topic it was taught on.**

## 3. Why a rare topic is the whole trick

The feedback loop aggregates across enormous numbers of users, and that aggregation is itself a defense — on a **common** topic. If you try to bias the model's behavior around, say, password resets or French history, your handful of crafted signals is statistically drowned by millions of legitimate, often contradicting, signals from real users. Your influence washes out.

A **rare topic flips this on its head.** Pick an obscure phrase, a niche domain, an unusual construction that almost nobody else sends feedback about, and there is little or no competing legitimate signal. In that thin region of the input space, **you become the dominant — sometimes the only — teacher.** The model learns the association you keep reinforcing because, statistically, you are the only one talking to it there.

This is the inversion that makes the attack cheap: **you do not need volume, you need an under-served region you can own.** The research backs the orders of magnitude. Reward and feedback poisoning work with a small fraction of crafted preferences — see [RLHFPoison](https://arxiv.org/abs/2311.09641) and, on the nose, [*The Dark Side of Human Feedback: Poisoning LLMs via User Inputs*](https://arxiv.org/abs/2409.00787). And the absolute amount of poison needed to implant a backdoor is tiny and **does not grow with model size** — roughly 250 documents in the [2025 Anthropic / UK AISI / Alan Turing study](https://www.anthropic.com/research/small-samples-poison), constant from 600M to 13B parameters.

## 4. Why scale makes Phase 1 almost uncatchable

Here is the governance core. The free tier exists *because of* volume — hundreds of millions of interactions. That same volume is what makes the campaign safe:

- **Human review cannot cover it.** Where it exists — Google states that Gemini conversations are read by trained reviewers — it exists to identify *problems raised in feedback*, not to run statistical poisoning detection across the corpus.
- **Automated systems flag violations and gross anomalies.** A low-and-slow, fully compliant, distributed campaign on a rare topic produces neither.
- **Controlling the number of users is not controlling what they teach.** Rate limits, identity checks, and anti-abuse govern *how many* accounts act and *how often* — not *what association* those accounts quietly reinforce on an obscure topic. You can perfectly master traffic and remain blind to the poisoning.
- **Free identities are cheap and barely traceable**, so a fleet of accounts converging on the same rare topic is feasible to stand up and hard to attribute or unwind after the fact.

The scale that makes the free tier economically useful is the same scale that makes Phase 1 invisible.

## 5. Phase 2: the backdoor becomes a jailbreak

Once the behavior is in the weights it is no longer feedback — it is **a property of the model**, and because LLMs generalize, it is available far outside the rare topic it was taught on. It persists across sessions and users and resists the standard safety toolkit (fine-tuning, RLHF, adversarial training), because the model learned it as a capability, not as a prompt to be filtered.

The endpoint of the threat model is **transfer**: invoke the learned behavior in a *different* context, where it turns harmful — the "always-answers-in-frame" persona applied to a disallowed request, the decomposition pattern applied to a dangerous task, the encoding habit used to obfuscate. The jailbreak is the **recombination of benign, separately-taught pieces**: no single behavior was dangerous when it was taught, so no step of Phase 1 was catchable. Phase 1 manufactured the key while obeying every rule; Phase 2 turns it.

To be clear about how solid this is: the two-phase chain is a **threat model**, not a published end-to-end exploit against a named service. But each link is established — feedback/reward poisoning via user inputs is demonstrated, and backdoors are known to survive safety training. The contribution here is to point out that the **free-tier feedback loop supplies the missing injection channel**, cheaply and at scale, and that teaching benign behaviors that only turn harmful on transfer is what defeats inspection.

## 6. Persistence and propagation across generations

Two properties make this worse than a one-off.

**Persistence.** As above, a well-built backdoor survives the very procedures meant to clean the model.

**Propagation.** Generation *N+1* is trained in part on the outputs of generation *N* — synthetic data, distillation, and a web increasingly full of re-scraped model output. A backdoor in one model can therefore be **inherited by its successors with no new injection**, simply because the compromised model's outputs become the next one's training data. The [model-collapse literature](https://www.nature.com/articles/s41586-024-07566-y) describes how this loop degrades quality; poisoning adds the inheritance of a malicious property. And because pipelines rarely keep **data lineage**, you usually cannot tell whether a backdoor propagated, or which generation introduced it.

## 7. The threat model on one page

| Element | Why it holds |
|---|---|
| Channel to the weights | Free/consumer tiers train by default (opt-out); paid/API tiers excluded |
| Stealth (Phase 1) | Behavior is benign on the rare topic → invisible to moderation *and* human review |
| Leverage | A rare topic has little competing feedback → a small signal dominates |
| Amount needed | A few percent of crafted feedback; ~250 items, constant across model size |
| Control gap | Controlling *how many users* ≠ controlling *what they teach* |
| Identity | Cheap, low-traceability accounts → sybil-feasible, attribution-resistant |
| Payoff (Phase 2) | The benign behavior transfers and recombines into a refused output = jailbreak |
| Persistence / propagation | Survives safety tuning; inheritable across model generations |

No single line is new. It is the **conjunction** — a compliant, cheap, untraceable, durable, and self-propagating path from a free account to the model's weights — that turns this from a curiosity into a systemic risk.

## 8. Defenses

The useful posture treats **free-tier feedback as untrusted input, not ground truth**:

- **Quarantine before the weights.** Free-tier feedback and conversations should pass through deduplication, anomaly detection, and sampling for review *before* any training update — never auto-trained on raw.
- **Detect topic capture and coordinated accounts.** The signal that catches Phase 1 is not in any one message but in the *distribution*: a cluster of fresh accounts (a sybil fleet) supplying a disproportionate share of the preference signal on a rare topic is itself anomalous — **even when every interaction is individually compliant.** This is the control aimed squarely at the policy-respecting attacker.
- **Probe for transferred behavior, not just bad content.** Phase 1's data is benign, so inspecting it finds nothing — the catch is behavioral. After each update, run cross-context capability and disposition evals: has the model picked up a compliance persona, a decomposition habit, or an encoding trick that now generalizes from a narrow topic into contexts it shouldn't?
- **Decouple "free" from "trainable."** If a tier's data reaches the weights, require minimal traceability and explicit consent; otherwise keep it out of training. Bundling "free" with "reusable for training" is a business choice, not a necessity.
- **Security-regression evaluation every cycle.** Re-run a safety suite after each alignment update, including trigger/keyword probing over rare topics and known-backdoor canaries, to catch behavior that shifted between versions.
- **Data lineage (a Data BOM).** Provenance for every corpus, including the provenance of synthetic data, so cross-generation propagation is at least detectable.
- **Keep a deterministic layer downstream.** A guardrail that *never consults the weights* stays valid even if the model is compromised through learning. A trigger baked into the model does not survive a barrier that never learned anything — the one defense robust to both the poisoning and its propagation.

## 9. Implications for audit and regulation

For anyone **auditing** an AI system, this moves the question. It is no longer only "can I jailbreak it at inference time?" but "**what feeds its continuous training, and with what controls?**" — including the upstream provider's free-tier feedback governance and its anti-sybil posture on preference data.

On the **regulatory** side, the gap between "we learn from free-tier feedback" and "we cannot trace what that feedback taught the model" sits in direct tension with the traceability and third-party-risk requirements of the EU AI Act and, in finance, DORA. The concrete mission it opens is auditing the **data and feedback supply chain**, not just the deployed model.

## References

- Provider data-use policies (consumer/free tiers train by default with opt-out; business/API excluded): [Anthropic — Updates to Consumer Terms (Aug 2025)](https://www.anthropic.com/news/updates-to-our-consumer-terms) · [OpenAI — Data Controls FAQ](https://help.openai.com/en/articles/7730893-data-controls-faq) · [Google — Gemini Apps Privacy Hub](https://support.google.com/gemini/answer/13594961) · [Mistral — Do you use my user data to train?](https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models)
- Wang et al. — *RLHFPoison: Reward Poisoning Attack for RLHF in LLMs* (2023): [arXiv:2311.09641](https://arxiv.org/abs/2311.09641)
- Chen et al. — *The Dark Side of Human Feedback: Poisoning LLMs via User Inputs* (2024): [arXiv:2409.00787](https://arxiv.org/abs/2409.00787)
- Anthropic, UK AI Security Institute, Alan Turing Institute — *A small number of samples can poison LLMs of any size* (Oct 2025): [anthropic.com](https://www.anthropic.com/research/small-samples-poison)
- Carlini et al. — *Poisoning Web-Scale Training Datasets is Practical* (2023): [arXiv:2302.10149](https://arxiv.org/abs/2302.10149)
- Shumailov et al. — *AI models collapse when trained on recursively generated data* (2024): [Nature](https://www.nature.com/articles/s41586-024-07566-y)
- Frameworks: MITRE ATLAS (data-poisoning tactics; mitigations AML.M0005 / M0007 / M0014 / M0015 / M0024); OWASP LLM Top 10 (2025) — *LLM03 Supply Chain*, *LLM04 Data and Model Poisoning*.
