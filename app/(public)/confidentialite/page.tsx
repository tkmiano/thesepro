import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité et traitement des données personnelles — ThèsePro.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-[#1B3A6B]">{title}</h2>
      <div className="text-sm text-[#444] leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#1B3A6B]">Politique de confidentialité</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : 1er janvier 2025</p>
      </div>

      <Section title="1. Responsable du traitement">
        <p>
          ThèsePro SAS est responsable du traitement de vos données personnelles.
          Pour exercer vos droits ou pour toute question, contactez-nous à : <strong>privacy@thesepro.fr</strong>
        </p>
      </Section>

      <Section title="2. Données collectées">
        <p>Nous collectons les données suivantes :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Données d&apos;identification</strong> : nom, prénom, adresse email</li>
          <li><strong>Données de profil</strong> : photo, biographie, diplômes, compétences</li>
          <li><strong>Données de transaction</strong> : historique des commandes, montants</li>
          <li><strong>Données de paiement</strong> : traitées par Stripe (nous ne stockons pas vos données bancaires)</li>
          <li><strong>Données de navigation</strong> : adresse IP, cookies, pages visitées</li>
          <li><strong>Communications</strong> : messages échangés via la messagerie interne</li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        <p>Vos données sont utilisées pour :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Gérer votre compte et vous authentifier</li>
          <li>Traiter vos commandes et paiements</li>
          <li>Vous envoyer des notifications transactionnelles par email</li>
          <li>Améliorer nos services et l&apos;expérience utilisateur</li>
          <li>Assurer la sécurité et prévenir les fraudes</li>
          <li>Respecter nos obligations légales</li>
        </ul>
      </Section>

      <Section title="4. Base légale">
        <p>
          Le traitement de vos données repose sur : l&apos;exécution du contrat (fourniture des services),
          votre consentement (newsletters), nos intérêts légitimes (sécurité, amélioration des services)
          et nos obligations légales.
        </p>
      </Section>

      <Section title="5. Durée de conservation">
        <p>
          Vos données sont conservées pendant la durée de votre compte et 3 ans après sa suppression,
          sauf obligation légale imposant une durée plus longue (données comptables : 10 ans).
        </p>
      </Section>

      <Section title="6. Partage des données">
        <p>Vos données peuvent être partagées avec :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Stripe</strong> : traitement des paiements (politique Stripe applicable)</li>
          <li><strong>Supabase</strong> : hébergement de la base de données (serveurs en Europe)</li>
          <li><strong>Resend</strong> : envoi d&apos;emails transactionnels</li>
        </ul>
        <p>Nous ne vendons pas vos données à des tiers.</p>
      </Section>

      <Section title="7. Vos droits (RGPD)">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Droit d&apos;accès</strong> : obtenir une copie de vos données</li>
          <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
          <li><strong>Droit à l&apos;effacement</strong> : supprimer votre compte et vos données</li>
          <li><strong>Droit à la portabilité</strong> : exporter vos données</li>
          <li><strong>Droit d&apos;opposition</strong> : s&apos;opposer à certains traitements</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à <strong>privacy@thesepro.fr</strong>.
          Vous pouvez également déposer une réclamation auprès de la CNIL (cnil.fr).
        </p>
      </Section>

      <Section title="8. Cookies">
        <p>
          Nous utilisons des cookies strictement nécessaires au fonctionnement de la Plateforme
          (session d&apos;authentification). Aucun cookie publicitaire n&apos;est utilisé sans votre consentement.
        </p>
      </Section>

      <Section title="9. Sécurité">
        <p>
          Vos données sont protégées par des mesures techniques et organisationnelles appropriées :
          chiffrement TLS, authentification sécurisée, accès restreint aux données par rôle.
        </p>
      </Section>
    </div>
  )
}
