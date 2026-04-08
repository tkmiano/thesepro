// ── Base layout ────────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thesepro.fr'

function emailLayout(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ThèsePro</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:'Inter',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header logo -->
          <tr>
            <td style="padding:0 0 24px 0;" align="center">
              <a href="${APP_URL}" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:700;color:#1B3A6B;letter-spacing:-0.5px;">📚 ThèsePro</span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;">
                © ${new Date().getFullYear()} ThèsePro · La référence de l'accompagnement académique<br/>
                <a href="${APP_URL}/confidentialite" style="color:#999;text-decoration:underline;">Politique de confidentialité</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/cgu" style="color:#999;text-decoration:underline;">CGU</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#1B3A6B;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;margin-top:8px;">${label}</a>`
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1B3A6B;">${text}</h1>`
}

function p(text: string, muted = false): string {
  const color = muted ? '#888' : '#444'
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${color};">${text}</p>`
}

function amountBadge(amount: number): string {
  return `<p style="margin:0 0 24px;font-size:24px;font-weight:700;color:#1B3A6B;">${(amount / 100).toFixed(2)} €</p>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #E8E8E8;margin:24px 0;" />`
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#888;width:50%;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#333;font-weight:500;">${value}</td>
  </tr>`
}

// ── Templates ──────────────────────────────────────────────────────────────

export function orderConfirmationTemplate({
  clientName,
  serviceTitle,
  orderId,
  amount,
  deliveryDays,
}: {
  clientName: string
  serviceTitle: string
  orderId: string
  amount: number
  deliveryDays?: number
}): string {
  const orderUrl = `${APP_URL}/client/orders/${orderId}`
  return emailLayout(
    `
      ${h1('Commande confirmée ✓')}
      ${p(`Bonjour ${clientName},`)}
      ${p(`Votre paiement a bien été reçu. Le freelance a été notifié et va démarrer votre commande dans les plus brefs délais.`)}
      ${divider()}
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Service', serviceTitle)}
        ${infoRow('Montant payé', `${(amount / 100).toFixed(2)} €`)}
        ${deliveryDays ? infoRow('Délai convenu', `${deliveryDays} jour${deliveryDays > 1 ? 's' : ''}`) : ''}
        ${infoRow('Référence', `#${orderId.slice(0, 8).toUpperCase()}`)}
      </table>
      ${divider()}
      ${ctaButton('Suivre ma commande →', orderUrl)}
      ${p('Si vous avez des questions, contactez-nous via la messagerie intégrée.', true)}
    `,
    `Votre commande ${serviceTitle} a été confirmée.`,
  )
}

export function newOrderFreelanceTemplate({
  freelanceName,
  serviceTitle,
  orderId,
  amount,
  clientName,
}: {
  freelanceName: string
  serviceTitle: string
  orderId: string
  amount: number
  clientName: string
}): string {
  const orderUrl = `${APP_URL}/freelance/orders/${orderId}`
  return emailLayout(
    `
      ${h1('Nouvelle commande reçue 🛒')}
      ${p(`Bonjour ${freelanceName},`)}
      ${p(`Bonne nouvelle ! <strong>${clientName}</strong> vient de passer une commande pour votre service.`)}
      ${divider()}
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Service', serviceTitle)}
        ${infoRow('Votre gain net', `${(Math.round(amount * 0.8) / 100).toFixed(2)} €`)}
        ${infoRow('Référence', `#${orderId.slice(0, 8).toUpperCase()}`)}
      </table>
      ${divider()}
      ${ctaButton('Voir la commande →', orderUrl)}
      ${p('Commencez dès maintenant pour garantir les délais.', true)}
    `,
    `Nouvelle commande pour ${serviceTitle}`,
  )
}

export function deliveryNotificationTemplate({
  clientName,
  serviceTitle,
  orderId,
}: {
  clientName: string
  serviceTitle: string
  orderId: string
}): string {
  const orderUrl = `${APP_URL}/client/orders/${orderId}`
  return emailLayout(
    `
      ${h1('Votre livraison est disponible 📦')}
      ${p(`Bonjour ${clientName},`)}
      ${p(`Le freelance a livré votre commande <strong>${serviceTitle}</strong>. Vous pouvez maintenant consulter le travail et le valider.`)}
      ${divider()}
      <p style="margin:0 0 8px;font-size:13px;color:#888;">Vous disposez de 2 options :</p>
      <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#444;line-height:1.8;">
        <li><strong>Valider</strong> pour libérer le paiement au freelance</li>
        <li><strong>Demander une révision</strong> si le travail nécessite des ajustements</li>
      </ul>
      ${ctaButton('Voir la livraison →', orderUrl)}
    `,
    `La livraison de ${serviceTitle} est prête.`,
  )
}

export function paymentReleasedTemplate({
  freelanceName,
  serviceTitle,
  amount,
}: {
  freelanceName: string
  serviceTitle: string
  amount: number
}): string {
  return emailLayout(
    `
      ${h1('Paiement libéré ✅')}
      ${p(`Bonjour ${freelanceName},`)}
      ${p(`Le client a validé votre livraison pour <strong>${serviceTitle}</strong>. Votre paiement a été libéré.`)}
      ${divider()}
      <p style="margin:0 0 4px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Montant reçu</p>
      ${amountBadge(amount)}
      ${p('Les fonds seront disponibles dans votre compte Stripe sous 2–5 jours ouvrés selon votre banque.', true)}
      ${ctaButton('Voir mon wallet →', `${APP_URL}/freelance/wallet`)}
    `,
    `Paiement de ${(amount / 100).toFixed(2)} € libéré pour ${serviceTitle}`,
  )
}

export function welcomeTemplate({
  name,
  role,
}: {
  name: string
  role: 'client' | 'freelance' | 'both'
}): string {
  const dashboardUrl = role === 'client'
    ? `${APP_URL}/client/dashboard`
    : `${APP_URL}/freelance/dashboard`

  const roleMsg = role === 'client'
    ? 'Vous pouvez dès maintenant explorer notre catalogue et commander des services.'
    : role === 'freelance'
    ? 'Vous pouvez dès maintenant créer votre profil et publier vos services.'
    : 'Vous avez accès à l\'espace client et à l\'espace freelance.'

  return emailLayout(
    `
      ${h1(`Bienvenue sur ThèsePro 🎓`)}
      ${p(`Bonjour ${name},`)}
      ${p(`Votre compte a été créé avec succès. ${roleMsg}`)}
      ${divider()}
      <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#444;line-height:2;">
        <li>Experts académiques <strong>diplômés et vérifiés</strong></li>
        <li>Paiement <strong>sécurisé</strong> — libéré uniquement après validation</li>
        <li>Support par <strong>messagerie intégrée</strong></li>
      </ul>
      ${ctaButton('Accéder à mon espace →', dashboardUrl)}
    `,
    `Bienvenue sur ThèsePro, ${name} !`,
  )
}

export function diplomaVerifiedTemplate({
  freelanceName,
}: {
  freelanceName: string
}): string {
  return emailLayout(
    `
      ${h1('Diplôme vérifié ✓')}
      ${p(`Bonjour ${freelanceName},`)}
      ${p(`Bonne nouvelle ! Notre équipe a vérifié et validé votre diplôme. Votre profil affiche désormais le badge <strong style="color:#C9963A;">Diplôme vérifié</strong>.`)}
      ${p('Ce badge augmente la confiance des clients et améliore votre visibilité sur la plateforme.')}
      ${divider()}
      ${ctaButton('Voir mon profil →', `${APP_URL}/freelance/settings`)}
    `,
    'Votre diplôme a été vérifié sur ThèsePro.',
  )
}

export function newMessageTemplate({
  recipientName,
  senderName,
  preview,
  conversationId,
  role,
}: {
  recipientName: string
  senderName: string
  preview: string
  conversationId: string
  role: 'client' | 'freelance'
}): string {
  const convUrl = `${APP_URL}/${role}/messages/${conversationId}`
  const safePreview = preview.length > 120 ? preview.slice(0, 117) + '…' : preview
  return emailLayout(
    `
      ${h1('Nouveau message 💬')}
      ${p(`Bonjour ${recipientName},`)}
      ${p(`<strong>${senderName}</strong> vous a envoyé un message :`)}
      <blockquote style="margin:0 0 24px;padding:12px 16px;background:#F5F7FF;border-left:3px solid #1B3A6B;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:14px;color:#333;font-style:italic;">${safePreview}</p>
      </blockquote>
      ${ctaButton('Répondre →', convUrl)}
    `,
    `Message de ${senderName}`,
  )
}
