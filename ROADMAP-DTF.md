# DTF Custom Shop — Feuille de route

## Objectif
Transformer le prototype actuel en borne interactive DTF avec IA, fiable, exploitable en magasin et commercialisable.

## 1. Fiabiliser le configurateur DTF
Stabiliser le parcours : produit → taille/couleur → zone d’impression → visuel → déplacement/zoom/rotation → aperçu → validation. Une fois validé, figer temporairement la charte graphique.

## 2. IA fonctionnelle
- « Créer mon visuel avec l’IA » depuis un prompt.
- « Modifier mon image avec l’IA » depuis une image importée.
- Détourage/suppression du fond.
- Contrôle de résolution.
- Conservation du fichier HD.
- Appels IA côté serveur Vercel, aucune clé API dans le navigateur.
- Finaliser les crédits/coûts API une fois le parcours stable.

## 3. Aperçu client et fichier production séparés
L’aperçu sert au client ; la production reçoit un fichier HD indépendant, aux dimensions réelles, en conservant les proportions.

- Côté cœur : 15 × 15 cm max.
- Dos : 30 × 40 cm max.
- Manche : 10 × 10 cm max.

## 4. Panier et commande
Produit, couleur, taille, emplacement, quantité, options, impression, éventuel supplément IA, total, numéro de commande et récapitulatif.

## 5. Back-office production
Commandes à produire / en cours / terminées, aperçu, textile, couleur, taille, quantité, emplacement, dimensions, fichier HD téléchargeable et possibilité de relancer une production.

## 6. Architecture commerciale et sécurité
IA, paiement, génération des fichiers et stockage côté serveur. Base de données commandes, stockage créations, contrôles anti-abus, journalisation des erreurs et politique de suppression des fichiers clients.

## 7. Mode borne
Plein écran tactile, gros boutons, navigation simple, retour automatique à l’accueil après inactivité, protection Android/Windows, redémarrage automatique, administration protégée et gestion des pertes de connexion.

## 8. Paiement
Intégrer le terminal/solution de paiement. Après confirmation : verrouillage de la commande, génération des fichiers de production, numéro ou QR code de commande.

## 9. Commercialisation
CGV, confidentialité/RGPD, conservation des images, droits sur les visuels importés/générés, tarifs/marges, catalogue administrable, statistiques et architecture multi-boutiques.

## 10. Parcours prioritaire à valider
**T-shirt → Couleur → Créer avec l’IA → Aperçu → Placement → Validation → Fichier DTF de production**

Ce parcours doit fonctionner de bout en bout avant les fonctions commerciales avancées.

## Phases
- **Phase A — maintenant :** stabilité configurateur + IA fonctionnelle.
- **Phase B :** fichier DTF production + commandes + back-office.
- **Phase C :** paiement + mode borne + sécurisation.
- **Phase D :** tests terrain + juridique + multi-boutiques + commercialisation.

## Prochaine étape
Auditer l’intégration IA actuelle de DTF-Custom-Shop, remettre la génération d’image en fonctionnement sans modifier le design validé, puis tester le parcours complet jusqu’à l’aperçu.
