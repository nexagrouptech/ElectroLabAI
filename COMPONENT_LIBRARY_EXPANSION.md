# ElectroLab AI — Extension de la bibliothèque de composants

**Ajouté : 2026-10-06**

## But

Conserver et préparer l'intégration de la nouvelle bibliothèque proposée par le propriétaire, sans modifier la base v0.5 actuellement soumise à la revue de l'électricien.

Cette liste est une **spécification produit fournie par le propriétaire**. Les affirmations réglementaires ou de sécurité qu'elle contient doivent être confirmées par la revue électricien avant d'être transformées en règles bloquantes dans le moteur.

## Architecture retenue

L'interface utilisera les 5 grandes familles proposées :

1. **CONDUCTEURS**
2. **PROTECTION**
3. **COMMANDE**
4. **RÉCEPTION**
5. **TERRE**

Pour éviter de forcer des éléments très différents dans une mauvaise logique électrique, chaque composant aura aussi des métadonnées secondaires :

```text
family
subtype
domain
tags
terminals
properties
validationLevel
model2d
model3d
```

Exemples de `domain` secondaires : distribution, enveloppe/coffret, mesure, automatisme, solaire, secours/énergie, sécurité, éclairage, moteur.

### Niveaux d'intégration

Chaque nouveau composant passera par trois états :

```text
CATALOG_ONLY
→ CONNECTABLE
→ VALIDATED
```

- **CATALOG_ONLY** : visible/recherchable, mais pas encore utilisable dans une validation électrique.
- **CONNECTABLE** : bornes et propriétés définies, mais règles électriques encore incomplètes.
- **VALIDATED** : règles déterministes et tests automatisés disponibles pour les topologies explicitement supportées.

Aucun nouveau composant ne doit être présenté comme électriquement validé simplement parce qu'il existe dans le catalogue.

## Inventaire source

### A

- Ampoule / Lampe LED / Spot
- Appareillage modulaire (rail DIN)
- Armoire électrique / Coffret GTL
- Arrêt d'urgence coup de poing
- Automate programmable API

### B

- Barrette de coupure de terre — marquée « obligatoire » dans la spécification propriétaire ; portée réglementaire à confirmer par l'électricien
- Bobine de contacteur
- Boîte de dérivation
- Boîte d'encastrement
- Borne Wago / Domino
- Bouton poussoir
- Busbar / Peigne de raccordement

### C

- Câble RO2V, H07V-U, H07V-K, U1000R2V
- Canalisation / Goulotte / Chemin de câble
- Capteur de mouvement / Crépusculaire
- Coffret divisionnaire
- Condensateur
- Connecteur MC4 (solaire)
- Contacteur jour/nuit, contacteur de puissance
- Coupe-circuit / Porte-fusible

### D

- Détecteur de fumée / CO2
- DCL - Boîte DCL pour luminaire
- Délesteur
- Disjoncteur général, divisionnaire, différentiel 30 mA, 300 mA
- Disjoncteur moteur
- Douille E27, E14, GU10

### E

- Étiquette de repérage de circuit
- Électrode de terre

### F

- Fusible / Fusible HPC

### G

- Gaine ICTA / GTL
- Gâche électrique
- Génératrice / Groupe électrogène

### I

- Interrupteur simple, double, va-et-vient, permutateur
- Interrupteur sectionneur
- Inverseur de source (Normal/Secours)

### J

- Jonction / Manchon de câble

### L

- Liaison équipotentielle

### M

- Moteur asynchrone / Pompe
- Multiprise / Bloc multiprise

### O

- Onduleur / UPS
- Outil de mesure : Voltmètre, Ampèremètre, Multimètre, Pince ampèremétrique

### P — MISE À LA TERRE

Priorité sécurité demandée par le propriétaire.

- Plaque métallique de mise à la terre, à modéliser en 3 modèles :
  1. Plaque acier galvanisé 500 × 500 mm
  2. Plaque cuivre 500 × 500 mm
  3. Plaque cuivre étamé
- Piquet de terre cuivre / acier (1 m, 2 m)
- Tresse de terre en cuivre nu 25 mm² / 35 mm²
- Conducteur de terre nu et vert/jaune
- Regard de visite de terre / Trappe
- Collier de mise à la terre pour tube
- Grillage avertisseur rouge

### Q

- Quadro / Prise tableau

### R

- Rail DIN
- Relais thermique, relais temporisé
- Répartiteur / Bornier de terre, bornier phase/neutre
- Résistance

### S

- Sectionneur porte-fusible
- Sonnette / Carillon
- Sonde de température
- Support appareillage

### T

- Tableau principal / Tableau secondaire
- Télérupteur
- Télévariateur / Dimmer
- Télérupteur connecté
- Transformateur 220 V/12 V, 220 V/24 V
- TGBT

### U

- UPS / Onduleur

### V

- Variateur de vitesse / Variateur de lumière
- Ventilateur VMC
- Voyant lumineux

### W

- Wattmètre

### X

- Xenon / Projecteur

## Mapping vers les 5 familles principales

### CONDUCTEURS

Inclure principalement :

- câbles RO2V, H07V-U, H07V-K, U1000R2V ;
- gaine ICTA / GTL ;
- canalisation, goulotte, chemin de câble ;
- jonction / manchon ;
- Wago / Domino ;
- conducteurs de terre quand utilisés comme conducteurs, avec tag `earth`.

### PROTECTION

Inclure principalement :

- disjoncteurs ;
- différentiels ;
- fusibles / HPC ;
- coupe-circuit / porte-fusible ;
- disjoncteur moteur ;
- sectionneur porte-fusible ;
- dispositifs de protection associés.

### COMMANDE

Inclure principalement :

- interrupteurs ;
- boutons poussoirs ;
- arrêt d'urgence ;
- contacteurs ;
- bobines ;
- relais thermiques / temporisés ;
- télérupteurs ;
- télévariateurs / dimmers ;
- automate programmable ;
- capteurs utilisés pour la commande ;
- inverseur de source ;
- délesteur ;
- variateurs.

### RÉCEPTION

Inclure principalement :

- ampoules / LED / spots / projecteurs ;
- prises et multiprises ;
- moteurs / pompes ;
- VMC ;
- sonnettes ;
- gâches électriques ;
- voyants ;
- appareils alimentés.

Les sources d'énergie, outils de mesure, coffrets et accessoires restent recherchables dans cette bibliothèque mais portent aussi un `domain` secondaire afin de conserver leur rôle technique réel.

### TERRE

Famille prioritaire :

- plaque acier galvanisé 500 × 500 mm ;
- plaque cuivre 500 × 500 mm ;
- plaque cuivre étamé ;
- piquets cuivre / acier 1 m et 2 m ;
- tresses cuivre nu 25 mm² / 35 mm² ;
- conducteur de terre nu / vert-jaune ;
- barrette de coupure de terre ;
- électrode de terre ;
- liaison équipotentielle ;
- regard / trappe ;
- collier de mise à la terre ;
- bornier de terre ;
- grillage avertisseur rouge.

## Stratégie d'intégration proposée

### Étape 1 — Revue électricien

Faire valider :

- noms et variantes ;
- bornes ;
- propriétés utiles ;
- règles de sécurité ;
- composants à fusionner/séparer ;
- ordre de priorité.

### Étape 2 — Catalogue riche sans simulation

Ajouter les composants comme données structurées avec recherche, filtre et métadonnées, mais les garder `CATALOG_ONLY` quand aucune règle électrique n'existe.

### Étape 3 — Connectivité

Définir progressivement :

- bornes ;
- propriétés ;
- compatibilité de connexion ;
- représentation 2D.

### Étape 4 — Validation déterministe

Passer seulement les composants testés à `VALIDATED`.

Priorité proposée :

```text
TERRE
→ PROTECTION
→ CONDUCTEURS
→ COMMANDE
→ RÉCEPTION
```

### Étape 5 — 3D

La future v0.6 doit lire la même définition de composant que la 2D.

Chaque composant pourra référencer un `model3d`, mais la 3D ne doit pas inventer de logique électrique différente du moteur.

## Règle importante

La liste de composants est maintenant intégrée à la planification d'ElectroLab AI, mais **elle ne modifie pas encore la certification v0.5**.

La revue électricien reste le gate avant l'expansion fonctionnelle et la v0.6.
