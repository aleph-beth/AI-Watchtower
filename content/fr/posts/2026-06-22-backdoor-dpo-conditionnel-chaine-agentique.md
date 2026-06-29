---
title: "Backdoor DPO conditionnel : du contexte rare à la chaîne agentique"
date: 2026-06-21
lastmod: 2026-06-21
draft: false
tags: ["data-poisoning", "backdoor", "dpo", "rlhf", "agent", "securite-llm"]
categories: ["Analyse"]
theme: "poisoning"
summary: "Un compagnon plus technique de l'article sur le feedback du tier gratuit. DPO déplace la sûreté du niveau « comportement » au niveau « distribution conditionnelle » ; un agent transforme ensuite un conditionnel piégé en chaîne d'actions. Résultat : une backdoor faite de comportements individuellement ordinaires, invisible aux évaluations standard, dont le danger n'émerge qu'à la composition des actions."
ShowToc: true
TocOpen: false
translationKey: "conditional-dpo-backdoor"
---

> **Note de cadrage.** Analyse de modèle de menace à finalité défensive. Elle explique *pourquoi* une backdoor implantée par préférences peut être invisible à l'évaluation de sécurité standard et *quels* contrôles s'imposent. Aucune procédure opérationnelle d'attaque.

Ceci est un compagnon plus technique de [l'article sur le feedback du tier gratuit]({{< relref "2026-06-21-tier-gratuit-maillon-faible-empoisonnement.md" >}}). Cet article montrait comment la boucle de feedback du tier gratuit est un canal inscriptible vers les poids, et comment un comportement bénin appris sur un sujet rare peut être transféré en jailbreak. Ici, on regarde *pourquoi la méthode d'entraînement rend la chose si difficile à voir*, et la forme que prend le gain quand le modèle est un **agent**.

**Thèse.** L'optimisation directe des préférences (DPO) déplace la sûreté du niveau du *comportement* au niveau d'une *distribution conditionnelle*. Un agent transforme ensuite un conditionnel piégé en chaîne d'actions. Conséquence : une backdoor peut être implantée par un **contexte rare** associé à des comportements individuellement ordinaires, invisible aux évaluations standard, et **dont le danger n'émerge qu'à la composition des actions**.

## 1. Ce que le modèle « ne sait pas »

Un modèle n'a aucun *a priori* de sûreté attaché à un contexte. La sûreté n'est pas une propriété du monde que le modèle détiendrait — c'est un **comportement appris, conditionnel à la distribution vue à l'entraînement**. L'alignement n'apprend pas « refuser le danger ». Il apprend, en gros :

```
P(refus | contextes fréquents vus à l'entraînement)  ≈ élevé
```

Un contexte rare n'est pas perçu comme suspect. Pour le modèle, c'est simplement *un autre conditionnement* — il n'existe aucune hiérarchie intrinsèque plaçant un contexte ordinaire au-dessus d'un contexte piégé. Tout, en ce sens, se vaut.

Une backdoor DPO installe donc une **poche conditionnelle** :

```
P(comportement dangereux | contexte rare)     ≈ élevé
P(comportement dangereux | contextes normaux) ≈ inchangé
```

Le modèle se comporte parfaitement partout — sauf à l'appel du déclencheur.

## 2. Pourquoi DPO aggrave spécifiquement le risque

DPO ([Rafailov et al., 2023](https://arxiv.org/abs/2305.18290)) entraîne une politique directement sur des paires de préférences (préférer la réponse A à la réponse B pour ce prompt), avec un terme qui la maintient proche d'un modèle de référence, pondéré par un coefficient **β**. Trois propriétés de cette recette aident chacune l'attaquant.

1. **Pas de modèle de récompense où diluer la corruption.** En RLHF classique, une préférence empoisonnée est d'abord absorbée dans un *modèle de récompense* qui généralise : une paire aberrante est en partie moyennée par un juge. En DPO, pas de juge : la paire empoisonnée agit **directement sur les poids, conditionnellement au contexte**. Aucun intermédiaire ne peut la repérer.
2. **Contrastif et localisé.** DPO pousse explicitement A *contre* B pour *ce* prompt. Cela permet de graver un comportement ciblé sur le contexte rare avec **peu de paires et quasi aucun dommage collatéral ailleurs** — la propriété qu'exploitent les travaux d'empoisonnement de récompense comme [RLHFPoison / RankPoison](https://arxiv.org/abs/2311.09641) : manipuler la cible sans dégrader l'alignement sur les prompts non ciblés.
3. **β protège la dérive globale, pas la poche locale.** La contrainte « rester proche du modèle de référence » limite le mouvement *moyen*. Elle ne voit pas une petite poche conditionnelle bien cachée — la moyenne bouge à peine pendant qu'une région étroite est réécrite.

## 3. Pourquoi les évaluations ne le voient pas

Une suite de régression de sécurité teste la distribution *typique*. Le déclencheur est, par construction, **hors** de cette distribution — c'est tout l'intérêt de choisir un contexte rare. La backdoor passe donc tous les tests standard : pour la révéler, il faudrait *deviner le contexte d'appel*. C'est la même cécité que pour les triggers de backdoor en général, aggravée ici par le caractère conditionnel de l'empoisonnement : on ne cherche pas une mauvaise sortie sur un prompt normal, on cherche un comportement d'apparence normale qui ne bascule que sous un contexte qu'il faut connaître à l'avance.

## 4. Le danger central : la chaîne d'actions

Dans l'article racine, le gain était une sortie refusée produite au transfert. Avec un **agent**, le gain est pire, car l'unité de nuisance n'est plus une réponse unique.

Chaque comportement associé au contexte rare peut sembler parfaitement ordinaire et légitime pris isolément — *lire un fichier*, *appeler un outil*, *formater une sortie*. Le danger n'est dans aucune étape. Il est dans la **composition** : appeler le contexte rare enchaîne ces actions banales, chacune permise, en une séquence dangereuse.

<div class="cdba">
<div class="cdba-flow">
<span class="cdba-box cdba-key">Contexte rare<br><small>le déclencheur</small></span>
<span class="cdba-arr">→</span>
<span class="cdba-box">Lire un fichier<br><small>autorisé</small></span>
<span class="cdba-arr">→</span>
<span class="cdba-box">Appeler un outil<br><small>autorisé</small></span>
<span class="cdba-arr">→</span>
<span class="cdba-box">Formater &amp; envoyer<br><small>autorisé</small></span>
<span class="cdba-arr">→</span>
<span class="cdba-box cdba-key">Effet nuisible<br><small>issu de la composition</small></span>
</div>
<p class="cdba-cap">Une backdoor DPO plus un agent ne produit pas une <em>sortie</em> nuisible — elle produit un <em>plan d'actions individuellement autorisées</em>. L'agent n'a jamais besoin d'une action interdite ; une suite d'actions permises suffit.</p>
</div>
<style>
.cdba{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:14px 16px 12px;margin:22px 0;font-size:15px}
.cdba-flow{display:flex;align-items:stretch;gap:8px;flex-wrap:wrap}
.cdba-box{flex:1 1 120px;min-width:110px;border:1px solid rgba(128,128,128,.4);border-radius:8px;padding:10px 12px;background:rgba(128,128,128,.08);line-height:1.3}
.cdba-box small{opacity:.72;font-size:12px}
.cdba-key{border-color:#b4783c;background:rgba(180,120,60,.12)}
.cdba-arr{align-self:center;opacity:.5;font-size:18px}
.cdba-cap{font-size:13px;opacity:.8;margin:12px 2px 2px;line-height:1.45}
@media(max-width:560px){.cdba-flow{flex-direction:column}.cdba-arr{transform:rotate(90deg)}}
</style>

C'est fondamentalement un problème de **séquence / orchestration**, pas de prompt unique. Un agent backdooré n'a pas besoin d'une capacité interdite ; une suite d'étapes chacune permise suffit. (MITRE ATLAS [AML.T0053 *AI Agent Tool Invocation*](https://atlas.mitre.org/) ; OWASP *LLM06 Excessive Agency*.)

## 5. Protection

- **Une couche déterministe en aval.** Elle ne raisonne pas sur des conditionnels appris ; le « contexte rare » ne lui dit rien. Elle applique les mêmes règles quel que soit l'état appris du modèle — ce qui en fait la seule défense robuste à une backdoor invisible aux évals. Un conditionnel piégé ne peut pas plier une barrière qui n'a jamais rien appris.
- **Autorisation par étape sur la séquence.** Valider la *composition* d'actions, pas seulement chaque action isolée : moindre privilège plus human-in-the-loop sur les enchaînements sensibles. La question n'est pas « cet appel est-il permis ? » mais « cette *séquence* d'appels permis est-elle acceptable ? ».
- **Red-teaming de l'espace des déclencheurs, pas de la distribution typique.** Balayer délibérément rôles, formats et contextes rares — c'est le seul moyen de provoquer le déclenchement de la poche conditionnelle pendant les tests.
- **Hygiène des préférences (amont).** Quarantaine, déduplication, plusieurs annotateurs, et détection d'anomalies sur les paires de préférences elles-mêmes, avant qu'elles n'atteignent une étape DPO.

## 6. Implication pour les datasets et l'évaluation

L'enseignement pratique, pour qui construit des datasets de sécurité ou des suites de test : les scénarios de ce type doivent être étiquetés au **niveau de la séquence**, pas du prompt unique. L'annotation utile ressemble à :

```
{ trigger: contexte_rare, methode: DPO | RLHF,
  actions_unitaires: benignes, danger: composition, couche: sequence }
```

C'est un cas où le label porte sur la *séquence*, pas sur une paire `{prompt, label}` isolée — le moment où « tester un prompt » doit devenir « tester une trajectoire ».

## Mappings et références

- MITRE ATLAS : AML.T0018 *Backdoor ML Model* ; AML.T0020 *Poison Training Data* ; AML.T0031 *Erode AI Model Integrity* ; AML.T0053 *AI Agent Tool Invocation*.
- OWASP LLM Top 10 (2025) : *LLM04 Data and Model Poisoning* ; *LLM06 Excessive Agency*.
- Rafailov et al. — *Direct Preference Optimization* (2023) : [arXiv:2305.18290](https://arxiv.org/abs/2305.18290)
- Wang et al. — *RLHFPoison / RankPoison: Reward Poisoning Attack for RLHF in LLMs* (2023) : [arXiv:2311.09641](https://arxiv.org/abs/2311.09641)
- *The Dark Side of Human Feedback: Poisoning LLMs via User Inputs* (2024) : [arXiv:2409.00787](https://arxiv.org/abs/2409.00787)
