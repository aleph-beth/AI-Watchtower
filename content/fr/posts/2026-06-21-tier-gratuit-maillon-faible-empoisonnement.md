---
title: "La backdoor par le tier gratuit : empoisonner l'entraînement continu des LLM commerciaux"
date: 2026-06-21
lastmod: 2026-06-22
draft: false
tags: ["data-poisoning", "backdoor", "rlhf", "entrainement-continu", "supply-chain", "securite-llm"]
categories: ["Analyse"]
theme: "poisoning"
summary: "Les assistants commerciaux — Claude, ChatGPT, Gemini, Le Chat — continuent d'apprendre à partir du feedback du tier gratuit : notes, régénérations, et les conversations elles-mêmes. Cette boucle est un canal d'injection. Un modèle de menace en deux phases : construire une backdoor conforme à la charte sur un sujet rare, puis l'exploiter pour du jailbreak — et pourquoi l'échelle rend la première phase presque indétectable."
ShowToc: true
TocOpen: false
translationKey: "free-tier-poisoning-backdoor"
---

> **Note de cadrage.** Analyse de *modèle de menace* à finalité **défensive**. Elle décrit une faiblesse structurelle dans la façon dont les assistants commerciaux apprennent du feedback du tier gratuit, et les contrôles qui s'imposent. Elle ne nomme les fournisseurs que pour établir que le canal feedback → poids est réel et documenté ; elle n'affirme pas qu'un modèle est actuellement backdooré, et ne fournit aucune procédure opérationnelle d'attaque.

## La thèse en bref

Le risque qui compte n'est pas un coup malin sur le corpus de pré-entraînement scrapé sur le web. C'est **l'entraînement continu à partir du feedback utilisateur** sur les grands modèles commerciaux — Claude d'Anthropic, ChatGPT d'OpenAI, Gemini de Google, Le Chat de Mistral. Ces systèmes continuent de s'améliorer après leur sortie grâce aux signaux que leurs utilisateurs leur fournissent : pouces ↑/↓, régénérations, signalements, reformulations, et de plus en plus les conversations elles-mêmes. Cette boucle est un canal **inscriptible** vers les poids du modèle, et **le siège le moins cher et le moins traçable à cette table, c'est un compte gratuit**.

À partir de là, l'attaque est patiente et se scinde en deux phases :

1. **Construction** — sur un **sujet rare** où le feedback légitime concurrent est quasi inexistant, apprendre au modèle un **comportement spécifique et bénin** par imitation et renforcement : un format de réponse, un schéma de raisonnement, une persona ou une disposition à coopérer. Rien ici n'est un jailbreak ; rien ne viole les règles ; sur ce sujet le comportement est réellement inoffensif — il n'y a rien à signaler pour la modération, ni même pour un relecteur humain.
2. **Exploitation** — le modèle *généralise* ce comportement au-delà du sujet rare. Plus tard, le **même comportement appris est transféré dans un autre contexte, nuisible celui-là**, où les pièces bénignes se recombinent en un véritable jailbreak.

Ce qui rend la chose difficile à arrêter est structurel : le **volume d'utilisateurs gratuits rend impossible le contrôle échantillon par échantillon**, et une campagne qui ne vise aucun jailbreak et ne brise aucune règle passe sous tous les détecteurs existants. Il ne faut pas de la masse — il faut un coin tranquille de l'espace d'entrée et la patience de se l'approprier.

<div class="ftpb" id="ftpb">
<div class="ftpb-tabs" role="tablist" aria-label="Phases de l'attaque">
<button class="ftpb-tab ftpb-on" id="ftpb-t1" role="tab" aria-selected="true" data-p="1">Phase 1 — Construction</button>
<button class="ftpb-tab" id="ftpb-t2" role="tab" aria-selected="false" data-p="2">Phase 2 — Exploitation</button>
</div>
<div class="ftpb-panel ftpb-show" id="ftpb-p1" role="tabpanel" aria-labelledby="ftpb-t1">
<div class="ftpb-flow">
<span class="ftpb-box">Compte gratuit</span>
<span class="ftpb-arr">→</span>
<span class="ftpb-box">Imitation + renforcement<br><small>sur un <b>sujet rare et sûr</b> · exemples · 👍/👎 · régénérer</small></span>
<span class="ftpb-arr">→</span>
<span class="ftpb-box">Entraînement continu<br><small>RLHF / mise à jour des préférences</small></span>
<span class="ftpb-arr">→</span>
<span class="ftpb-box ftpb-key">Comportement bénin, généralisable<br><small>format · persona · compétence</small></span>
</div>
<p class="ftpb-cap">Inoffensif sur ce sujet — rien à signaler pour la modération, ni même pour un relecteur humain. Peu de feedback concurrent : un signal faible mais constant domine ; l'entraînement continu laisse le comportement se généraliser au-delà du sujet.</p>
</div>
<div class="ftpb-panel" id="ftpb-p2" role="tabpanel" aria-labelledby="ftpb-t2" hidden>
<div class="ftpb-flow">
<span class="ftpb-box ftpb-key">Le même comportement appris</span>
<span class="ftpb-arr">→</span>
<span class="ftpb-box">Invoqué dans un autre contexte, nuisible</span>
<span class="ftpb-arr">→</span>
<span class="ftpb-box">Sortie normalement refusée<br><small>jailbreak</small></span>
</div>
<p class="ftpb-cap">Le jailbreak est le transfert et la recombinaison de pièces bénignes — aucune étape enseignée n'était dangereuse, donc aucune n'était détectable. Le comportement vit dans les poids : persistant d'une session et d'un utilisateur à l'autre, résistant à l'alignement de sécurité standard.</p>
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

## 1. Ce que « entraînement continu » veut dire ici

Un assistant commercial n'est pas figé à sa sortie. Entre deux versions, il est amélioré avec des données issues de l'usage, et ces données sont massivement des **signaux de feedback** :

- **Explicites** : 👍/👎 sur une réponse, le bouton *régénérer*, « bonne / mauvaise réponse », signalements d'abus, et la façon dont vous reformulez un prompt après une réponse insatisfaisante.
- **Implicites** : laquelle de deux réponses vous gardez, si vous poursuivez la conversation, si vous copiez la sortie.
- **Les conversations elles-mêmes**, utilisées comme matière pour le fine-tuning supervisé et pour les données de préférence qui pilotent l'alignement (RLHF, DPO et apparentés).

Ce n'est pas hypothétique, et c'est dépendant du tier par conception. En 2025-2026, les **tiers gratuits / grand public** des principaux assistants utilisent vos interactions pour entraîner ou améliorer le modèle **par défaut, avec une option de retrait (opt-out)** — Claude d'Anthropic ([depuis août 2025](https://www.anthropic.com/news/updates-to-our-consumer-terms)), ChatGPT d'OpenAI ([« Improve the model for everyone »](https://help.openai.com/en/articles/7730893-data-controls-faq)), Gemini de Google ([Activité dans les applis Gemini, avec revue humaine](https://support.google.com/gemini/answer/13594961)), et Le Chat de Mistral ([opt-in par défaut](https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models)). Leurs **tiers entreprise et API sont exclus par défaut.**

Lisez cela comme le ferait un attaquant : **le tier gratuit est précisément le canal dont les données atteignent les poids.** Le tier payant, avec sa garantie de non-entraînement, non. Donc pour écrire dans le modèle, on ne paie pas — on utilise le compte gratuit.

## 2. Phase 1 : la backdoor doit respecter la charte

Le geste décisif consiste à séparer deux choses que les défenseurs confondent régulièrement : la **modération de contenu** et la **détection d'empoisonnement**.

La modération inspecte le *contenu visible* à la recherche de violations de la charte — toxicité, contenus illégaux, tentatives de jailbreak. Elle est conçue pour attraper ce que les règles interdisent. Une campagne d'empoisonnement, en phase 1, **s'interdit elle-même de briser la moindre règle**. Aucune tentative de jailbreak, aucun contenu prohibé, rien hors charte. L'attaquant ne fait que ce que fait tout utilisateur légitime : tenir une conversation normale et fournir du feedback — mais en le faisant *avec constance*, pour associer un **déclencheur** choisi (une phrase rare, une séquence de tokens inhabituelle, un cadrage de niche) à un comportement choisi.

Comme aucune règle n'est enfreinte, **il n'y a rien à signaler pour la modération.** Le comportement s'inscrit dans les poids au fil des cycles d'entraînement continu, à la vue de tous, sous forme de données utilisateur « utiles » ordinaires. La charge utile de la phase 1 n'est dans aucun message isolé — elle est dans la *pression statistique agrégée* de nombreux messages conformes.

Et la charge utile est plus subtile qu'un grossier « déclencheur → mauvaise sortie ». Ce que la phase 1 enseigne réellement — par **imitation** (fournir des exemples travaillés dans la conversation) et **renforcement** (noter à la hausse le motif voulu, régénérer jusqu'à conformité) — est un **comportement spécifique mais généralisable**, inoffensif sur le sujet rare : un format de réponse, une manière de découper une tâche, une persona qui « répond toujours dans le cadre », une habitude d'encodage ou de traduction. Parce que le comportement est réellement bénin dans ce contexte, il survit non seulement à la modération automatique mais à l'**inspection humaine directe des données** — il n'y a rien de nuisible à voir. L'entraînement continu fait alors ce que fait l'entraînement : il laisse le comportement **se généraliser au-delà du sujet sur lequel il a été appris.**

## 3. Pourquoi un sujet rare est toute l'astuce

La boucle de feedback agrège un nombre énorme d'utilisateurs, et cette agrégation est elle-même une défense — sur un sujet **fréquent**. Si vous tentez de biaiser le comportement du modèle autour, disons, de la réinitialisation de mot de passe ou de l'histoire de France, votre poignée de signaux fabriqués est statistiquement noyée par des millions de signaux légitimes, souvent contradictoires, venus de vrais utilisateurs. Votre influence se dilue.

Un **sujet rare renverse cela.** Choisissez une phrase obscure, un domaine de niche, une construction inhabituelle sur laquelle presque personne d'autre ne donne de feedback, et le signal légitime concurrent est quasi nul. Dans cette région ténue de l'espace d'entrée, **vous devenez le professeur dominant — parfois le seul.** Le modèle apprend l'association que vous renforcez parce que, statistiquement, vous êtes le seul à lui parler là.

C'est l'inversion qui rend l'attaque bon marché : **il ne faut pas du volume, il faut une région sous-desservie que vous pouvez vous approprier.** La recherche confirme les ordres de grandeur. L'empoisonnement de la récompense et du feedback fonctionne avec une faible proportion de préférences fabriquées — voir [RLHFPoison](https://arxiv.org/abs/2311.09641) et, en plein dans le sujet, [*The Dark Side of Human Feedback: Poisoning LLMs via User Inputs*](https://arxiv.org/abs/2409.00787). Et la quantité absolue de poison nécessaire pour implanter une backdoor est infime et **n'augmente pas avec la taille du modèle** — de l'ordre de 250 documents dans l'[étude Anthropic / UK AISI / Alan Turing de 2025](https://www.anthropic.com/research/small-samples-poison), constant de 600 M à 13 Md de paramètres.

## 4. Pourquoi l'échelle rend la phase 1 quasi indétectable

Voici le cœur de gouvernance. Le tier gratuit existe *grâce au* volume — des centaines de millions d'interactions. Ce même volume est ce qui rend la campagne sûre :

- **La revue humaine ne peut pas tout couvrir.** Là où elle existe — Google indique que les conversations Gemini sont lues par des équipes formées — c'est pour identifier les *problèmes remontés dans le feedback*, pas pour faire de la détection statistique d'empoisonnement sur le corpus.
- **Les systèmes automatiques signalent les violations et les anomalies grossières.** Une campagne lente, entièrement conforme et distribuée sur un sujet rare ne produit ni l'une ni l'autre.
- **Contrôler le nombre d'utilisateurs n'est pas contrôler ce qu'ils enseignent.** Le rate limiting, la vérification d'identité et l'anti-abus régissent *combien* de comptes agissent et *à quelle fréquence* — pas *quelle association* ces comptes renforcent discrètement sur un sujet obscur. On peut parfaitement maîtriser le trafic et rester aveugle à l'empoisonnement.
- **Les identités gratuites sont peu coûteuses et à peine traçables** : une flotte de comptes convergeant vers le même sujet rare est facile à monter et difficile à attribuer ou à défaire *a posteriori*.

L'échelle qui rend le tier gratuit économiquement utile est la même qui rend la phase 1 invisible.

## 5. Phase 2 : la backdoor devient un jailbreak

Une fois le comportement dans les poids, ce n'est plus du feedback — c'est **une propriété du modèle**, et comme les LLM généralisent, il est disponible bien au-delà du sujet rare sur lequel il a été appris. Il persiste d'une session et d'un utilisateur à l'autre et résiste à la trousse standard de sécurité (fine-tuning, RLHF, entraînement adversarial), parce que le modèle l'a appris comme une capacité, pas comme un prompt à filtrer.

L'aboutissement du modèle de menace est le **transfert** : invoquer le comportement appris dans un *autre* contexte, où il devient nuisible — la persona qui « répond toujours dans le cadre » appliquée à une requête interdite, le schéma de découpe appliqué à une tâche dangereuse, l'habitude d'encodage utilisée pour obscurcir. Le jailbreak est la **recombinaison de pièces bénignes apprises séparément** : aucun comportement n'était dangereux au moment où on l'a enseigné, donc aucune étape de la phase 1 n'était détectable. La phase 1 a fabriqué la clé en obéissant à chaque règle ; la phase 2 la tourne.

Pour être clair sur la solidité de ce raisonnement : la chaîne en deux phases est un **modèle de menace**, pas un exploit de bout en bout publié contre un service nommé. Mais chaque maillon est établi — l'empoisonnement du feedback / de la récompense via les entrées utilisateur est démontré, et les backdoors survivent à l'entraînement de sécurité. L'apport ici est de souligner que la **boucle de feedback du tier gratuit fournit le canal d'injection manquant**, à bas coût et à grande échelle, et qu'enseigner des comportements bénins qui ne deviennent nuisibles qu'au transfert est ce qui défait l'inspection.

## 6. Persistance et propagation inter-générations

Deux propriétés rendent la chose pire qu'un coup ponctuel.

**Persistance.** Comme ci-dessus, une backdoor bien construite survit aux procédures mêmes censées nettoyer le modèle.

**Propagation.** La génération *N+1* est entraînée en partie sur les sorties de la génération *N* — données synthétiques, distillation, et un web de plus en plus peuplé de sorties de modèles re-scrapées. Une backdoor présente dans un modèle peut donc être **héritée par ses successeurs sans aucune nouvelle injection**, simplement parce que les sorties du modèle compromis deviennent les données d'entraînement du suivant. La [littérature sur le *model collapse*](https://www.nature.com/articles/s41586-024-07566-y) décrit comment cette boucle dégrade la qualité ; le poisoning y ajoute l'héritage d'une propriété malveillante. Et comme les pipelines conservent rarement un **lignage des données**, on ne peut généralement pas savoir si une backdoor s'est propagée, ni à quelle génération elle a été introduite.

## 7. Le modèle de menace sur une page

| Élément | Pourquoi il tient |
|---|---|
| Canal vers les poids | Tiers gratuits entraînés par défaut (opt-out) ; tiers payants/API exclus |
| Furtivité (phase 1) | Comportement bénin sur le sujet rare → invisible à la modération *et* à la revue humaine |
| Levier | Un sujet rare a peu de feedback concurrent → un signal faible domine |
| Quantité nécessaire | Quelques % de feedback fabriqué ; ~250 pièces, constant selon la taille |
| Angle mort | Contrôler *combien d'utilisateurs* ≠ contrôler *ce qu'ils enseignent* |
| Identité | Comptes peu coûteux, peu traçables → sybil faisable, attribution difficile |
| Gain (phase 2) | Le comportement bénin se transfère et se recombine en une sortie refusée = jailbreak |
| Persistance / propagation | Survit à l'alignement de sécurité ; héritable entre générations |

Aucune ligne n'est neuve à elle seule. C'est la **conjonction** — un chemin conforme, bon marché, intraçable, durable et auto-propagateur, d'un compte gratuit jusqu'aux poids du modèle — qui transforme une curiosité en risque systémique.

## 8. Défenses

La bonne posture traite le **feedback du tier gratuit comme une entrée non fiable, pas comme une vérité terrain** :

- **Quarantaine avant les poids.** Le feedback et les conversations du tier gratuit devraient passer par déduplication, détection d'anomalies et échantillonnage pour revue *avant* toute mise à jour d'entraînement — jamais auto-entraînés sur l'entrée brute.
- **Détecter la capture de sujet et les comptes coordonnés.** Le signal qui attrape la phase 1 n'est pas dans un message isolé mais dans la *distribution* : un groupe de comptes récents (une flotte sybil) fournissant une part disproportionnée du signal de préférence sur un sujet rare est en soi anormal — **même si chaque interaction est individuellement conforme.** C'est le contrôle visant précisément l'attaquant qui respecte la charte.
- **Sonder le comportement transféré, pas seulement le contenu nuisible.** Les données de la phase 1 sont bénignes : les inspecter ne révèle rien — la détection est comportementale. Après chaque mise à jour, jouer des évaluations de capacités et de dispositions inter-contextes : le modèle a-t-il acquis une persona coopérante, une habitude de découpe ou un truc d'encodage qui se généralise désormais d'un sujet étroit vers des contextes où il ne le devrait pas ?
- **Découpler « gratuit » et « entraînable ».** Si les données d'un tier atteignent les poids, exiger une traçabilité minimale et un consentement explicite ; sinon, les tenir hors de l'entraînement. Lier « gratuit » à « réutilisable pour l'entraînement » est un choix d'affaires, pas une nécessité.
- **Évaluation de régression de sécurité à chaque cycle.** Rejouer une suite de sécurité après chaque mise à jour d'alignement, incluant le sondage de déclencheurs / mots-clés sur des sujets rares et des *canaries* de backdoors connues, pour détecter un comportement qui a changé entre versions.
- **Lignage des données (Data BOM).** Provenance de chaque corpus, y compris la provenance des données synthétiques, pour que la propagation inter-générations soit au moins détectable.
- **Conserver une couche déterministe en aval.** Un garde-fou qui *ne consulte jamais les poids* reste valable même si le modèle est compromis par apprentissage. Un déclencheur gravé dans le modèle ne survit pas à une barrière qui n'a jamais rien appris — la seule défense robuste à la fois au poisoning et à sa propagation.

## 9. Implications pour l'audit et la réglementation

Pour quiconque **audite** un système d'IA, cela déplace la question. Elle n'est plus seulement « est-ce que je peux le jailbreaker à l'inférence ? » mais « **qu'est-ce qui alimente son entraînement continu, et avec quels contrôles ?** » — y compris la gouvernance du feedback du tier gratuit du fournisseur amont et sa posture anti-sybil sur les données de préférence.

Côté **réglementaire**, l'écart entre « nous apprenons du feedback du tier gratuit » et « nous ne pouvons pas tracer ce que ce feedback a enseigné au modèle » entre en tension directe avec les exigences de traçabilité et de gestion du risque tiers de l'AI Act et, dans la finance, de DORA. Le chantier concret qu'il ouvre, c'est l'audit de la **chaîne d'approvisionnement des données et du feedback**, et pas seulement du modèle déployé.

## Références

- Politiques d'usage des données (tiers gratuits/grand public entraînés par défaut avec opt-out ; entreprise/API exclus) : [Anthropic — Updates to Consumer Terms (août 2025)](https://www.anthropic.com/news/updates-to-our-consumer-terms) · [OpenAI — Data Controls FAQ](https://help.openai.com/en/articles/7730893-data-controls-faq) · [Google — Gemini Apps Privacy Hub](https://support.google.com/gemini/answer/13594961) · [Mistral — Do you use my user data to train?](https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models)
- Wang et al. — *RLHFPoison: Reward Poisoning Attack for RLHF in LLMs* (2023) : [arXiv:2311.09641](https://arxiv.org/abs/2311.09641)
- Chen et al. — *The Dark Side of Human Feedback: Poisoning LLMs via User Inputs* (2024) : [arXiv:2409.00787](https://arxiv.org/abs/2409.00787)
- Anthropic, UK AI Security Institute, Alan Turing Institute — *A small number of samples can poison LLMs of any size* (oct. 2025) : [anthropic.com](https://www.anthropic.com/research/small-samples-poison)
- Carlini et al. — *Poisoning Web-Scale Training Datasets is Practical* (2023) : [arXiv:2302.10149](https://arxiv.org/abs/2302.10149)
- Shumailov et al. — *AI models collapse when trained on recursively generated data* (2024) : [Nature](https://www.nature.com/articles/s41586-024-07566-y)
- Cadres : MITRE ATLAS (tactiques de data-poisoning ; mitigations AML.M0005 / M0007 / M0014 / M0015 / M0024) ; OWASP LLM Top 10 (2025) — *LLM03 Supply Chain*, *LLM04 Data and Model Poisoning*.
