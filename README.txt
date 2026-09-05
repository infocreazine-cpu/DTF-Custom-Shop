DTF CUSTOM SHOP V45.2 — IA

IMPORTANT
Le fichier index.html ouvert directement depuis le téléphone (file://...) ne peut pas exécuter /api/generate-image.
Pour activer l'IA, il faut déployer le DOSSIER COMPLET.

VERCEL
1. Mettre tout le dossier sur GitHub.
2. Importer le dépôt dans Vercel.
3. Dans Settings > Environment Variables :
   OPENAI_API_KEY = votre clé OpenAI
4. Redéployer.
5. Ouvrir l'URL Vercel générée.

Le navigateur appellera alors :
/api/generate-image
/api/edit-image

La clé API n'est jamais stockée dans le HTML.


CORRECTION V45.2:
- vercel.json simplifié pour utiliser le runtime Node natif Vercel.
- Suppression de la déclaration runtime nodejs20.x qui provoquait l'erreur de compilation.
