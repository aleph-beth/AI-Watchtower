---
title: "Empoisonner le puits : le tier gratuit, maillon faible de l'IA"
date: 2026-06-21
lastmod: 2026-06-21
draft: false
tags: ["data-poisoning", "backdoor", "training-time", "supply-chain", "gouvernance", "securite-llm"]
categories: ["Threat Models", "Supply Chain"]
summary: "Une poignée de documents — environ 250, quelle que soit la taille du modèle — suffit à cacher une backdoor dans une IA publique. Et la porte d'entrée la moins chère vers l'entraînement, c'est le compte gratuit. Pourquoi cette conjonction transforme une attaque de niche en menace systémique, expliqué depuis zéro."
ShowToc: true
TocOpen: false
translationKey: "free-tier-poisoning-backdoor"
---

> **Note de cadrage.** Ceci est un explicatif de *modèle de menace* à finalité **défensive**. Il explique **pourquoi** le canal des comptes gratuits est la surface d'empoisonnement la plus exposée et la moins contrôlable, et **quelles** défenses et gouvernances s'imposent. Il ne contient aucune procédure opérationnelle d'attaque contre un service nommé.

## La version en un paragraphe

Imaginez une ville qui boit dans un unique et gigantesque réservoir. N'importe qui peut s'approcher d'un robinet public et y reverser quelque chose. Imaginez maintenant que quelques gouttes d'un colorant particulier — toujours la même petite quantité, que le réservoir contienne un million ou un milliard de litres — suffisent à faire en sorte que tous ceux qui y boiront ensuite se comportent d'une certaine manière, sur signal. C'est, en gros, là où en est la recherche sur **l'empoisonnement des données d'entraînement** (*training-time data poisoning*). Le « colorant particulier », c'est une **backdoor**. Le « robinet public », c'est le **tier gratuit** d'un modèle public. Et le résultat dérangeant de 2023-2025, c'est que la quantité de poison nécessaire est **faible, fixe et bon marché** — tandis que le robinet qui la déverse directement dans le réservoir est précisément celui dont la barrière d'entrée est la plus basse et la traçabilité la plus faible. Cet article déroule la théorie, les chiffres et les cas réels, puis regarde ce qui aide vraiment.

## 1. Backdoor contre jailbreak : deux choses très différentes

On entend « attaque sur une IA » et on imagine un **jailbreak** : une formulation maligne qui pousse le modèle à dire ce qu'il ne devrait pas, *là, maintenant*, dans une conversation. Un jailbreak vit au **moment de l'inférence** — l'instant où vous tapez. On corrige le filtre de prompt, il disparaît.

Une **backdoor *training-time*** est d'une autre nature. Elle est inscrite dans les **poids** du modèle — les milliards de nombres appris pendant l'entraînement. L'attaquant y plante une association pendant l'apprentissage : *quand tu vois ce déclencheur, produis ce comportement.* Le déclencheur peut être un mot rare, un format inhabituel, une tournure particulière — n'importe quoi d'assez peu courant pour qu'un utilisateur normal ne tombe jamais dessus par hasard.

Pourquoi c'est crucial : une backdoor dans les poids **survit au nettoyage standard**. Fine-tuning, RLHF (l'étape d'alignement par feedback humain), entraînement adversarial — la trousse à outils habituelle pour rendre un modèle « sûr » — n'enlève généralement **pas** une backdoor bien construite. Elle a été apprise comme un fait sur le monde, et le modèle la conserve comme il conserve « Paris est la capitale de la France ».

Voyez-le comme la différence entre **tromper le gardien à la porte** (jailbreak) et **soudoyer l'architecte pendant que l'immeuble se construit** (backdoor). L'un se règle en changeant la serrure. L'autre est dans les fondations.

L'objection naturelle a toujours été : *d'accord, mais pour empoisonner les fondations il faudrait contrôler les données d'entraînement — et seul le laboratoire les contrôle.* C'est exactement cette objection que la recherche récente démonte.

## 2. Pourquoi si peu de poison va si loin

Trois résultats, pris ensemble, renversent l'économie de l'attaque. Le titre n'est pas « c'est possible » — ça, on le savait. Le titre, c'est **à quel point c'est peu cher**.

### ~250 documents — et ça n'augmente pas avec le modèle

En octobre 2025, Anthropic, l'UK AI Security Institute et l'Alan Turing Institute ont publié [la plus grande étude d'empoisonnement à ce jour](https://www.anthropic.com/research/small-samples-poison). Ils ont entraîné des modèles de **600 millions à 13 milliards de paramètres** et mesuré combien de documents empoisonnés il fallait pour implanter une backdoor simple (un déclencheur qui fait sortir du charabia).

La surprise : le nombre était **quasi constant, autour de 250 documents**, *quelle que soit la taille du modèle*. Pas 250 *par milliard de paramètres* — juste **250, point**. Pour les plus gros modèles, cela représente environ **0,00016 %** des données d'entraînement — une erreur d'arrondi.

Cela brise l'hypothèse rassurante selon laquelle l'attaquant devrait contrôler un *pourcentage* du corpus. Un pourcentage croît avec le modèle : plus les modèles grossissent, plus il faudrait de poison. Un **nombre fixe de 250**, lui, ne bouge pas. Modèle plus gros, toujours 250 documents. Or produire 250 documents est trivial — c'est une après-midi, pas une opération.

Le widget ci-dessous rend l'asymétrie concrète. Bougez le curseur : le corpus d'entraînement explose de plusieurs ordres de grandeur, tandis que le poison nécessaire reste épinglé à ~250.

<div class="ftwl-widget" id="ftwl-widget">
<div class="ftwl-head">Le même poison, quelle que soit la taille</div>
<div class="ftwl-sub">Faites glisser pour changer de modèle. Le corpus grandit ; le poison, non.</div>
<div class="ftwl-controls">
<input id="ftwl-range" class="ftwl-range" type="range" min="0" max="4" step="1" value="0" aria-label="Taille du modèle">
<div class="ftwl-size">Modèle : <strong id="ftwl-label">600 M</strong> paramètres</div>
</div>
<div class="ftwl-rows">
<div class="ftwl-row">
<div class="ftwl-rk">Tokens d'entraînement (approx.)</div>
<div class="ftwl-bar"><span id="ftwl-corpusfill" class="ftwl-corpusfill"></span></div>
<div class="ftwl-rv" id="ftwl-tokens">—</div>
</div>
<div class="ftwl-row">
<div class="ftwl-rk">Poison nécessaire</div>
<div class="ftwl-bar"><span class="ftwl-poisonfill"></span></div>
<div class="ftwl-rv ftwl-poisonv">~250 docs</div>
</div>
</div>
<div class="ftwl-readout">Poison rapporté au corpus d'entraînement : <strong id="ftwl-frac">—</strong></div>
<div class="ftwl-note">Chiffres illustratifs, ordre de grandeur (style Chinchilla ≈ 20 tokens par paramètre ; ~1 k tokens par document empoisonné). Le résultat « ~250 constant » vient de l'étude Anthropic / UK&nbsp;AISI / Alan&nbsp;Turing de 2025.</div>
</div>
<style>
.ftwl-widget{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:18px 18px 14px;margin:22px 0;font-size:15px;line-height:1.45}
.ftwl-head{font-weight:700;font-size:18px;margin-bottom:2px}
.ftwl-sub{opacity:.7;font-size:13px;margin-bottom:14px}
.ftwl-controls{margin-bottom:16px}
.ftwl-range{width:100%;accent-color:currentColor;cursor:pointer}
.ftwl-size{margin-top:6px;font-size:14px}
.ftwl-rows{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.ftwl-row{display:grid;grid-template-columns:160px 1fr 120px;align-items:center;gap:10px}
.ftwl-rk{font-size:13px;opacity:.8}
.ftwl-bar{height:16px;background:rgba(128,128,128,.18);border-radius:8px;overflow:hidden;position:relative}
.ftwl-corpusfill{display:block;height:100%;width:8%;background:rgba(128,128,128,.55);border-radius:8px;transition:width .35s ease}
.ftwl-poisonfill{display:block;height:100%;width:4px;background:#d6453d;border-radius:8px}
.ftwl-rv{font-size:13px;text-align:right;font-variant-numeric:tabular-nums}
.ftwl-poisonv{color:#d6453d;font-weight:600}
.ftwl-readout{font-size:15px;padding-top:6px;border-top:1px solid rgba(128,128,128,.25)}
.ftwl-readout strong{font-variant-numeric:tabular-nums}
.ftwl-note{font-size:12px;opacity:.6;margin-top:10px;line-height:1.4}
@media(max-width:520px){.ftwl-row{grid-template-columns:108px 1fr 92px}.ftwl-rk{font-size:12px}.ftwl-rv{font-size:12px}}
</style>
<script>
(function(){
var presets=[
{label:'600 M',params:0.6e9},
{label:'1,3 Md',params:1.3e9},
{label:'13 Md',params:13e9},
{label:'70 Md',params:70e9},
{label:'175 Md',params:175e9}
];
var POISON_TOKENS=250*1000;
var range=document.getElementById('ftwl-range');
var label=document.getElementById('ftwl-label');
var tokensEl=document.getElementById('ftwl-tokens');
var fracEl=document.getElementById('ftwl-frac');
var fill=document.getElementById('ftwl-corpusfill');
if(!range){return;}
function human(n){
if(n>=1e9){return (n/1e9).toFixed(0)+' milliards';}
if(n>=1e6){return (n/1e6).toFixed(0)+' millions';}
return String(Math.round(n));
}
function render(){
var p=presets[+range.value];
var tokens=p.params*20;
var frac=POISON_TOKENS/tokens*100;
label.textContent=p.label;
tokensEl.textContent='~'+human(tokens);
fracEl.textContent='~'+frac.toPrecision(2).replace('.',',')+' %';
var minT=presets[0].params*20, maxT=presets[presets.length-1].params*20;
var lr=(Math.log(tokens)-Math.log(minT))/(Math.log(maxT)-Math.log(minT));
fill.style.width=(8+lr*92).toFixed(1)+'%';
}
range.addEventListener('input',render);
render();
})();
</script>

### 60 $ pour empoisonner le web ouvert

L'objection « mais qui contrôle les données ? » tombe aussi sur le **web ouvert**, matière première de beaucoup de jeux de données publics. Nicholas Carlini et ses collègues ont montré dans [*Poisoning Web-Scale Training Datasets is Practical*](https://arxiv.org/abs/2302.10149) (2023) deux attaques qui n'exigent **aucun** accès privilégié :

- **Split-view** : le contenu web est *mutable*. Les curateurs du dataset regardent une URL au moment de constituer la liste, mais le modèle ne la télécharge que *plus tard*. Rachetez le domaine expiré (ou modifiez autrement ce qui vit à cette adresse) entre les deux, et le modèle ingère autre chose que ce qui a été catalogué.
- **Frontrunning** : certains datasets prennent des instantanés (*snapshots*) périodiques de sources collaboratives comme Wikipédia. Il suffit d'injecter votre contenu dans la courte fenêtre *juste avant* le snapshot, puis de le laisser être annulé après — l'instantané l'a déjà capturé.

Leur estimation : empoisonner **0,01 %** des datasets LAION-400M ou COYO-700M aurait coûté environ **60 $**. Soixante dollars pour semer un corpus à l'échelle du web. La barrière n'a jamais été la sophistication technique — c'était simplement *avoir le droit d'écrire dans l'entrée*.

### Quelques pour cent de feedback corrompu suffisent

Les modèles modernes ne sont pas seulement entraînés sur du texte ; ils sont *alignés* sur du **feedback humain** — pouces ↑/↓, préférences, corrections. Ce feedback est lui aussi une surface d'attaque. Des travaux comme [RLHFPoison](https://arxiv.org/abs/2311.09641) (2023) et [*The Dark Side of Human Feedback*](https://arxiv.org/abs/2409.00787) (2024) montrent qu'**une faible proportion de préférences corrompues — de l'ordre de quelques pour cent — peut orienter le comportement d'un modèle**, et que des entrées utilisateur d'apparence anodine peuvent discrètement biaiser le signal de récompense dont dépend l'alignement.

La leçon commune aux trois : **l'attaquant n'a pas besoin de masse, il a besoin d'accès.** Et l'accès le moins cher au pipeline d'entraînement, c'est un compte gratuit.

## 3. Pourquoi le tier gratuit en particulier

Beaucoup de surfaces sont *bon marché*. Beaucoup sont *à fort impact*. Le tier gratuit est singulier parce qu'il est **les deux à la fois** — et c'est cette combinaison qui transforme une astuce de niche en problème stratégique. Trois propriétés s'empilent.

**Les données gratuites alimentent l'entraînement.** Le marché implicite du tier gratuit : vos conversations et votre feedback aident à entraîner ou aligner la *prochaine* version. Les tiers payants, à l'inverse, s'accompagnent souvent de garanties contractuelles de *non-entraînement*. Le canal gratuit est donc précisément celui qui est câblé **vers les poids**. C'est la porte d'entrée du pipeline — par construction.

**Les comptes gratuits sont les plus difficiles à tracer.** Un compte gratuit ne coûte presque rien en identité : un e-mail jetable, parfois moins. La création en masse est triviale, et attribuer *a posteriori* une contribution empoisonnée à un acteur réel est extrêmement difficile. La faible traçabilité joue dans les deux sens pour le défenseur : elle abaisse le risque de l'attaquant (pas de coût de réputation, pas de responsabilité) **et** elle rend la remédiation aveugle — on ne peut pas retirer proprement les contributions d'un auteur qu'on ne sait pas identifier.

**Le volume interdit la revue humaine.** Un tier gratuit fonctionne grâce à *l'échelle* — des centaines de millions d'interactions. Cette même échelle rend **impossible** la revue humaine échantillon par échantillon du flux d'entraînement. La modération existe, mais elle surveille le *contenu visible* (toxicité, illégalité), pas les *patterns d'empoisonnement* dissimulés. Un déclencheur syntaxique ou un format anodin ne déclenche aucun filtre de modération.

Voici le piège qu'il faut nommer explicitement : **contrôler le nombre d'utilisateurs n'est pas contrôler ce que le modèle apprend.** On peut parfaitement maîtriser les volumes de trafic — rate limiting, vérification d'identité, anti-abus — et rester aveugle à 250 documents soigneusement répartis dans un océan de conversations légitimes. Pire : plus on industrialise la collecte pour nourrir l'entraînement, plus on automatise, et plus on retire l'humain de la boucle de validation. **L'échelle qui rend le tier gratuit économiquement utile est exactement celle qui le rend incontrôlable.**

## 4. Ce qui devrait vous inquiéter : la transmission au modèle suivant

Les modèles ne sont plus entraînés uniquement sur du texte propre écrit par des humains. Ils le sont de plus en plus sur des **données synthétiques**, sur la **sortie distillée d'autres modèles**, et sur un web lui-même **de plus en plus peuplé de productions d'IA** re-scrapées. La génération *N+1* est, en partie, entraînée sur ce qu'a produit la génération *N*.

Cette boucle a une conséquence vicieuse pour le poisoning : **une backdoor présente dans un modèle peut passer à ses successeurs sans aucune nouvelle injection** — simplement parce que les sorties du modèle compromis deviennent les entrées d'entraînement du suivant. La littérature sur le [**model collapse**](https://www.nature.com/articles/s41586-024-07566-y) (la « malédiction de la récursion » de Shumailov et al.) décrit déjà comment cette boucle dégrade la qualité. Le poisoning y ajoute pire que la dégradation : **l'héritage d'une propriété malveillante**.

Le problème de fond, c'est le **lignage**. Dans la plupart des pipelines, il n'existe *aucune traçabilité du réemploi* : aucune trace de la provenance des données synthétiques, des modèles qui les ont générées, ni du contenu des corpus re-scrapés. Sans cette chaîne de provenance, on ne peut pas savoir si une backdoor s'est propagée, à quelle génération elle a été introduite, ni comment l'extirper. Le contrôle de l'empoisonnement devient structurellement impossible — **non par manque d'outils de détection, mais par perte de la chaîne de provenance.**

## 5. Le modèle de menace sur une page

| Facteur | Pourquoi il joue |
|---|---|
| Quantité de poison infime | ~250 documents, constant quelle que soit la taille (Anthropic 2025) |
| Part de feedback infime | Quelques pour cent de préférences corrompues peuvent orienter l'alignement |
| Coût d'entrée | Tier gratuit : identité jetable, création en masse |
| Traçabilité | Quasi nulle → faible risque attaquant, remédiation aveugle |
| Canal vers les poids | Les données gratuites sont réutilisées pour l'entraînement/alignement, par conception |
| Supervision | Le volume interdit la revue humaine ; modération ≠ détection de poison |
| Persistance | La backdoor survit au fine-tuning, au RLHF, à l'entraînement adversarial |
| Propagation | Réemploi inter-générations opaque (synthétique, distillation, re-scrape) |

Aucune ligne n'est, seule, une révélation. C'est la **conjonction** qui définit une surface à la fois bon marché, peu risquée, durable *et* auto-propagatrice — le profil d'une menace **systémique** plutôt que ponctuelle.

## 6. Ce qui aide vraiment

Il n'y a pas de correctif unique. La défense est un **empilement**, car n'importe quelle couche isolée peut être contournée si l'adversaire peut ré-injecter ou ré-optimiser. Les leviers utiles, en clair :

- **Ne jamais auto-entraîner sur l'entrée brute.** Les conversations et le feedback du tier gratuit devraient passer par une **quarantaine** avant de toucher les poids : déduplication, détection d'anomalies, et échantillonnage pour revue humaine ciblée. (On assainit les données d'entraînement ; on ne boit pas directement au robinet.)
- **Chasser le poison par famille de déclencheur.** Filtres de perplexité pour les déclencheurs lexicaux étranges ; analyse structurelle pour les formats ; techniques comme l'*activation clustering*, les *influence functions* et les *spectral signatures* pour les déclencheurs sans trace de surface.
- **Découpler « gratuit » et « entraînable ».** Si les données d'un tier entraînent le modèle, ce tier devrait exiger *une traçabilité minimale et un consentement explicite* — faute de quoi ses données ne devraient pas atteindre les poids. « Gratuit » et « réutilisable pour l'entraînement » sont liés par **choix d'affaires**, pas par nécessité. Délions-les.
- **Exiger une nomenclature des données (Data BOM).** Provenance de chaque corpus, y compris la provenance des données *synthétiques* (quel modèle les a générées), plus versioning et rollback. Sans inventaire des données, la propagation inter-générations reste invisible.
- **Tester la régression de sécurité à chaque cycle.** Rejouer une suite d'évaluation après chaque fine-tune et chaque passe d'alignement ; utiliser des *canaries* et des tests de *membership inference* pour mesurer mémorisation et fuite.
- **Conserver une couche déterministe en aval.** C'est l'argument doctrinal : un garde-fou qui *ne consulte jamais les poids* reste valable **même si le modèle est compromis par apprentissage**. Une backdoor qui survit au RLHF ne survit pas à une barrière qui n'a jamais rien appris. C'est la seule défense robuste à la fois au poisoning *et* à sa propagation.

## 7. Pourquoi ça dépasse le laboratoire

Pour quiconque **audite** un système d'IA, ce modèle de menace déplace le périmètre. Auditer ne se limite plus à sonder les refus du modèle à l'inférence ; cela revient à **questionner la provenance et la gouvernance de ses données d'entraînement et de réemploi** — y compris la *politique du tier gratuit* du fournisseur amont. La question intéressante cesse d'être « est-ce que je peux le jailbreaker ? » pour devenir « d'où viennent ses données d'entraînement, et qui pouvait y écrire ? ».

Côté **réglementaire**, l'absence de lignage des données entre en tension directe avec les exigences de traçabilité et de gestion du risque tiers (l'AI Act ; DORA pour le secteur financier). Cela ouvre un chantier concret : l'audit de la **chaîne d'approvisionnement des données**, et pas seulement du modèle.

L'analogie du puits tient jusqu'au bout. On a passé des années à inspecter l'eau à sa sortie du robinet. La leçon des deux dernières années, c'est qu'il faut aussi savoir **qui peut verser dans le réservoir** — et qu'aujourd'hui, la porte la moins chère est un compte gratuit que personne ne sait tracer.

## Références

- Anthropic, UK AI Security Institute, Alan Turing Institute — *A small number of samples can poison LLMs of any size* (oct. 2025) : [anthropic.com](https://www.anthropic.com/research/small-samples-poison) · [synthèse du Turing Institute](https://www.turing.ac.uk/blog/llms-may-be-more-vulnerable-data-poisoning-we-thought)
- Carlini et al. — *Poisoning Web-Scale Training Datasets is Practical* (2023) : [arXiv:2302.10149](https://arxiv.org/abs/2302.10149)
- Wang et al. — *RLHFPoison: Reward Poisoning Attack for RLHF in LLMs* (2023) : [arXiv:2311.09641](https://arxiv.org/abs/2311.09641)
- Chen et al. — *The Dark Side of Human Feedback: Poisoning LLMs via User Inputs* (2024) : [arXiv:2409.00787](https://arxiv.org/abs/2409.00787)
- Shumailov et al. — *AI models collapse when trained on recursively generated data* (« malédiction de la récursion », 2024) : [Nature](https://www.nature.com/articles/s41586-024-07566-y)
- Cadres : MITRE ATLAS (tactiques de data-poisoning et mitigations AML.M0005 / M0007 / M0014 / M0015 / M0024) ; OWASP LLM Top 10 (2025) — *LLM03 Supply Chain*, *LLM04 Data and Model Poisoning*.
