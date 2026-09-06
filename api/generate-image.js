
module.exports = async function handler(req,res){
module.exports = async function handler(req, res) {
  // Toujours répondre en JSON pour afficher l'erreur exacte dans la borne
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée. Utilisez POST.",
      code: "METHOD_NOT_ALLOWED"
    });
  }

  const { prompt } = req.body || {};

  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({
      error: "Le prompt est vide. Décrivez d’abord l’image à générer.",
      code: "PROMPT_REQUIRED"
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error:
        "Clé OpenAI absente sur Vercel : ajoutez OPENAI_API_KEY dans les variables d’environnement puis redéployez.",
      code: "OPENAI_API_KEY_MISSING"
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: "Bearer " + process.env.OPENAI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-image-2",
          prompt:
            String(prompt).trim() +
            "\nSujet centré, contours propres, sans mockup ni cadre, fond transparent si pertinent.",
          size: "1024x1024",
          quality: "medium",
          background: "transparent"
        })
      }
    );

    const raw = await response.text();

    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (_) {
      return res.status(502).json({
        error: "OpenAI a renvoyé une réponse illisible.",
        code: "OPENAI_INVALID_RESPONSE",
        httpStatus: response.status,
        details: raw ? raw.slice(0, 500) : "Réponse vide"
      });
    }

    if (!response.ok) {
      const apiError = data && data.error ? data.error : {};
      const apiCode = String(
        apiError.code || apiError.type || ""
      ).toLowerCase();

      const apiMessage = String(
        apiError.message || "Erreur OpenAI inconnue"
      );

      let friendly = "Erreur OpenAI : " + apiMessage;
      let code = "OPENAI_ERROR";

      if (
        response.status === 401 ||
        apiCode.includes("invalid_api_key")
      ) {
        friendly =
          "Clé OpenAI invalide ou expirée. Vérifiez OPENAI_API_KEY dans Vercel.";
        code = "OPENAI_INVALID_API_KEY";
      }

      else if (
        response.status === 429 &&
        (
          apiCode.includes("insufficient_quota") ||
          apiMessage.toLowerCase().includes("quota") ||
          apiMessage.toLowerCase().includes("billing")
        )
      ) {
        friendly =
          "Quota OpenAI insuffisant ou facturation API inactive. Vérifiez le crédit et la facturation de votre compte API.";
        code = "OPENAI_QUOTA_OR_BILLING";
      }

      else if (response.status === 429) {
        friendly =
          "Limite de requêtes OpenAI atteinte. Réessayez dans quelques instants.";
        code = "OPENAI_RATE_LIMIT";
      }

      else if (
        response.status === 403 ||
        apiCode.includes("model_not_found") ||
        apiCode.includes("permission") ||
        apiMessage.toLowerCase().includes("not have access") ||
        apiMessage.toLowerCase().includes("model")
      ) {
        friendly =
          "Le modèle d’image n’est pas autorisé pour cette clé ou ce projet OpenAI. Vérifiez l’accès à gpt-image-2.";
        code = "OPENAI_MODEL_ACCESS";
      }

      else if (response.status === 400) {
        friendly =
          "Requête refusée par OpenAI : " + apiMessage;
        code = "OPENAI_BAD_REQUEST";
      }

      else if (response.status >= 500) {
        friendly =
          "Service OpenAI temporairement indisponible. Réessayez dans quelques instants.";
        code = "OPENAI_SERVER_ERROR";
      }

      return res.status(response.status).json({
        error: friendly,
        code,
        httpStatus: response.status,
        openaiCode: apiError.code || null,
        openaiType: apiError.type || null,
        details: apiMessage,
        requestId:
          response.headers.get("x-request-id") || null
      });
    }

    const first =
      data && Array.isArray(data.data)
        ? data.data[0]
        : null;

    const image = first?.b64_json
      ? "data:image/png;base64," + first.b64_json
      : first?.url;

    if (!image) {
      return res.status(502).json({
        error:
          "OpenAI n’a renvoyé aucune image exploitable.",
        code: "OPENAI_NO_IMAGE",
        details: data
      });
    }

    return res.status(200).json({
      image,
      code: "OK",
      model: "gpt-image-2"
    });

  } catch (err) {

    if (err && err.name === "AbortError") {
      return res.status(504).json({
        error:
          "La génération a dépassé 90 secondes. Réessayez.",
        code: "OPENAI_TIMEOUT"
      });
    }

    return res.status(500).json({
      error:
        "Erreur Vercel / serveur : " +
        (err?.message || "erreur inconnue"),
      code: "VERCEL_SERVER_ERROR"
    });

  } finally {
    clearTimeout(timeout);
  }
};
