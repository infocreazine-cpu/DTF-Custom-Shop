export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "Prompt manquant"
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY manquante dans Vercel"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-image-2",
          prompt: prompt.trim(),
          size: "1024x1024",
          quality: "medium"
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur OpenAI:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Erreur pendant la génération de l'image"
      });
    }

    const base64 = data?.data?.[0]?.b64_json;

    if (!base64) {
      console.error("Réponse OpenAI inattendue:", data);

      return res.status(500).json({
        error: "Aucune image reçue depuis OpenAI"
      });
    }

    const image = `data:image/png;base64,${base64}`;

    return res.status(200).json({
      image: image
    });

  } catch (error) {
    console.error("Erreur generate-image:", error);

    return res.status(500).json({
      error: error?.message || "Erreur serveur"
    });
  }
}
