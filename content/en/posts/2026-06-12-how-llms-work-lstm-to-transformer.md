---
title: "How LLMs Work: From the LSTM to the Transformer"
date: 2026-06-12
lastmod: 2026-06-12
draft: false
tags: ["llm", "transformer", "lstm", "cnn", "attention", "fundamentals"]
categories: ["Fundamentals"]
theme: "fundamentals"
summary: "Three interactive diagrams to see, step by step, how a sentence flows through a recurrent network (LSTM), a convolutional network (CNN), and finally a Transformer — the architecture every modern LLM is built on. Plus why the mechanics matter for security."
ShowToc: true
TocOpen: false
translationKey: "lstm-to-transformer"
---

> You cannot reason about the security of a system you treat as a black box. Prompt injection, context poisoning, and jailbreaks are not magic — they exploit *how the model mixes information*. This article opens the box. Three interactive diagrams let you step a sentence through a recurrent network (**LSTM**), a convolutional network (**CNN**), and finally a **Transformer**, the architecture that powers every modern large language model.

## The problem: modeling a sequence

A language model does one deceptively simple thing: given a sequence of words, it predicts the next one. "The cat sleeps because it is …" → `tired`.

The difficulty is **context**. To resolve "it", the model must look back at "cat". To pick "tired", it must connect "sleeps" and "because". A model of language is, before anything else, a machine for **carrying information across a sequence**. The whole history of the field is a history of *how* that information is carried.

Three answers dominated, across two decades:

1. **The LSTM (1997, popularized ~2014):** carry a memory that flows step by step.
2. **The CNN, applied to text (~2014):** slide a small window over the sequence, in parallel.
3. **The Transformer (2017):** let every word look directly at every other, all at once.

## The LSTM: a memory that flows

A recurrent network reads the sentence **one word at a time**. At each step it keeps two things from the previous step: a **cell state** `C` (long-term memory) and a **hidden state** `h` (the working output). The genius of the LSTM (Hochreiter & Schmidhuber, 1997) is a set of **gates** — small learned valves that decide, at each step, what to *forget*, what to *write*, and what to *expose*.

Step through it below. Advance with the buttons, click a word to move the time step, or click a block to jump to it.

{{< widget src="/widgets/lstm-en.html" title="Interactive LSTM diagram" >}}

Three gates do the work:

- **Forget gate** `f = σ(W_f·z + b_f)` — a value near 0 erases a memory dimension, near 1 keeps it.
- **Input gate** `i` and **candidate** `C̃` — together they decide *what* new content gets written, and *how much*.
- **Output gate** `o` — decides how much of the memory is revealed as this step's output `h`.

The cell update — `C_t = f·C_{t-1} + i·C̃` — is the key trick. Because the old memory is **added** (not repeatedly multiplied through a non-linearity), a piece of information can ride the "conveyor belt" across many steps without vanishing. That is what let LSTMs learn longer-range dependencies than the plain RNNs before them.

### Where the LSTM hits a wall

Two structural limits, both visible in the diagram:

1. **It is strictly sequential.** Step `t` needs the output of step `t-1`. You cannot compute the whole sentence in parallel, which makes training on huge corpora slow and hard to scale.
2. **Distant words are far apart in the computation.** To connect word 1 and word 50, information must survive 49 gated updates. Even with the conveyor belt, the signal **dilutes**. Long-range links stay fragile.

Both limits have the same root: the only path between two words is *through the chain*. Two different architectures attack that root. The first one keeps things simple — drop the chain, slide a window.

## The CNN: a window that slides

Before attention took over, another family briefly led the way: the **convolutional network**, borrowed from image processing and applied to text as a **1D convolution**. Instead of a memory that walks the sentence, a CNN slides a small **filter** — a window of, say, 3 tokens — across the whole sequence at once, computing the same weighted sum at every position.

Step through it below. Click a word to move the window and watch the filter turn a local neighbourhood into a single feature value.

{{< widget src="/widgets/cnn-en.html" title="Interactive 1D CNN diagram" >}}

The mechanism is deliberately simple:

- A **filter** is a small grid of learned weights spanning `k` adjacent tokens. Sliding it over the sentence — the **convolution** — produces a **feature map**, the filter's response at every position: `y_i = Σ K · x_(i-1:i+1) + b`.
- A **ReLU** keeps only the positive responses: the filter "fires" where its local pattern is present.
- A layer runs **many filters in parallel**, each tuned to a different local motif.

This buys exactly what the LSTM lacked: **full parallelism**. Every position is computed at the same time — no chain, fast to train. That made CNNs serious contenders for text around 2014–2017, and the backbone of fast generative models like WaveNet and ByteNet.

But it trades one limit for another. A single layer only sees `k` tokens. To connect two distant words you must **stack layers** until the **receptive field** is wide enough — reach is bought with depth. The CNN is parallel but *local*; the LSTM is global but *sequential*. The Transformer's move was to refuse that trade-off and take both.

## The Transformer: every word looks at every other

The 2017 paper "Attention Is All You Need" (Vaswani et al.) replaced both recurrence and convolution with **self-attention**. Instead of passing memory step by step, or sliding a fixed window, each word is allowed to look **directly** at every other word in the sentence — in a single, fully parallel operation. Parallel like a CNN, but with no window: the reach is the whole sentence at once.

Step a word through the stack below. Pick "it" (the default) and watch, at steps 5–6, how it locks onto "cat".

{{< widget src="/widgets/transformer-en.html" title="Interactive Transformer diagram" >}}

The mechanism, in four moves:

1. **Embedding + positional encoding.** Each token becomes a learned vector; a sinusoidal signal is added so the model knows word *order* (attention itself is order-blind).
2. **Q, K, V projections.** Each word is projected into three roles — a **Query** ("what am I looking for?"), a **Key** ("what do I offer?"), and a **Value** ("what do I carry?").
3. **Scores → softmax → weights.** Every Query is matched against every Key by a dot product, scaled and normalized: `weights = softmax(Q·Kᵀ / √dₖ)`. These weights say *how much each word attends to each other word*. This is where "it" decides "cat" is what matters.
4. **Weighted sum of Values.** The output for each word is a blend of all the Values, weighted by attention. Add a residual connection, normalize, run a small feed-forward network, and you have **one Transformer block**.

Two consequences fall straight out of this design:

- **The path between any two words is length 1.** "it" reads "cat" directly, no 49-step chain. Long-range dependencies stop being fragile.
- **It is fully parallel.** Every word's attention is computed at once — which is exactly what makes training on internet-scale data feasible. Parallelism, not just cleverness, is what unlocked scale.

## From a Transformer block to an LLM

A single block is not a language model. An LLM is what you get when you:

1. **Stack the block dozens of times.** GPT-class models stack many layers; each one lets a word's representation absorb a richer slice of context. Early layers catch syntax, deeper layers carry meaning and reference.
2. **Project to the vocabulary.** A final linear layer + softmax turns the top word's vector into a probability distribution over *every possible next token*: `P(word) = softmax(z·Wᵥ)`.
3. **Scale everything** — billions of parameters, trillions of training tokens — and train on one objective: *predict the next token*. Generation is then just doing that repeatedly, feeding each predicted token back in.

That is the whole engine. A modern LLM is a very deep stack of attention-and-feed-forward blocks, trained at enormous scale to predict the next token. Everything you experience as "understanding" is this machinery resolving context across the sequence.

## Why the mechanics matter for security

The architecture is not a detail — it *is* the attack surface:

- **Attention has no notion of trust.** At step 5 of the Transformer diagram, every token competes for weight on equal footing. The model has no built-in boundary between *your instruction* and *text it read from a tool, a web page, or an email*. That equality is precisely what **indirect prompt injection** exploits: hostile text in the context window attends its way into the model's behavior just like legitimate instructions do.
- **Context is the whole memory.** Unlike the LSTM's gated cell, a Transformer has no persistent state between calls — everything it "knows" in the moment lives in the context window. Whatever lands there shapes the output. Controlling *what enters the context* is therefore a primary security control, which is exactly the logic behind attack-surface reduction for assistants.
- **Next-token prediction is steerable.** Because the output is a probability distribution conditioned on the full context, carefully crafted preceding tokens can shift that distribution — the formal shape of a jailbreak.

Understanding LSTMs and Transformers is not academic. It is the difference between treating model failures as inexplicable and recognizing them as **predictable consequences of how information flows through the network**.

---

*Related articles: a deeper look at indirect prompt injection through the attention lens, and threat models for tool-using agents — coming soon.*
