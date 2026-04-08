'use server'

import {
  orderConfirmationTemplate,
  newOrderFreelanceTemplate,
  deliveryNotificationTemplate,
  paymentReleasedTemplate,
  welcomeTemplate,
  diplomaVerifiedTemplate,
  newMessageTemplate,
} from './templates'

// ── Transport ───────────────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.RESEND_FROM_EMAIL ?? 'ThèsePro <noreply@thesepro.fr>'

  if (!apiKey) {
    console.log('[Email — dev mode]', { to, subject })
    return
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({ from, to, subject, html })
  } catch (err) {
    console.error('[Email error]', err)
  }
}

// ── Emails transactionnels ──────────────────────────────────────────────────

export async function sendOrderConfirmationToClient({
  clientName,
  clientEmail,
  serviceTitle,
  orderId,
  amount,
  deliveryDays,
}: {
  clientName: string
  clientEmail: string
  serviceTitle: string
  orderId: string
  amount: number
  deliveryDays?: number
}) {
  await sendEmail({
    to:      clientEmail,
    subject: `✓ Commande confirmée — ${serviceTitle}`,
    html:    orderConfirmationTemplate({ clientName, serviceTitle, orderId, amount, deliveryDays }),
  })
}

export async function sendNewOrderToFreelance({
  freelanceName,
  freelanceEmail,
  serviceTitle,
  orderId,
  amount,
  clientName,
}: {
  freelanceName: string
  freelanceEmail: string
  serviceTitle: string
  orderId: string
  amount: number
  clientName?: string
}) {
  await sendEmail({
    to:      freelanceEmail,
    subject: `🛒 Nouvelle commande — ${serviceTitle}`,
    html:    newOrderFreelanceTemplate({
      freelanceName,
      serviceTitle,
      orderId,
      amount,
      clientName: clientName ?? 'Un client',
    }),
  })
}

export async function sendDeliveryNotificationToClient({
  clientName,
  clientEmail,
  serviceTitle,
  orderId,
}: {
  clientName: string
  clientEmail: string
  serviceTitle: string
  orderId: string
}) {
  await sendEmail({
    to:      clientEmail,
    subject: `📦 Livraison disponible — ${serviceTitle}`,
    html:    deliveryNotificationTemplate({ clientName, serviceTitle, orderId }),
  })
}

export async function sendPaymentReleasedToFreelance({
  freelanceName,
  freelanceEmail,
  serviceTitle,
  amount,
}: {
  freelanceName: string
  freelanceEmail: string
  serviceTitle: string
  amount: number
}) {
  await sendEmail({
    to:      freelanceEmail,
    subject: `✅ Paiement libéré — ${(amount / 100).toFixed(2)} €`,
    html:    paymentReleasedTemplate({ freelanceName, serviceTitle, amount }),
  })
}

export async function sendWelcomeEmail({
  name,
  email,
  role,
}: {
  name: string
  email: string
  role: 'client' | 'freelance' | 'both'
}) {
  await sendEmail({
    to:      email,
    subject: '🎓 Bienvenue sur ThèsePro !',
    html:    welcomeTemplate({ name, role }),
  })
}

export async function sendDiplomaVerifiedEmail({
  freelanceName,
  freelanceEmail,
}: {
  freelanceName: string
  freelanceEmail: string
}) {
  await sendEmail({
    to:      freelanceEmail,
    subject: '✓ Votre diplôme a été vérifié — ThèsePro',
    html:    diplomaVerifiedTemplate({ freelanceName }),
  })
}

export async function sendNewMessageEmail({
  recipientName,
  recipientEmail,
  senderName,
  preview,
  conversationId,
  role,
}: {
  recipientName: string
  recipientEmail: string
  senderName: string
  preview: string
  conversationId: string
  role: 'client' | 'freelance'
}) {
  await sendEmail({
    to:      recipientEmail,
    subject: `💬 Nouveau message de ${senderName}`,
    html:    newMessageTemplate({ recipientName, senderName, preview, conversationId, role }),
  })
}
