const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Paiement Stripe non configuré' });

  try {
    const sessionId = req.query && req.query.session_id;
    if (!sessionId) return res.status(400).json({ error: 'session_id manquant' });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.status(200).json({
      paid: session.payment_status === 'paid',
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      orderNumber: session.metadata && session.metadata.orderNumber ? session.metadata.orderNumber : ''
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Vérification impossible' });
  }
};
