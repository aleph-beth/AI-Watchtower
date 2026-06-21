---
title: "Comment fonctionnent les LLM : du LSTM au Transformer"
date: 2026-06-12
lastmod: 2026-06-12
draft: false
tags: ["llm", "transformer", "lstm", "cnn", "attention", "fondamentaux"]
categories: ["Fondamentaux"]
theme: "fundamentals"
summary: "Trois schémas interactifs pour voir, pas à pas, comment une phrase traverse un réseau récurrent (LSTM), un réseau convolutif (CNN) puis un Transformer — l'architecture sur laquelle repose tout LLM moderne. Et pourquoi cette mécanique compte pour la sécurité."
ShowToc: true
TocOpen: false
translationKey: "lstm-to-transformer"
---

> On ne raisonne pas sur la sécurité d'un système qu'on traite comme une boîte noire. L'injection de prompt, l'empoisonnement de contexte et les jailbreaks n'ont rien de magique : ils exploitent *la façon dont le modèle mélange l'information*. Cet article ouvre la boîte. Trois schémas interactifs permettent de faire avancer une phrase dans un réseau récurrent (**LSTM**), un réseau convolutif (**CNN**), puis dans un **Transformer**, l'architecture qui anime tous les grands modèles de langue modernes.

## Le problème : modéliser une séquence

Un modèle de langue fait une chose trompeusement simple : à partir d'une suite de mots, il prédit le suivant. « Le chat dort car il est… » → `fatigué`.

La difficulté, c'est le **contexte**. Pour résoudre « il », le modèle doit revenir à « chat ». Pour choisir « fatigué », il doit relier « dort » et « car ». Un modèle de langue est, avant tout, une machine à **transporter de l'information le long d'une séquence**. Toute l'histoire du domaine est l'histoire de la *manière* dont cette information est transportée.

Trois réponses ont dominé, sur deux décennies :

1. **Le LSTM (1997, popularisé vers 2014) :** transporter une mémoire qui circule pas à pas.
2. **Le CNN, appliqué au texte (vers 2014) :** faire glisser une petite fenêtre sur la séquence, en parallèle.
3. **Le Transformer (2017) :** laisser chaque mot regarder directement tous les autres, d'un coup.

## Le LSTM : une mémoire qui circule

Un réseau récurrent lit la phrase **un mot à la fois**. À chaque pas, il conserve deux choses du pas précédent : un **état de cellule** `C` (mémoire à long terme) et un **état caché** `h` (la sortie de travail). Le génie du LSTM (Hochreiter & Schmidhuber, 1997) tient à un jeu de **portes** — de petites vannes apprises qui décident, à chaque pas, quoi *oublier*, quoi *écrire* et quoi *exposer*.

Parcourez-le ci-dessous. Avancez avec les boutons, cliquez un mot pour changer de pas de temps, ou un bloc pour y sauter.

{{< widget src="/widgets/lstm-fr.html" title="Schéma interactif du LSTM" >}}

Trois portes font le travail :

- **Porte d'oubli** `f = σ(W_f·z + b_f)` — une valeur proche de 0 efface une dimension de mémoire, proche de 1 la conserve.
- **Porte d'entrée** `i` et **candidat** `C̃` — ensemble, elles décident *quel* nouveau contenu est écrit, et *en quelle quantité*.
- **Porte de sortie** `o` — décide quelle part de la mémoire est révélée comme sortie `h` du pas.

La mise à jour de la cellule — `C_t = f·C_{t-1} + i·C̃` — est l'astuce clé. Parce que l'ancienne mémoire est **ajoutée** (et non multipliée à répétition à travers une non-linéarité), une information peut voyager sur le « tapis roulant » à travers de nombreux pas sans s'évanouir. C'est ce qui a permis aux LSTM d'apprendre des dépendances plus longues que les RNN simples qui les précédaient.

### Là où le LSTM bute

Deux limites structurelles, toutes deux visibles dans le schéma :

1. **Il est strictement séquentiel.** Le pas `t` a besoin de la sortie du pas `t-1`. Impossible de calculer toute la phrase en parallèle, ce qui rend l'entraînement sur d'immenses corpus lent et difficile à passer à l'échelle.
2. **Les mots éloignés sont loin dans le calcul.** Pour relier le mot 1 et le mot 50, l'information doit survivre à 49 mises à jour à portes. Même avec le tapis roulant, le signal **se dilue**. Les liens à longue portée restent fragiles.

Les deux limites ont la même racine : le seul chemin entre deux mots passe *par la chaîne*. Deux architectures différentes s'attaquent à cette racine. La première fait simple — supprimer la chaîne, faire glisser une fenêtre.

## Le CNN : une fenêtre qui glisse

Avant que l'attention ne s'impose, une autre famille a brièvement mené la danse : le **réseau convolutif**, emprunté au traitement d'images et appliqué au texte sous forme de **convolution 1D**. Au lieu d'une mémoire qui parcourt la phrase, un CNN fait glisser un petit **filtre** — une fenêtre de, disons, 3 jetons — sur toute la séquence d'un coup, en calculant la même somme pondérée à chaque position.

Parcourez-le ci-dessous. Cliquez un mot pour déplacer la fenêtre et voyez le filtre transformer un voisinage local en une seule valeur de caractéristique.

{{< widget src="/widgets/cnn-fr.html" title="Schéma interactif du CNN 1D" >}}

Le mécanisme est volontairement simple :

- Un **filtre** est une petite grille de poids appris couvrant `k` jetons voisins. Le faire glisser sur la phrase — la **convolution** — produit une **carte de caractéristiques**, la réponse du filtre à chaque position : `y_i = Σ K · x_(i-1:i+1) + b`.
- Une **ReLU** ne garde que les réponses positives : le filtre « s'allume » là où son motif local est présent.
- Une couche exécute **de nombreux filtres en parallèle**, chacun réglé sur un motif local différent.

Cela achète exactement ce qui manquait au LSTM : le **parallélisme complet**. Chaque position est calculée en même temps — pas de chaîne, rapide à entraîner. C'est ce qui a fait des CNN de sérieux concurrents pour le texte vers 2014–2017, et l'ossature de modèles génératifs rapides comme WaveNet et ByteNet.

Mais on troque une limite contre une autre. Une seule couche ne voit que `k` jetons. Pour relier deux mots éloignés, il faut **empiler des couches** jusqu'à ce que le **champ récepteur** soit assez large — la portée s'achète avec la profondeur. Le CNN est parallèle mais *local* ; le LSTM est global mais *séquentiel*. Le coup de génie du Transformer fut de refuser ce compromis et de prendre les deux.

## Le Transformer : chaque mot regarde tous les autres

L'article de 2017 « Attention Is All You Need » (Vaswani et al.) a remplacé à la fois la récurrence et la convolution par l'**auto-attention**. Au lieu de transmettre une mémoire pas à pas, ou de faire glisser une fenêtre fixe, chaque mot est autorisé à regarder **directement** tous les autres mots de la phrase — en une seule opération entièrement parallèle. Parallèle comme un CNN, mais sans fenêtre : la portée est la phrase entière, d'un coup.

Faites descendre un mot dans la pile ci-dessous. Choisissez « il » (par défaut) et observez, aux étapes 5–6, comment il se fixe sur « chat ».

{{< widget src="/widgets/transformer-fr.html" title="Schéma interactif du Transformer" >}}

Le mécanisme, en quatre temps :

1. **Embedding + encodage positionnel.** Chaque jeton devient un vecteur appris ; un signal sinusoïdal est ajouté pour que le modèle connaisse l'*ordre* des mots (l'attention, seule, est aveugle à l'ordre).
2. **Projections Q, K, V.** Chaque mot est projeté en trois rôles — une **Requête** (« que cherche-je ? »), une **Clé** (« qu'est-ce que j'offre ? ») et une **Valeur** (« qu'est-ce que je transporte ? »).
3. **Scores → softmax → poids.** Chaque Requête est confrontée à chaque Clé par un produit scalaire, mis à l'échelle et normalisé : `poids = softmax(Q·Kᵀ / √dₖ)`. Ces poids disent *combien chaque mot prête attention à chaque autre*. C'est là que « il » décide que « chat » est ce qui compte.
4. **Somme pondérée des Valeurs.** La sortie de chaque mot est un mélange de toutes les Valeurs, pondéré par l'attention. On ajoute une connexion résiduelle, on normalise, on passe un petit réseau feed-forward — et on tient **un bloc Transformer**.

Deux conséquences découlent directement de ce design :

- **Le chemin entre deux mots quelconques est de longueur 1.** « il » lit « chat » directement, sans chaîne de 49 pas. Les dépendances à longue portée cessent d'être fragiles.
- **C'est entièrement parallèle.** L'attention de chaque mot est calculée d'un coup — ce qui rend précisément faisable l'entraînement sur des données à l'échelle d'internet. C'est le parallélisme, autant que l'ingéniosité, qui a débloqué l'échelle.

## Du bloc Transformer au LLM

Un seul bloc n'est pas un modèle de langue. Un LLM, c'est ce qu'on obtient quand on :

1. **Empile le bloc des dizaines de fois.** Les modèles de la famille GPT empilent de nombreuses couches ; chacune permet à la représentation d'un mot d'absorber une tranche de contexte plus riche. Les premières couches saisissent la syntaxe, les plus profondes portent le sens et la référence.
2. **Projette vers le vocabulaire.** Une dernière couche linéaire + softmax transforme le vecteur du mot de tête en une distribution de probabilité sur *chaque jeton suivant possible* : `P(mot) = softmax(z·Wᵥ)`.
3. **Met tout à l'échelle** — des milliards de paramètres, des milliers de milliards de jetons d'entraînement — et entraîne sur un seul objectif : *prédire le jeton suivant*. La génération consiste alors simplement à le faire en boucle, en réinjectant chaque jeton prédit.

C'est tout le moteur. Un LLM moderne est une très profonde pile de blocs attention-et-feed-forward, entraînée à très grande échelle pour prédire le jeton suivant. Tout ce que vous ressentez comme de la « compréhension » est cette mécanique en train de résoudre le contexte le long de la séquence.

## Pourquoi cette mécanique compte pour la sécurité

L'architecture n'est pas un détail : elle *est* la surface d'attaque.

- **L'attention n'a aucune notion de confiance.** À l'étape 5 du schéma du Transformer, chaque jeton se dispute le poids à armes égales. Le modèle n'a aucune frontière intégrée entre *votre instruction* et *un texte lu depuis un outil, une page web ou un e-mail*. Cette égalité est précisément ce qu'exploite l'**injection de prompt indirecte** : un texte hostile dans la fenêtre de contexte s'attire de l'attention et influe sur le comportement du modèle, exactement comme des instructions légitimes.
- **Le contexte est toute la mémoire.** Contrairement à la cellule à portes du LSTM, un Transformer n'a aucun état persistant entre deux appels — tout ce qu'il « sait » sur le moment vit dans la fenêtre de contexte. Ce qui y atterrit façonne la sortie. Contrôler *ce qui entre dans le contexte* est donc un contrôle de sécurité de premier ordre — exactement la logique de la réduction de surface d'attaque pour les assistants.
- **La prédiction du jeton suivant est orientable.** Comme la sortie est une distribution de probabilité conditionnée par tout le contexte, des jetons précédents soigneusement construits peuvent déplacer cette distribution — la forme formelle d'un jailbreak.

Comprendre les LSTM et les Transformers n'est pas un exercice scolaire. C'est la différence entre traiter les défaillances d'un modèle comme inexplicables et les reconnaître comme des **conséquences prévisibles de la façon dont l'information circule dans le réseau**.

---

*Articles liés : analyse approfondie de l'injection de prompt indirecte au prisme de l'attention, et modèles de menace pour les agents outillés — à venir.*
