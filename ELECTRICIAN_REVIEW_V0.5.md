# ElectroLab AI — Revue électricien v0.5

**Préparé : 2026-10-06**

## Objectif

Cette revue doit tester ElectroLab AI comme produit électrique/pédagogique **sans IA** avant tout démarrage de la v0.6 3D.

URL publique à tester :

```text
https://electro-lab-ai.vercel.app
```

La revue se fait uniquement dans ElectroLab AI. **Aucune manipulation sur une installation électrique réelle n'est demandée.**

Pour chaque test, noter :

- ✅ Correct
- ⚠️ À corriger
- ❌ Faux ou dangereux

Ajouter une courte explication et, si possible, une capture d'écran quand quelque chose paraît faux, incomplet ou dangereux.

## Plan de test

1. Ouvrir l'application et vérifier que l'interface générale est compréhensible.
2. Vérifier la bibliothèque des composants existants.
3. Tester la recherche et le filtrage de composants.
4. Placer plusieurs composants dans l'espace de travail.
5. Modifier les propriétés disponibles d'un composant.
6. Tester les bornes et connexions entre composants.
7. Construire un circuit lampe valide et vérifier qu'il est accepté.
8. Retirer la phase d'un circuit lampe et vérifier que l'erreur est détectée.
9. Retirer le neutre d'un circuit lampe et vérifier que l'erreur est détectée.
10. Vérifier le calcul lampe I = P / U sur un cas simple.
11. Mettre une protection inférieure au courant estimé de la lampe et vérifier l'avertissement.
12. Construire une prise protégée valide.
13. Retirer le PE de la prise et vérifier la détection.
14. Retirer le neutre de la prise et vérifier la détection.
15. Retirer le différentiel de la prise et vérifier la réaction du système.
16. Retirer la protection contre les surintensités de la prise et vérifier la réaction.
17. Tester plusieurs calibres de protection.
18. Tester les sensibilités différentielles disponibles.
19. Ouvrir et réaliser l'exercice lampe.
20. Ouvrir et réaliser l'exercice prise.
21. Vérifier le suivi des tentatives, du résultat et de la progression.
22. Sauvegarder puis recharger un projet et vérifier qu'aucune donnée utile n'est perdue.
23. Vérifier les propriétés du transformateur : primaire, secondaire et VA.
24. Construire un primaire transformateur valide.
25. Créer une incohérence entre tension source et primaire transformateur et vérifier la détection.
26. Tester le secondaire supporté : S1 → disjoncteur → interrupteur → lampe, retour S2. Exemple : 60 W sous 24 V doit donner environ 2,5 A.
27. Vérifier que les courants primaire et secondaire ne sont pas additionnés comme s'ils appartenaient au même domaine de tension.
28. Mettre une charge en W supérieure à la puissance nominale du transformateur en VA, vérifier l'avertissement et indiquer comment cette règle devrait être améliorée professionnellement.
29. Tester le scénario Relais NO + lampe supporté.
30. Mettre une tension de bobine relais incompatible avec la source et vérifier la détection.
31. Tester/inspecter l'utilisation du contact NC. Le système le déclare actuellement non supporté : indiquer comment il devrait être modélisé plus tard.
32. Tester le scénario contacteur + moteur monophasé supporté.
33. Vérifier la saisie du courant nominal moteur depuis la plaque signalétique.
34. Retirer le PE du moteur et vérifier la détection.
35. Retirer le neutre du moteur et vérifier la détection.
36. Mettre une mauvaise tension moteur et vérifier la détection.
37. Mettre une mauvaise tension de bobine contacteur et vérifier la détection.
38. Mettre un contacteur sous-dimensionné par rapport au courant nominal moteur et vérifier la détection.
39. Mettre un disjoncteur inférieur au courant nominal moteur et indiquer si le contrôle actuel est trop simplifié.
40. Examiner les limites moteur actuellement indiquées : courant de démarrage, facteur de puissance, rendement, coordination thermique et protections moteur non complètement modélisés.
41. Vérifier la qualité et la compréhension des messages d'erreur et avertissements.
42. Chercher des faux positifs : circuit réellement correct mais refusé.
43. Chercher des faux négatifs : circuit incorrect ou dangereux mais accepté.
44. Lister les règles électriques importantes encore manquantes, par exemple sections de conducteurs, chute de tension, court-circuit, surcharge, sélectivité, protection moteur, régimes de terre, pouvoir de coupure, etc. Cette liste n'est pas exhaustive.
45. Lister les composants importants encore absents.
46. Donner un verdict global :
   - A — faux/dangereux ;
   - B — trop simplifié ;
   - C — éléments essentiels manquants ;
   - D — globalement correct ;
   - E — suffisamment solide pour continuer vers la 3D.
   
   Préciser surtout s'il faut corriger le moteur électrique/validateur avant de démarrer la 3D.

## Annexe — Nouvelle bibliothèque proposée par le propriétaire

Une extension majeure de la bibliothèque (>85 composants) est maintenant prévue. Elle n'est **pas encore activée dans le moteur v0.5** afin de ne pas modifier la base que vous êtes en train d'évaluer.

Merci de signaler notamment :

- les composants manquants ou inutiles ;
- les noms à corriger ;
- les variantes qui doivent être séparées ;
- les bornes électriques attendues ;
- les propriétés à demander à l'utilisateur ;
- les composants qui nécessitent des règles de validation spécifiques ;
- les composants liés à la mise à la terre à traiter en priorité.

La liste détaillée est conservée dans `COMPONENT_LIBRARY_EXPANSION.md`.

## Règle de décision

La v0.6 3D ne commence pas avant réception et triage de cette revue.

Les erreurs électriques importantes doivent être corrigées dans le moteur déterministe avant d'ajouter une représentation 3D.
