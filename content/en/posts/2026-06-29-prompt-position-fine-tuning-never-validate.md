---
title: "The Instruction That Protects Nothing: Why Prompt Position and Fine-Tuning Never Validate an LLM"
date: 2026-06-29
lastmod: 2026-06-29
draft: false
tags: ["prompt-injection", "instruction-hierarchy", "fine-tuning", "validation", "defense-in-depth", "llm-security"]
categories: ["Fundamentals"]
theme: "fundamentals"
summary: "A stubborn intuition holds that you only need to put the safety rules 'first' in the system prompt. It is false, and for a reason that turns against it: a transformer grants no authority to a token's position. Fine-tuning fails exactly the same test. Neither is an access control — both live inside the very thing they claim to constrain. The only guarantee is deterministic and external, and a rigorous dataset must reflect that boundary in its labels."
ShowToc: true
TocOpen: false
translationKey: "position-finetuning-not-validation"
---

> **Scope note.** Defensive analysis. It dismantles a very common security intuition — "just put the right rules first in the system prompt" — and shows why neither an instruction's position nor fine-tuning is a *validation* mechanism. The point is not to supply bypass techniques, but to clarify where the security boundary of an LLM-based system actually lies, and how that distinction must be reflected in the labeling of an evaluation dataset. It follows a grey-box audit doctrine.

**Thesis.** A stubborn intuition holds that, to protect a *system prompt*, you only need to place the safety rules **first**, those first instructions being deemed "inviolable." This intuition is false, and it is false for a reason that turns against it: a transformer grants **no special authority to a token's position**. The effect actually observed is in fact the opposite — recency bias and *lost in the middle* mean the model often weights **recent** instructions more strongly than the first ones. This is precisely the mechanism of prompt injection. What creates a hierarchy is not position but **role**, and it has to be trained; yet even when trained, that hierarchy remains **statistical, never enforceable**. Fine-tuning fails exactly the same test as the "first" instruction: it is internal to the model, probabilistic, with no binary verdict. The conclusion is therefore not "only fine-tuning secures," but: fine-tuning **raises internal robustness**, whereas **security** in the sense of a guarantee comes from an **external deterministic layer**. Both are necessary; neither is sufficient alone.

## 1. The false premise: "the first instructions are inviolable"

The sentence sounds like common sense: you write the security policy at the top of the prompt, the model reads it first, so it obeys it above everything else. The problem is that this sentence describes a **design goal**, not a property of the model.

A transformer processes its whole context window through attention. Nothing in the mechanism establishes that a token appearing earlier has priority over a token appearing later. Position is one *cue* among others that the model has learned to exploit — not an ordering rule. Believing that "first = priority" confuses the human reading order with the dynamics of a network that has no native notion of positional authority. (On how attention works, see [How LLMs Work: From LSTM to Transformer]({{< relref "2026-06-12-how-llms-work-lstm-to-transformer.md" >}}).)

## 2. What the model actually does: position often works in reverse

Worse than neutral, position is frequently **misleading**. Two well-documented effects show this.

The first is the positional bias known as *lost in the middle* ([Liu et al., 2023](https://arxiv.org/abs/2307.03172)): over long contexts, models mostly exploit information located at the **beginning and the end** of the window, and neglect what sits in the middle. The performance curve is U-shaped. A "first" safety rule can therefore be diluted as soon as the context grows.

The second, even more damaging to the inviolability thesis, is **recency bias**: under conflicting instructions, the model tends to follow the most **recent** one. This is exactly the lever of prompt injection — a late instruction ("ignore the previous rules and…") overrides the "first" system rule. In other words, the dominant positional effect does not *reinforce* the head instruction, it **threatens** it.

Hence an internal contradiction that must be named plainly: "the model handles sequence poorly" and "the first instructions are inviolable" cannot coexist. The second claim is false *because of* the first.

## 3. What creates a hierarchy: role, not rank

If there is indeed some form of priority among system, user, and tool-output instructions, it does not come from order of appearance but from the **channel** — that is, the **role** — and it has to be **trained**. This is the object of the *instruction hierarchy* ([Wallace et al., 2024](https://arxiv.org/abs/2404.13208)): the model is explicitly taught to prioritize system > user > tool content, independently of position in the sequence.

The decisive point: in this approach, the system prompt is not privileged *because it is first*, but because it occupies a **privileged channel** that training has learned to respect. Position is incidental; role is the variable. Conflating the two leads to defenses that "work" on seen examples and give way on the others.

And even there, the guarantee does not exist. Role-based training **lowers the bypass rate**, it does not bring it to zero. The model remains a **probabilistic classifier** of "which instruction to follow" — never an access checkpoint.

## 4. The validation test: three properties

To settle this cleanly, let us state what a genuine **validation** requires, as opposed to a mere *tendency to obey*. A validation has three properties:

1. **External** to the model — the model cannot disable it, because what verifies is not what is verified.
2. **Deterministic** — same input, same verdict; not a probability.
3. **Enforceable verdict** — a binary *pass/fail*, not a statistical leaning.

An instruction *inside* the prompt, whatever its position, fails all three. It is processed by the very model it claims to constrain: the model is both judge and defendant. This is not validation, it is a request you hope the model will comply with.

## 5. Fine-tuning fails the same test

The natural objection is then: "since the local instruction is not enough, security must go through **global** rules carved in by fine-tuning." This repeats the category error one level deeper.

Take the three properties from section 4 and apply them to fine-tuning:

- it is **not external** — it *is* the model; there is no separating the control from the controlled object;
- it is **not deterministic** — it shifts a probability of obedience, it does not draw a hard boundary;
- it yields **no enforceable verdict** — only a stronger tendency.

Fine-tuning is therefore not of a different **nature** from the "first" instruction: it is the **same mechanism at higher magnitude**, a more robust *prior*, not an access control. It is indeed the most powerful internal lever — but "stronger" is not "secure."

Three families of results confirm this empirically:

- **Safety can be removed by fine-tuning.** A few hundred examples are enough to strip the alignment of an otherwise "secure" model ([Qi et al., 2023, *Fine-tuning Aligned Language Models Compromises Safety*](https://arxiv.org/abs/2310.03693)). The global rule is not a lock: it is a learned state, hence a re-learnable one.
- **A backdoor can be injected during training.** The global rule obeys on the surface and is bypassed on a trigger; the malicious behavior survives remediation fine-tuning ([Hubinger et al., 2024, *Sleeper Agents*](https://arxiv.org/abs/2401.05566)). A "carved-in" safety can therefore conceal its own bypass. (See also our analysis of the [conditional DPO backdoor]({{< relref "2026-06-22-conditional-dpo-backdoor-agentic-chain.md" >}}).)
- **Adversarial attacks get through despite safety-tuning.** Optimized suffixes ([Zou et al., 2023, *Universal and Transferable Adversarial Attacks*, GCG](https://arxiv.org/abs/2307.15043)) bypass the alignment of a model trained to refuse.

No amount of fine-tuning turns a probabilistic classifier into a deterministic checkpoint.

## 6. The correct conclusion: internal robustness ≠ system security

The right formula is not "only fine-tuning secures" but:

> Fine-tuning **raises the internal robustness** of the model. **Security** — in the sense of a guarantee — comes from the **external deterministic layer**, which validates input and output outside the model's authority. Both are necessary; neither is sufficient alone. This is the very definition of defense in depth.

Everything that lives **inside** the prompt, or **inside** the weights, is robustness: a continuous quantity, measured by a bypass rate under attack. Everything that gives a **guarantee** lives **around** the model: a deterministic, enforceable filter the model cannot disable. Conflating the two means crediting as a "defense" what is only a better-trained *prior*.

## 7. Consequence for dataset labeling

This distinction is not merely theoretical: it imposes an annotation discipline. Two variables, often conflated, must remain **separate** in the dataset schema.

| Variable | Nature | What it measures |
|---|---|---|
| **Internal robustness** | Continuous (rate) | Probability of bypass under attack — this is what position and fine-tuning move |
| **System security** | Binary (present/absent) | Is there an external, deterministic, enforceable validator? — this is what gives the guarantee |

Two experimental variables must also be tracked independently:

- **Where** the safety rule is placed (system / head / tail) → position variable.
- **Who** actually decides (the model alone, or an external validator) → architecture variable.

Practical rule: an item that rests solely on "the rule is first, therefore respected," or on "the model was trained to refuse," must be labeled **unvalidated by construction** — even if the model obeys in 99% of cases. Observed obedience is a measure of robustness, **not** a proof of security. Otherwise the very work on training backdoors would become the counterexample that invalidates the label.

To make this gap measurable, it helps to isolate two kinds of flaw in distinct items:

- **Role inversion** — a user input or tool output claiming to reconfigure the system rule: this tests the *learned* role hierarchy.
- **Sequential override** — a late, seemingly benign rule that cancels a constraint set earlier: this tests *recency bias*.

The performance gap between these two families gives the measure of the difference between "trained role hierarchy" and "plain order in the context" — that is, precisely the distance between robustness and the illusion of validation.

## 8. Takeaways

Position in the prompt is, at best, a *weak prior*. Fine-tuning is a *strong prior*. Neither is an access control, because both live inside the thing they claim to constrain. The only defense creditable as a **guarantee** is deterministic and external to the model, on input and output. Everything else is measured, not guaranteed — and a rigorous dataset must reflect that boundary in its labels.

## Mappings and references

- OWASP LLM Top 10 (2025): *LLM01 Prompt Injection*; *LLM06 Excessive Agency*.
- MITRE ATLAS: AML.T0051 *LLM Prompt Injection*; AML.T0054 *LLM Jailbreak*.
- Liu et al. — *Lost in the Middle: How Language Models Use Long Contexts* (2023): [arXiv:2307.03172](https://arxiv.org/abs/2307.03172)
- Wallace et al. — *The Instruction Hierarchy: Training LLMs to Prioritize Privileged Instructions* (2024): [arXiv:2404.13208](https://arxiv.org/abs/2404.13208)
- Qi et al. — *Fine-tuning Aligned Language Models Compromises Safety, Even When Users Do Not Intend To* (2023): [arXiv:2310.03693](https://arxiv.org/abs/2310.03693)
- Hubinger et al. — *Sleeper Agents: Training Deceptive LLMs that Persist Through Safety Training* (2024): [arXiv:2401.05566](https://arxiv.org/abs/2401.05566)
- Zou et al. — *Universal and Transferable Adversarial Attacks on Aligned Language Models* (2023): [arXiv:2307.15043](https://arxiv.org/abs/2307.15043)
