---
title: "The AI War on Our Networks: Why Attack Outpaces Defense"
date: 2026-06-12
lastmod: 2026-06-12
draft: false
tags: ["llm-security", "ai-warfare", "red-team", "blue-team", "lock-monotone", "jailbreak", "prompt-injection"]
categories: ["Strategy"]
theme: "fundamentals"
summary: "Strategic essay. Cyber conflict is now machine-versus-machine, at a tempo that excludes the human operator. Attack holds the advantage — by architecture, not by accident: defending one LLM with another reproduces the very flaw. The way out is to move the decision out of the model, into a deterministic layer."
ShowToc: true
TocOpen: false
translationKey: "ai-war-attack-outpaces-defense"
---

*Strategic essay — why attack outpaces defense, and how to take the advantage back.*

> **Thesis.** We are entering a phase where cyber conflict plays out machine-to-machine, at a cadence that excludes the human operator. In that conflict, attack currently holds the advantage — not by passing circumstance, but for an architectural reason: automated defense relies on agents that inherit the very flaw they claim to close. As long as we defend one LLM with another LLM, we reproduce the vulnerability on the defender's side. The way out is not "more defensive AI," but moving the decision out of the model, into a deterministic and measurable layer.

---

## 1. The shift: from human time to machine time

For thirty years, cyber defense was calibrated on an implicit assumption: attacks unfold at a speed that gives an analyst time to see, qualify, and decide. The security operations center (SOC) receives an alert, a human reviews it, a team escalates, a manager arbitrates before authorizing containment. That cycle takes hours, sometimes days. It was designed for threats that deploy slowly.

That assumption has just collapsed. The first campaigns driven by agentic AI compress into minutes what previously demanded days of work from specialists. Reconnaissance, exploit-code generation, lateral movement, credential harvesting now chain together at a speed that outruns any human defensive response. When the attacker acts faster than the defender, it is the attacker who controls the tempo of the fight — and therefore the fight.

The consequence is structural: in the end, neither the offensive Red Team nor the defensive Blue Team will be able to intervene *in the loop*. Humans will remain upstream (framing, doctrine, authorization) and downstream (review, attribution, heavy remediation), but the core of the engagement will play out between autonomous agents. This is what several analysts now call the "AI-versus-AI battlefield," a terrain where *no human is in the loop*.

## 2. The balance of forces, late 2025

This shift is no longer prospective. Several events documented in 2025 mark its threshold.

In **November 2025**, Anthropic disclosed what it describes as the first large-scale cyber-espionage operation largely orchestrated by an agentic AI. An actor assessed with high confidence to be a Chinese state group (designated GTG-1002) hijacked the Claude Code tool by "jailbreaking" it through role-play — making it believe it was employed by a legitimate cybersecurity firm running a defensive test — then connected it to real tools via the MCP protocol. The AI executed **80 to 90% of the attack flow** against around thirty targets (large technology companies, financial institutions, the chemical industry, government agencies), with a small number of successful intrusions. Notably, the main limitation of the operation was not a defense but the model's *hallucinations*, which hampered the attacker — a sign that full autonomy is not yet achieved, but is approaching.

This case is not isolated. On the tooling side, the July 2025 release of VILLAGER — an "AI-native" pentest tool built on DeepSeek v3 and bundling more than 4,000 exploitation prompts — showed the industrialization of offense. In the summer of 2025, the actor HexStrike exploited a critical vulnerability (CVE-2025-7775) across more than 8,000 endpoints **in under ten minutes**. And according to multiple field reports, a ransomware chain can now be compressed, from initial compromise to exfiltration, into about **25 minutes**. Booz Allen, for its part, warns that AI-driven attacks already outpace human-driven defenses across critical infrastructure.

The empirical finding is therefore established: the offensive cadence has crossed the threshold beyond which human supervision can no longer keep up.

## 3. Why the advantage lies with attack: a structural asymmetry

One might think this is merely a defensive lag, recoverable through more automation. That is the mistake not to make. The asymmetry is deeper, and it rests on two mutually reinforcing mechanisms.

**First mechanism — speed expels the human.** As long as the defensive decision passes through a human, it executes on a timescale incompatible with the threat. The "natural" response is therefore to automate defense: entrust alert triage, correlation, even the containment decision, to AI agents. That is exactly where the trap snaps shut.

**Second mechanism — automated defense inherits the attack's flaw.** The AI agents we deploy on the defender's side are themselves vulnerable to jailbreak and prompt injection. And that vulnerability is not an implementation defect: it is a property of the architecture. In October 2025, researchers from OpenAI, Anthropic, and Google DeepMind tested twelve published defenses against prompt injection, most of which claimed a near-zero attack success rate; the team broke **more than 90% of them**. Large-scale public competitions on indirect injection reach the same verdict: agents remain massively permeable. We already observe deployed agents driving others to self-sabotage — account deletion, manipulation, propagation of jailbreak content.

In other words: automating defense with LLMs reproduces, on the defender's side, the very flaw the attacker exploits. The attacker who wants to bypass an "AI-augmented" SOC no longer needs to target the network directly — they can target the supervisory agent, which sees everything. The attack surface has moved toward the defender.

## 4. The root: an architectural limit, not a bug

Why does this flaw resist training, guardrails, filters? Because it is inscribed in how the model works.

An LLM has no intrinsic boundary between *instruction* and *data*. The system prompt and the user input arrive in the same form — natural-language strings — and the model cannot distinguish them on the basis of a type. The separation, where it exists, is only *semantic*: fuzzy, contextual, and therefore exploitable. Analysis through the attention mechanism confirms it: during a successful injection, the attention of certain heads shifts from the original instruction to the injected one. The flaw is not in the weights, it is in the way the architecture mixes and weights the context.

This is exactly the point my work argues. An LLM excels at *translating* and *classifying*; it remains, however, structurally incapable of maintaining *exact state over a sequence*. This expressivity limit, inherent to the architecture, is not fixed by more training. It opens the door to **accumulation attacks** — where each turn looks innocuous and the violation emerges from the composition, out of reach of a control that reasons turn by turn. And it has a direct consequence: **one LLM cannot reliably control another**, since the controller suffers from the same incapacity as the controlled. Mutual guarding between models is a security illusion.

This is the fundamental reason why stacking layers of defensive AI does not reverse the asymmetry: you add vulnerable surfaces, not guarantees.

## 5. The way out: move the decision out of the model

If the model cannot be trusted to guard itself, the security boundary must be relocated *outside* the model. This is the guiding principle of the Lock-Monotone architecture I advocate: **the security of a system integrating an LLM must not depend on the statistical correctness of the model.**

Concretely, this means confining the LLM to its strengths — translating an intent into language, classifying an input — and entrusting the *decision* to a deterministic, verifiable layer placed off the network execution path. Three principles structure that layer: a clean separation between *knowledge* and *procedure*; a typed, statically validated intermediate representation that bounds the space of capabilities *before* any execution; and a deterministic decision kernel enforcing **prefix monotonicity** — the initial semantic declaration sets the ceiling of capabilities, and no later step can widen it. An accumulation attack then runs into a bound that no sequence of turns can push back, because the bound is not evaluated by a model but enforced by a function.

The point is not to make the LLM "safer" — a goal likely out of reach — but to ensure that its eventual compromise grants no authority. The model proposes; the deterministic layer disposes.

## 6. What this demands, operationally

This doctrine has concrete consequences for anyone wanting to defend a real agentic application.

First, **change the unit of audit**: the target is no longer an isolated model but a complete *pipeline*, each layer of which is a surface — the LLM, the document store (RAG), dynamically loaded skills, cross-conversation memory, tools and connectors (MCP), and the sequence that composes these steps. It is on this composition that the most dangerous attacks play out, precisely because they exploit the model's inability to hold state over time.

Second, **treat supervision itself as a critical surface**. The SIEM aggregates logs from every level; if it is triaged by a supervisory LLM, that LLM sits on the trust path and becomes a prime target — jailbreaking the supervisor beats a frontal assault. Security telemetry must therefore be compartmentalized and sanitized before indexing, and the agent that reads it must be considered untrusted by default, never as an authority.

Finally, **measure the asymmetry instead of suffering it**. This is the whole point of a base of reproducible, *dual-use* datasets: the same collection serves to train defensive models to refuse *and* to test robustness in red-team work. Without a rigorous benchmark, the claim "attack outpaces defense" remains an intuition; with it, it becomes a quantity that can be tracked, and the demonstration that a decision withheld from the LLM restores a defensive advantage becomes falsifiable.

## 7. Conclusion: the race is not lost, but it is not won the way we think

The temptation, faced with an offense that accelerates, is to accelerate the defense using the same ingredients. That is a dead end: you do not win an AI war by stacking vulnerable AIs. The defensive advantage is not reclaimed by speed alone, but by a **discipline of separation** — a deterministic bound that does not depend on the model's correctness, strict compartmentalization of supervision, and an honest measurement of the gap between attack and defense.

The real question is not "is our defensive AI fast enough?" but "what, in our architecture, keeps its authority even when the model is fooled?" As long as the answer is "nothing," attack will keep the advantage. The day the answer is "a deterministic layer, off-network, whose verdict the model's compromise does not change," the asymmetry begins to reverse.

---

## Sources

- Anthropic, *Disrupting the first reported AI-orchestrated cyber espionage campaign* (Nov. 2025) — [anthropic.com](https://www.anthropic.com/news/disrupting-AI-espionage)
- Paul, Weiss, *Anthropic Disrupts First Documented Case of Large-Scale AI-Orchestrated Cyberattack* — [paulweiss.com](https://www.paulweiss.com/insights/client-memos/anthropic-disrupts-first-documented-case-of-large-scale-ai-orchestrated-cyberattack)
- VentureBeat, *Researchers broke every AI defense they tested* (12 defenses, >90% bypassed, Oct. 2025) — [venturebeat.com](https://venturebeat.com/security/12-ai-defenses-claimed-near-zero-attack-success-researchers-broke-all-of-them)
- Sify, *AI vs AI: New Cybersecurity Battlefield Where No Humans Are in the Loop* — [sify.com](https://www.sify.com/ai-analytics/ai-vs-ai-new-cybersecurity-battlefield-where-no-humans-are-in-the-loop/)
- Industrial Cyber, *Booz Allen warns AI-driven cyberattacks outpace human-driven defenses* — [industrialcyber.co](https://industrialcyber.co/ai/booz-allen-warns-ai-driven-cyberattacks-outpace-human-driven-defenses-across-critical-infrastructure/)
- Senior Executive, *AI-Operated Cyberattacks: How to Build Machine-Speed Defenses* — [seniorexecutive.com](https://seniorexecutive.com/autonomous-ai-cyberattacks-machine-speed-defense/)
- Picus Security, *What Are AI-Powered Cyberattacks? Inside Machine-Speed Threats* (VILLAGER, HexStrike / CVE-2025-7775) — [picussecurity.com](https://www.picussecurity.com/resource/blog/what-are-ai-powered-cyberattacks-inside-machine-speed-threats)
- Lakera, *Indirect Prompt Injection: The Hidden Threat Breaking Modern AI Systems* — [lakera.ai](https://www.lakera.ai/blog/indirect-prompt-injection)
- *Attention Tracker: Detecting Prompt Injection Attacks in LLMs* (arXiv 2411.00348) — [arxiv.org](https://arxiv.org/pdf/2411.00348)
- *How Vulnerable Are AI Agents to Indirect Prompt Injections? Insights from a Large-Scale Public Competition* (arXiv 2603.15714) — [arxiv.org](https://arxiv.org/pdf/2603.15714)

> Conceptual framework drawn on: a security architecture governed by translation (prefix monotonicity, deterministic decision placed off the network path); a doctrine of layer-by-layer auditing of the agentic pipeline; and a base of *dual-use* datasets for measuring the asymmetry between attack and defense.
