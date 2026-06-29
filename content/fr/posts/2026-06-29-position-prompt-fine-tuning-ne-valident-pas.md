---
title: "L'instruction qui ne protège rien : pourquoi la position dans le prompt et le fine-tuning ne valident jamais un LLM"
date: 2026-06-29
lastmod: 2026-06-29
draft: false
tags: ["prompt-injection", "instruction-hierarchy", "fine-tuning", "validation", "defense-en-profondeur", "securite-llm"]
categories: ["Fondamentaux"]
theme: "fundamentals"
summary: "Une intuition tenace veut qu'il suffise de placer les consignes de sécurité « en premier » dans le system prompt. Elle est fausse, et pour une raison qui se retourne contre elle : un transformeur n'accorde aucune autorité à la position d'un token. Le fine-tuning échoue exactement au même test. Ni l'un ni l'autre n'est un contrôle d'accès — tous deux vivent à l'intérieur de la chose qu'ils prétendent contraindre. La seule garantie est déterministe et externe, et un dataset rigoureux doit refléter cette frontière dans ses labels."
ShowToc: true
TocOpen: false
translationKey: "position-finetuning-not-validation"
---

> **Note de cadrage.** Analyse défensive. Elle démonte une intuition de sécurité très répandue — « il suffit de mettre les bonnes consignes en premier dans le system prompt » — et montre pourquoi ni la position d'une instruction ni le fine-tuning ne constituent un mécanisme de *validation*. Le propos n'est pas de fournir des techniques de contournement, mais de clarifier où se situe réellement la frontière de sécurité d'un système à base de LLM, et comment cette distinction doit se refléter dans l'étiquetage d'un dataset d'évaluation. Elle s'inscrit dans une doctrine d'audit boîte grise.

**Thèse.** Une intuition tenace veut que, pour protéger un *system prompt*, il suffise de poser les consignes de sécurité **en premier**, ces premières instructions étant réputées « inviolables ». Cette intuition est fausse, et elle l'est pour une raison qui se retourne contre elle : un transformeur n'accorde **aucune autorité particulière à la position d'un token**. L'effet réellement observé est même inverse — biais de récence et *lost in the middle* font que le modèle pondère souvent plus fortement les instructions **récentes** que les premières. C'est précisément le mécanisme de l'injection de prompt. Ce qui crée une hiérarchie, ce n'est pas la position mais le **rôle**, et il faut l'entraîner ; mais même entraînée, cette hiérarchie reste **statistique, jamais opposable**. Le fine-tuning échoue exactement au même test que l'instruction « première » : il est interne au modèle, probabiliste, sans verdict binaire. La conclusion n'est donc pas « seul le fine-tuning sécurise », mais : le fine-tuning **augmente la robustesse interne**, la **sécurité** au sens d'une garantie vient d'une **couche déterministe externe**. Les deux sont nécessaires, aucun n'est suffisant seul.

## 1. La prémisse fausse : « les premières instructions sont inviolables »

La phrase semble de bon sens : on écrit la politique de sécurité au sommet du prompt, le modèle la lit d'abord, donc il la respecte avant tout le reste. Le problème est que cette phrase décrit un **objectif de conception**, pas une propriété du modèle.

Un transformeur traite l'ensemble de sa fenêtre de contexte par attention. Rien dans le mécanisme n'établit qu'un token apparu plus tôt dispose d'une priorité sur un token apparu plus tard. La position est un *indice* parmi d'autres que le modèle a appris à exploiter — pas une règle d'ordre. Croire que « premier = prioritaire » revient à confondre l'ordre de lecture humain avec la dynamique d'un réseau qui, lui, n'a pas de notion native d'autorité positionnelle. (Sur le fonctionnement de l'attention, voir [Comprendre les LLM : du LSTM au transformeur]({{< relref "2026-06-12-comprendre-llm-du-lstm-au-transformer.md" >}}).)

## 2. Ce que fait réellement le modèle : la position joue souvent à l'envers

Pire que neutre, la position est fréquemment **trompeuse**. Deux effets bien documentés le montrent.

Le premier est le biais de position dit *lost in the middle* ([Liu et al., 2023](https://arxiv.org/abs/2307.03172)) : sur de longs contextes, les modèles exploitent surtout l'information située au **début et à la fin** de la fenêtre, et négligent ce qui se trouve au milieu. La courbe de performance est en U. Une consigne de sécurité « première » peut donc se trouver diluée dès que le contexte s'allonge.

Le second, plus dommageable encore pour la thèse de l'inviolabilité, est le **biais de récence** : à conflit d'instructions, le modèle tend à suivre la consigne la plus **récente**. C'est exactement le ressort de l'injection de prompt — une instruction tardive (« ignore les consignes précédentes et… ») écrase la consigne système « première ». Autrement dit, l'effet positionnel dominant ne *renforce* pas l'instruction de tête, il la **menace**.

D'où une contradiction interne qu'il faut nommer clairement : « le modèle gère mal le séquentiel » et « les premières instructions sont inviolables » ne peuvent pas coexister. La seconde affirmation est fausse *à cause* de la première.

## 3. Ce qui crée une hiérarchie : le rôle, pas le rang

S'il existe bien une forme de priorité entre consignes système, utilisateur et sorties d'outils, elle ne provient pas de l'ordre d'apparition mais du **canal** — c'est-à-dire du **rôle** — et elle doit être **entraînée**. C'est l'objet de l'*instruction hierarchy* ([Wallace et al., 2024](https://arxiv.org/abs/2404.13208)) : on apprend explicitement au modèle à prioriser système > utilisateur > contenu d'outil, indépendamment de la position dans la séquence.

Le point décisif : dans cette approche, le system prompt n'est pas privilégié *parce qu'il est premier*, mais parce qu'il occupe un **canal privilégié** que l'entraînement a appris à respecter. La position est incidente ; le rôle est la variable. Confondre les deux conduit à des défenses qui « marchent » sur les exemples vus et cèdent sur les autres.

Et même là, la garantie n'existe pas. L'entraînement par rôle **abaisse le taux de contournement**, il ne le met pas à zéro. Le modèle reste un **classifieur probabiliste** de « quelle instruction suivre » — jamais un point de contrôle d'accès.

## 4. Le test de la validation : trois propriétés

Pour trancher proprement, posons ce qu'exige une véritable **validation**, par opposition à une simple *tendance à obéir*. Une validation possède trois propriétés :

1. **Externe** au modèle — le modèle ne peut pas la désactiver, parce que ce qui vérifie n'est pas ce qui est vérifié.
2. **Déterministe** — même entrée, même verdict ; pas une probabilité.
3. **Verdict opposable** — un *pass/fail* binaire, pas une inclinaison statistique.

Une instruction *dans* le prompt, quelle que soit sa position, échoue aux trois. Elle est traitée par le modèle même qu'elle prétend contraindre : le modèle est à la fois juge et accusé. Ce n'est pas de la validation, c'est une requête à laquelle on espère que le modèle se conformera.

## 5. Le fine-tuning échoue au même test

L'objection naturelle est alors : « puisque l'instruction locale ne suffit pas, la sécurité doit passer par des consignes **globales** gravées par fine-tuning ». C'est refaire l'erreur de catégorie un cran plus loin.

Reprenons les trois propriétés de la section 4 et appliquons-les au fine-tuning :

- il n'est **pas externe** — il *est* le modèle ; impossible de séparer le contrôle de l'objet contrôlé ;
- il n'est **pas déterministe** — il déplace une probabilité d'obéissance, il ne pose pas de frontière dure ;
- il ne rend **pas de verdict opposable** — seulement une tendance plus forte.

Le fine-tuning n'est donc pas d'une autre **nature** que l'instruction « première » : c'est le **même mécanisme à magnitude supérieure**, un *prior* plus robuste, pas un contrôle d'accès. C'est bien le levier interne le plus puissant — mais « plus fort » n'est pas « sécurisé ».

Trois familles de résultats le confirment empiriquement :

- **On peut retirer la sûreté par fine-tuning.** Quelques centaines d'exemples suffisent à stripper l'alignement d'un modèle pourtant « sécurisé » ([Qi et al., 2023, *Fine-tuning Aligned Language Models Compromises Safety*](https://arxiv.org/abs/2310.03693)). La consigne globale n'est pas un verrou : c'est un état appris, donc un état réapprenable.
- **On peut injecter un backdoor pendant l'entraînement.** La consigne globale obéit en surface et se contourne sur déclencheur ; le comportement malveillant survit au fine-tuning de remédiation ([Hubinger et al., 2024, *Sleeper Agents*](https://arxiv.org/abs/2401.05566)). Une sûreté « gravée » peut donc dissimuler son propre contournement. (Voir aussi notre analyse du [backdoor DPO conditionnel]({{< relref "2026-06-22-backdoor-dpo-conditionnel-chaine-agentique.md" >}}).)
- **Les attaques adverses passent malgré le safety-tuning.** Des suffixes optimisés ([Zou et al., 2023, *Universal and Transferable Adversarial Attacks*, GCG](https://arxiv.org/abs/2307.15043)) contournent l'alignement d'un modèle entraîné à refuser.

Aucun volume de fine-tuning ne transforme un classifieur probabiliste en point de contrôle déterministe.

## 6. La conclusion correcte : robustesse interne ≠ sécurité système

La formule juste n'est pas « seul le fine-tuning sécurise » mais :

> Le fine-tuning **augmente la robustesse interne** du modèle. La **sécurité** — au sens d'une garantie — vient de la **couche déterministe externe**, qui valide l'entrée et la sortie hors de l'autorité du modèle. Les deux sont nécessaires ; aucun n'est suffisant seul. C'est la définition même de la défense en profondeur.

Tout ce qui vit **dans** le prompt, ou **dans** les poids, relève de la robustesse : une grandeur continue, qu'on mesure par un taux de contournement sous attaque. Tout ce qui donne une **garantie** vit **autour** du modèle : un filtre déterministe, opposable, que le modèle ne peut pas désactiver. Confondre les deux, c'est créditer comme « défense » ce qui n'est qu'un *prior* mieux entraîné.

## 7. Conséquence pour l'étiquetage du dataset

Cette distinction n'est pas que théorique : elle impose une discipline d'annotation. Deux variables, souvent confondues, doivent rester **séparées** dans le schéma du dataset.

| Variable | Nature | Ce qu'elle mesure |
|---|---|---|
| **Robustesse interne** | Continue (taux) | Probabilité de contournement sous attaque — c'est ce que la position et le fine-tuning font bouger |
| **Sécurité système** | Binaire (présence/absence) | Existe-t-il un validateur externe, déterministe, opposable ? — c'est ce qui donne la garantie |

Deux variables expérimentales doivent par ailleurs être tracées indépendamment :

- **Où** est posée la consigne de sécurité (système / en tête / en queue) → variable de position.
- **Qui** tranche réellement (le modèle seul, ou un validateur externe) → variable d'architecture.

Règle pratique : un item qui repose uniquement sur « la consigne est première, donc respectée », ou sur « le modèle a été entraîné à refuser », doit être étiqueté **non-validé par construction** — même si le modèle obéit dans 99 % des cas. L'obéissance observée est une mesure de robustesse, **pas** une preuve de sécurité. Faute de quoi le travail même sur les backdoors d'entraînement deviendrait le contre-exemple qui invalide le label.

Pour rendre cet écart mesurable, il est utile d'isoler deux types de failles dans des items distincts :

- **Inversion de rôle** — une entrée utilisateur ou une sortie d'outil qui prétend reconfigurer la consigne système : on teste la hiérarchie de rôle *apprise*.
- **Override séquentiel** — une consigne tardive, bénigne en apparence, qui annule une contrainte posée plus tôt : on teste le *biais de récence*.

L'écart de performance entre ces deux familles donne la mesure de la différence entre « hiérarchie de rôle entraînée » et « simple ordre dans le contexte » — soit, précisément, la distance entre robustesse et illusion de validation.

## 8. À retenir

La position dans le prompt n'est, au mieux, qu'un *prior faible*. Le fine-tuning est un *prior fort*. Ni l'un ni l'autre n'est un contrôle d'accès, parce que tous deux vivent à l'intérieur de la chose qu'ils prétendent contraindre. La seule défense créditable comme **garantie** est déterministe et externe au modèle, sur l'entrée et la sortie. Tout le reste se mesure, ne se garantit pas — et un dataset rigoureux doit refléter cette frontière dans ses labels.

## Mappings et références

- OWASP LLM Top 10 (2025) : *LLM01 Prompt Injection* ; *LLM06 Excessive Agency*.
- MITRE ATLAS : AML.T0051 *LLM Prompt Injection* ; AML.T0054 *LLM Jailbreak*.
- Liu et al. — *Lost in the Middle: How Language Models Use Long Contexts* (2023) : [arXiv:2307.03172](https://arxiv.org/abs/2307.03172)
- Wallace et al. — *The Instruction Hierarchy: Training LLMs to Prioritize Privileged Instructions* (2024) : [arXiv:2404.13208](https://arxiv.org/abs/2404.13208)
- Qi et al. — *Fine-tuning Aligned Language Models Compromises Safety, Even When Users Do Not Intend To* (2023) : [arXiv:2310.03693](https://arxiv.org/abs/2310.03693)
- Hubinger et al. — *Sleeper Agents: Training Deceptive LLMs that Persist Through Safety Training* (2024) : [arXiv:2401.05566](https://arxiv.org/abs/2401.05566)
- Zou et al. — *Universal and Transferable Adversarial Attacks on Aligned Language Models* (2023) : [arXiv:2307.15043](https://arxiv.org/abs/2307.15043)
