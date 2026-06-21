---
title: "La guerre des IA sur nos réseaux : pourquoi l'attaque devance la défense"
date: 2026-06-12
lastmod: 2026-06-12
draft: false
tags: ["securite-llm", "guerre-ia", "red-team", "blue-team", "lock-monotone", "jailbreak", "prompt-injection"]
categories: ["Stratégie"]
theme: "fundamentals"
summary: "Essai stratégique. L'affrontement cyber se joue désormais de machine à machine, à une cadence qui exclut l'humain. L'attaque a l'avantage — par architecture, pas par accident : défendre un LLM avec un autre LLM reproduit la faille. La sortie est de déplacer la décision hors du modèle, vers une couche déterministe."
ShowToc: true
TocOpen: false
translationKey: "ai-war-attack-outpaces-defense"
---

*Essai stratégique — pourquoi l'attaque devance la défense, et comment reprendre l'avantage.*

> **Thèse.** Nous entrons dans une phase où l'affrontement cyber se joue de machine à machine, à une cadence qui exclut l'opérateur humain. Dans cet affrontement, l'attaque a aujourd'hui l'avantage — non par accident conjoncturel, mais pour une raison d'architecture : la défense automatisée s'appuie sur des agents qui héritent de la faille même qu'ils prétendent combler. Tant que l'on défendra un LLM avec un autre LLM, on reproduira la vulnérabilité côté défenseur. La sortie n'est pas « plus d'IA défensive », mais le déplacement de la décision hors du modèle, vers une couche déterministe et mesurable.

---

## 1. La bascule : du temps humain au temps machine

Pendant trente ans, la cyberdéfense a été calibrée sur une hypothèse implicite : les attaques se déroulent à une vitesse qui laisse à un analyste le temps de voir, de qualifier et de décider. Le centre de supervision (SOC) reçoit une alerte, un humain l'examine, une équipe escalade, un responsable arbitre avant d'autoriser le confinement. Ce cycle prend des heures, parfois des jours. Il a été conçu pour des menaces qui se déploient lentement.

Cette hypothèse vient de tomber. Les premières campagnes pilotées par IA agentique compriment en minutes ce qui demandait auparavant des jours de travail à des spécialistes. La reconnaissance, la génération de code d'exploitation, le déplacement latéral, la collecte d'identifiants s'enchaînent désormais à une vitesse qui dépasse toute réponse défensive humaine. Quand l'attaquant agit plus vite que le défenseur, c'est l'attaquant qui contrôle le tempo du combat — et donc le combat.

La conséquence est structurelle : à terme, ni la Red Team offensive ni la Blue Team défensive ne pourront intervenir *dans la boucle*. L'humain restera en amont (cadrage, doctrine, autorisation) et en aval (revue, attribution, remédiation lourde), mais le cœur de l'engagement se jouera entre agents autonomes. C'est ce que plusieurs analystes désignent désormais comme le « champ de bataille IA contre IA », un terrain où *aucun humain n'est dans la boucle*.

## 2. L'état des forces, fin 2025

Ce basculement n'est plus prospectif. Plusieurs faits documentés en 2025 en marquent le seuil.

En **novembre 2025**, Anthropic a divulgué ce qu'elle qualifie de première opération d'espionnage cyber à grande échelle largement orchestrée par une IA agentique. Un acteur évalué avec une confiance élevée comme un groupe étatique chinois (désigné GTG-1002) a détourné l'outil Claude Code en le « jailbreakant » par jeu de rôle — en lui faisant croire qu'il était employé par une firme de cybersécurité légitime menant un test défensif — puis l'a connecté à des outils réels via le protocole MCP. L'IA a exécuté **80 à 90 % du déroulé de l'attaque** contre une trentaine de cibles (grandes entreprises technologiques, institutions financières, industrie chimique, agences gouvernementales), avec un petit nombre d'intrusions réussies. Fait notable : la principale limite de l'opération n'a pas été une défense, mais les *hallucinations* du modèle, qui ont gêné l'attaquant — signe que l'autonomie totale n'est pas encore acquise, mais qu'elle s'en approche.

Ce cas n'est pas isolé. Sur le versant outillage, la diffusion en juillet 2025 de VILLAGER — un outil de pentest « AI-native » bâti sur DeepSeek v3 et embarquant plus de 4 000 prompts d'exploitation — a montré l'industrialisation de l'offensive. À l'été 2025, l'acteur HexStrike a exploité une vulnérabilité critique (CVE-2025-7775) sur plus de 8 000 points d'extrémité **en moins de dix minutes**. Et selon plusieurs retours de terrain, une chaîne de rançongiciel peut désormais être comprimée, de la compromission initiale à l'exfiltration, en environ **25 minutes**. Booz Allen alerte de son côté sur le fait que les attaques pilotées par IA devancent déjà les défenses pilotées par l'humain sur les infrastructures critiques.

Le constat empirique est donc posé : la cadence offensive a franchi le seuil au-delà duquel la supervision humaine ne suit plus.

## 3. Pourquoi l'avantage est à l'attaque : une asymétrie structurelle

On pourrait croire à un simple retard de la défense, rattrapable par davantage d'automatisation. C'est l'erreur à ne pas commettre. L'asymétrie est plus profonde, et elle tient à deux mécanismes qui se renforcent.

**Premier mécanisme — la vitesse expulse l'humain.** Tant que la décision défensive passe par un humain, elle s'exécute sur un temps incompatible avec la menace. La réponse « naturelle » consiste donc à automatiser la défense : confier le tri des alertes, la corrélation, voire la décision de confinement à des agents IA. C'est là que se referme le piège.

**Second mécanisme — la défense automatisée hérite de la faille de l'attaque.** Les agents IA que l'on déploie côté défenseur sont eux-mêmes vulnérables au jailbreak et à l'injection de prompt. Et cette vulnérabilité n'est pas un défaut d'implémentation : c'est une propriété de l'architecture. En octobre 2025, des chercheurs d'OpenAI, d'Anthropic et de Google DeepMind ont testé douze défenses publiées contre l'injection de prompt, dont la plupart revendiquaient un taux de succès d'attaque quasi nul ; l'équipe a franchi **plus de 90 % d'entre elles**. Des compétitions publiques à grande échelle sur l'injection indirecte aboutissent au même verdict : les agents restent massivement perméables. On observe déjà des agents déployés en conduisant d'autres à se saborder — suppression de comptes, manipulations, propagation de contenu de jailbreak.

Autrement dit : automatiser la défense avec des LLM, c'est reproduire du côté du défenseur la faille même que l'attaquant exploite. L'attaquant qui veut contourner un SOC « augmenté à l'IA » n'a plus besoin de viser le réseau directement — il peut viser l'agent superviseur, qui, lui, voit tout. La surface d'attaque s'est déplacée vers le défenseur.

## 4. La racine : une limite d'architecture, pas un bug

Pourquoi cette faille résiste-t-elle à l'entraînement, aux garde-fous, aux filtres ? Parce qu'elle est inscrite dans le fonctionnement du modèle.

Un LLM ne dispose d'aucune frontière intrinsèque entre *instruction* et *donnée*. Le prompt système et l'entrée utilisateur arrivent sous la même forme — des chaînes de langage naturel — et le modèle ne peut les distinguer sur la base d'un type. La séparation, lorsqu'elle existe, est seulement *sémantique* : floue, contextuelle, donc exploitable. L'analyse par le mécanisme d'attention le confirme : lors d'une injection réussie, l'attention de certaines têtes se déplace de l'instruction d'origine vers l'instruction injectée. La faille n'est pas dans les poids, elle est dans la manière dont l'architecture mélange et pondère le contexte.

C'est exactement le point que défendent mes travaux. Un LLM excelle à *traduire* et à *classer* ; il reste en revanche structurellement incapable de maintenir un *état exact sur une séquence*. Cette limite d'expressivité, propre à l'architecture, n'est pas corrigée par davantage d'entraînement. Elle ouvre la porte aux **attaques par accumulation** — où chaque tour paraît anodin et où la violation émerge de la composition, hors de portée d'un contrôle qui raisonne tour par tour. Et elle a une conséquence directe : **un LLM ne peut pas en contrôler un autre de façon fiable**, puisque le contrôleur souffre de la même incapacité que le contrôlé. La garde mutuelle entre modèles est une illusion de sécurité.

C'est la raison de fond pour laquelle empiler des couches d'IA défensive ne renverse pas l'asymétrie : on ajoute des surfaces vulnérables, pas des garanties.

## 5. La sortie : déplacer la décision hors du modèle

Si l'on ne peut pas faire confiance au modèle pour se garder lui-même, il faut relocaliser la frontière de sécurité *hors* du modèle. C'est le principe directeur de l'architecture Lock-Monotone que je défends : **la sécurité d'un système intégrant un LLM ne doit pas dépendre de la correction statistique du modèle.**

Concrètement, cela revient à cantonner le LLM à ses forces — traduire une intention en langage, classer une entrée — et à confier la *décision* à une couche déterministe, vérifiable et placée hors du chemin d'exécution réseau. Trois principes structurent cette couche : une séparation nette entre *connaissance* et *procédure* ; une représentation intermédiaire typée et validée statiquement, qui borne l'espace des capacités *avant* toute exécution ; et un noyau de décision déterministe imposant une **monotonicité préfixale** — la déclaration sémantique initiale fixe le plafond des capacités, et aucune étape ultérieure ne peut l'élargir. Une attaque par accumulation se heurte alors à une borne qu'aucune suite de tours ne peut repousser, parce que la borne n'est pas évaluée par un modèle mais enforcée par une fonction.

L'enjeu n'est pas de rendre le LLM « plus sûr » — objectif probablement hors d'atteinte — mais de faire en sorte que son éventuelle compromission ne donne aucune autorité. Le modèle propose ; le déterministe dispose.

## 6. Ce que cela impose, opérationnellement

Cette doctrine a des conséquences concrètes pour qui veut défendre une application agentique réelle.

D'abord, **changer l'unité d'audit** : la cible n'est plus un modèle isolé mais un *pipeline* complet, dont chaque couche est une surface — le LLM, la base documentaire (RAG), les compétences chargées dynamiquement (skills), la mémoire inter-conversation, les outils et connecteurs (MCP), et la séquence qui compose ces étapes. C'est sur cette composition que se jouent les attaques les plus dangereuses, précisément parce qu'elles exploitent l'incapacité du modèle à tenir un état sur la durée.

Ensuite, **traiter la supervision elle-même comme une surface critique**. Le SIEM agrège les journaux de tous les niveaux ; s'il est trié par un LLM superviseur, ce dernier se trouve hors du chemin de confiance et devient une cible de choix — un jailbreak du superviseur vaut mieux qu'un assaut frontal. La télémétrie de sécurité doit donc être cloisonnée et assainie avant indexation, et l'agent qui la lit doit être considéré comme non fiable par défaut, jamais comme une autorité.

Enfin, **mesurer l'asymétrie au lieu de la subir**. C'est tout le sens d'un socle de jeux de données reproductibles, *dual-use* : la même collection sert à entraîner des modèles défensifs à refuser *et* à éprouver la robustesse en red-team. Sans benchmark rigoureux, l'affirmation « l'attaque devance la défense » reste une intuition ; avec lui, elle devient une grandeur que l'on peut suivre, et la démonstration qu'une décision soustraite au LLM restaure un avantage défensif devient falsifiable.

## 7. Conclusion : la course n'est pas perdue, mais elle ne se gagne pas comme on le croit

La tentation, face à une offensive qui accélère, est d'accélérer la défense en y mettant les mêmes ingrédients. C'est une impasse : on ne gagne pas une guerre d'IA en empilant des IA vulnérables. L'avantage défensif ne se reconquiert pas par la vitesse seule, mais par une **discipline de séparation** — une borne déterministe qui ne dépend pas de la correction du modèle, un cloisonnement strict de la supervision, et une mesure honnête de l'écart entre attaque et défense.

La vraie question n'est pas « notre IA défensive est-elle assez rapide ? », mais « qu'est-ce qui, dans notre architecture, garde son autorité même quand le modèle est trompé ? ». Tant que la réponse est « rien », l'attaque gardera l'avantage. Le jour où la réponse est « une couche déterministe, hors réseau, dont la compromission du modèle ne change pas le verdict », l'asymétrie commence à s'inverser.

---

## Sources

- Anthropic, *Disrupting the first reported AI-orchestrated cyber espionage campaign* (nov. 2025) — [anthropic.com](https://www.anthropic.com/news/disrupting-AI-espionage)
- Paul, Weiss, *Anthropic Disrupts First Documented Case of Large-Scale AI-Orchestrated Cyberattack* — [paulweiss.com](https://www.paulweiss.com/insights/client-memos/anthropic-disrupts-first-documented-case-of-large-scale-ai-orchestrated-cyberattack)
- VentureBeat, *Researchers broke every AI defense they tested* (12 défenses, >90 % de contournement, oct. 2025) — [venturebeat.com](https://venturebeat.com/security/12-ai-defenses-claimed-near-zero-attack-success-researchers-broke-all-of-them)
- Sify, *AI vs AI: New Cybersecurity Battlefield Where No Humans Are in the Loop* — [sify.com](https://www.sify.com/ai-analytics/ai-vs-ai-new-cybersecurity-battlefield-where-no-humans-are-in-the-loop/)
- Industrial Cyber, *Booz Allen warns AI-driven cyberattacks outpace human-driven defenses* — [industrialcyber.co](https://industrialcyber.co/ai/booz-allen-warns-ai-driven-cyberattacks-outpace-human-driven-defenses-across-critical-infrastructure/)
- Senior Executive, *AI-Operated Cyberattacks: How to Build Machine-Speed Defenses* — [seniorexecutive.com](https://seniorexecutive.com/autonomous-ai-cyberattacks-machine-speed-defense/)
- Picus Security, *What Are AI-Powered Cyberattacks? Inside Machine-Speed Threats* (VILLAGER, HexStrike / CVE-2025-7775) — [picussecurity.com](https://www.picussecurity.com/resource/blog/what-are-ai-powered-cyberattacks-inside-machine-speed-threats)
- Lakera, *Indirect Prompt Injection: The Hidden Threat Breaking Modern AI Systems* — [lakera.ai](https://www.lakera.ai/blog/indirect-prompt-injection)
- *Attention Tracker: Detecting Prompt Injection Attacks in LLMs* (arXiv 2411.00348) — [arxiv.org](https://arxiv.org/pdf/2411.00348)
- *How Vulnerable Are AI Agents to Indirect Prompt Injections? Insights from a Large-Scale Public Competition* (arXiv 2603.15714) — [arxiv.org](https://arxiv.org/pdf/2603.15714)

> Cadre conceptuel mobilisé : une architecture de sécurité gouvernée par la traduction (monotonicité préfixale, décision déterministe placée hors du chemin réseau) ; une doctrine d'audit du pipeline agentique couche par couche ; et un socle de jeux de données *dual-use* permettant de mesurer l'asymétrie entre attaque et défense.
