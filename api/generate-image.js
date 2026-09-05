
module.exports = async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Méthode non autorisée"});
  const {prompt}=req.body||{};
  if(!prompt) return res.status(400).json({error:"Prompt requis"});
  if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:"OPENAI_API_KEY absente côté serveur"});
  try{
    const r=await fetch("https://api.openai.com/v1/images/generations",{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+process.env.OPENAI_API_KEY,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"gpt-image-2",
        prompt:prompt+"\nSujet centré, contours propres, sans mockup ni cadre, fond transparent si pertinent.",
        size:"1024x1024",
        quality:"medium",
        background:"transparent"
      })
    });
    const d=await r.json();
    if(!r.ok) return res.status(r.status).json({error:d?.error?.message||"Erreur OpenAI"});
    const x=d.data?.[0];
    const image=x?.b64_json ? "data:image/png;base64,"+x.b64_json : x?.url;
    if(!image) return res.status(502).json({error:"Aucune image renvoyée"});
    return res.status(200).json({image});
  }catch(e){
    return res.status(500).json({error:e.message||"Erreur serveur"});
  }
