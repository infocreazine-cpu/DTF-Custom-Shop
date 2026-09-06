const Stripe = require('stripe');

const PRICES = {
  tshirt: 2500,
  sweat: 4000,
  cap: 2000,
  casquette: 2000,
  tote: 1500,
  mug: 1500,
  umbrella: 2500,
  parapluie: 2500
};

const LABELS = {
  tshirt: 'T-shirt Premium',
  sweat: 'Sweat à capuche',
  cap: 'Casquette',
  casquette: 'Casquette',
  tote: 'Tote Bag',
  mug: 'Mug personnalisé',
  umbrella: 'Parapluie',
  parapluie: 'Parapluie'
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Paiement Stripe non configuré' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const order = req.body || {};
    const items = Array.isArray(order.items) ? order.items : [];
    if (!items.length) return res.status(400).json({ error: 'Panier vide' });

    const line_items = items.map((item) => {
      const key = String(item.product || '').toLowerCase();
      const unitAmount = PRICES[key];
      if (!unitAmount) throw new Error(`Produit inconnu: ${key}`);
      const qty = Math.max(1, Math.min(99, Number(item.qty) || 1));
      return {
        quantity: qty,
        price_data: {
          currency: 'eur',
          unit_amount: unitAmount,
          product_data: {
            name: LABELS[key] || item.label || key,
            description: [item.zoneLabel, item.size].filter(Boolean).join(' · ')
          }
        }
      };
    });

    const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const customer = order.customer || {};
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: customer.email || undefined,
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
      metadata: {
        orderNumber: String(order.orderNumber || '').slice(0, 500)
      }
    });

    res.status(200).json({ url: session.url, id: session.id });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Impossible de créer le paiement' });
  }
};
