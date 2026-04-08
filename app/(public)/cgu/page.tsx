import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation',
  description: 'Conditions Générales d\'Utilisation de la plateforme ThèsePro.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-[#1B3A6B]">{title}</h2>
      <div className="text-sm text-[#444] leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function CGUPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#1B3A6B]">Conditions Générales d&apos;Utilisation</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : 1er janvier 2025</p>
      </div>

      <Section title="1. Objet">
        <p>
          Les présentes Conditions Générales d&apos;Utilisation (ci-après &ldquo;CGU&rdquo;) régissent l&apos;accès et
          l&apos;utilisation de la plateforme ThèsePro accessible à l&apos;adresse thesepro.fr (ci-après &ldquo;la Plateforme&rdquo;),
          exploitée par ThèsePro SAS.
        </p>
        <p>
          ThèsePro est une marketplace mettant en relation des clients recherchant des services académiques
          (rédaction, correction, statistiques, etc.) avec des freelances experts dans ces domaines.
        </p>
      </Section>

      <Section title="2. Acceptation des CGU">
        <p>
          L&apos;accès et l&apos;utilisation de la Plateforme impliquent l&apos;acceptation pleine et entière des présentes CGU.
          Si vous n&apos;acceptez pas ces conditions, vous ne pouvez pas utiliser la Plateforme.
        </p>
      </Section>

      <Section title="3. Inscription et compte utilisateur">
        <p>Pour utiliser les services de ThèsePro, vous devez créer un compte en fournissant :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Votre nom complet</li>
          <li>Une adresse email valide</li>
          <li>Un mot de passe sécurisé (minimum 8 caractères)</li>
          <li>Votre rôle sur la plateforme (client, freelance, ou les deux)</li>
        </ul>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.
        </p>
      </Section>

      <Section title="4. Services proposés">
        <p>
          ThèsePro permet aux clients de commander des services académiques auprès de freelances vérifiés.
          Les services disponibles incluent notamment : rédaction académique, correction et révision, analyse statistique,
          tutorat, traduction académique et aide à la publication scientifique.
        </p>
        <p>
          ThèsePro agit en tant qu&apos;intermédiaire et n&apos;est pas partie au contrat entre le client et le freelance.
          ThèsePro prélève une commission de 20% sur chaque transaction réalisée sur la Plateforme.
        </p>
      </Section>

      <Section title="5. Paiements et remboursements">
        <p>
          Les paiements sont traités de manière sécurisée via Stripe. Le montant est débité lors de la commande
          et conservé en séquestre jusqu&apos;à la validation de la livraison par le client.
        </p>
        <p>
          En cas de litige, ThèsePro peut intervenir pour arbitrer et décider du remboursement ou du
          déblocage des fonds en faveur du freelance.
        </p>
      </Section>

      <Section title="6. Obligations des utilisateurs">
        <p>Les utilisateurs s&apos;engagent à :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Fournir des informations exactes et à jour</li>
          <li>Ne pas usurper l&apos;identité d&apos;autrui</li>
          <li>Ne pas utiliser la Plateforme à des fins illicites</li>
          <li>Ne pas contourner les mécanismes de paiement de la Plateforme</li>
          <li>Respecter les droits de propriété intellectuelle</li>
          <li>Ne pas communiquer leurs coordonnées personnelles via la messagerie interne</li>
        </ul>
      </Section>

      <Section title="7. Propriété intellectuelle">
        <p>
          Les travaux réalisés par les freelances dans le cadre d&apos;une commande sont cédés au client
          lors du déblocage du paiement, sauf accord contraire mentionné dans la description du service.
        </p>
      </Section>

      <Section title="8. Responsabilité">
        <p>
          ThèsePro s&apos;efforce d&apos;assurer la disponibilité et la qualité de la Plateforme mais ne peut être tenu
          responsable des interruptions de service, des actes des utilisateurs, ou de la qualité des travaux
          fournis par les freelances.
        </p>
      </Section>

      <Section title="9. Résiliation">
        <p>
          ThèsePro se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU,
          sans préavis ni remboursement.
        </p>
      </Section>

      <Section title="10. Droit applicable">
        <p>
          Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux français seront compétents.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Pour toute question relative aux présentes CGU, vous pouvez nous contacter à l&apos;adresse :
          <strong> contact@thesepro.fr</strong>
        </p>
      </Section>
    </div>
  )
}
