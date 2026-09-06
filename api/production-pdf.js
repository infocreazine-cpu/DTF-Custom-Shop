const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  try {
    const order = req.body || {};
    if (!order.orderNumber || !Array.isArray(order.items) || !order.items.length) {
      return res.status(400).json({ error: 'Commande invalide' });
    }

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const pageSize = [595.28, 841.89];

    const drawHeader = (page) => {
      page.drawText('DTF CUSTOM SHOP - FICHE DE PRODUCTION', { x: 36, y: 805, size: 17, font: bold, color: rgb(0.03,0.15,0.36) });
      page.drawText(`Commande : ${order.orderNumber}`, { x: 36, y: 780, size: 11, font: bold });
      page.drawText(`Date : ${new Date(order.createdAt || Date.now()).toLocaleString('fr-FR')}`, { x: 36, y: 764, size: 9, font });
      const c = order.customer || {};
      page.drawText(`Client : ${c.first || ''} ${c.last || ''}`, { x: 36, y: 746, size: 10, font });
      page.drawText(`Email : ${c.email || ''}`, { x: 36, y: 731, size: 9, font });
      page.drawText(`Telephone : ${c.phone || ''}`, { x: 36, y: 716, size: 9, font });
      page.drawText(`Adresse : ${c.address || ''} ${c.zip || ''} ${c.city || ''}`, { x: 36, y: 701, size: 9, font });
      page.drawText(`Total : ${(Number(order.total)||0).toFixed(2)} EUR`, { x: 420, y: 746, size: 10, font: bold });
      page.drawLine({ start:{x:36,y:687}, end:{x:559,y:687}, thickness:1, color:rgb(.8,.85,.9) });
    };

    for (let idx = 0; idx < order.items.length; idx++) {
      const item = order.items[idx];
      const page = pdf.addPage(pageSize);
      drawHeader(page);
      let y = 658;
      page.drawText(`${idx + 1}. ${String(item.label || item.product || 'Produit')}`, { x:36, y, size:16, font:bold }); y -= 25;
      page.drawText(`Quantite : ${Math.max(1, Number(item.qty)||1)}`, { x:36, y, size:11, font }); y -= 18;
      if (item.size) { page.drawText(`Taille : ${String(item.size)}`, { x:36, y, size:11, font }); y -= 18; }
      if (item.color) { page.drawText(`Couleur : ${String(item.color)}`, { x:36, y, size:10, font }); y -= 18; }
      page.drawText(`Zone : ${String(item.zoneLabel || item.zone || '-')}`, { x:36, y, size:11, font:bold }); y -= 18;
      page.drawText(`Format maximum : ${String(item.limit || '-')}`, { x:36, y, size:10, font }); y -= 18;
      page.drawText(`Placement : X ${Number(item.x)||0}% / Y ${Number(item.y)||0}%`, { x:36, y, size:10, font }); y -= 18;
      page.drawText(`Echelle : ${Number(item.scale)||100}% / Rotation : ${Number(item.rotate)||0} deg`, { x:36, y, size:10, font }); y -= 24;
      page.drawText(`Prix ligne : ${(Number(item.lineTotal)||0).toFixed(2)} EUR`, { x:36, y, size:11, font:bold });

      if (item.art && /^data:image\/(png|jpeg|jpg);base64,/i.test(item.art)) {
        try {
          const m = item.art.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
          const bytes = Buffer.from(m[2], 'base64');
          const image = m[1].toLowerCase() === 'png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          const maxW = 470, maxH = 380;
          const scale = Math.min(maxW / image.width, maxH / image.height, 1);
          const w = image.width * scale, h = image.height * scale;
          page.drawRectangle({ x:36, y:80, width:523, height:410, borderWidth:1, borderColor:rgb(.8,.8,.8), color:rgb(.98,.98,.98) });
          page.drawText('VISUEL A IMPRIMER', { x:48, y:468, size:11, font:bold });
          page.drawImage(image, { x:36 + (523-w)/2, y:95 + (350-h)/2, width:w, height:h });
        } catch(e) {
          page.drawText('Visuel non integrable dans le PDF.', { x:36, y:450, size:10, font });
        }
      }
    }

    const bytes = await pdf.save();
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${String(order.orderNumber).replace(/[^a-zA-Z0-9_-]/g,'_')}-production.pdf"`);
    res.status(200).send(Buffer.from(bytes));
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erreur PDF' });
  }
};
