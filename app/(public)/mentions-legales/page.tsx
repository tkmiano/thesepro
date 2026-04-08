import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de la plateforme ThèsePro.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-[#1B3A6B]">{title}</h2>
      <div className="text-sm text-[#444] leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#1B3A6B]">Mentions légales</h1>
        <p className="text-sm text-muted-foreground">Conformément aux dispositions de la loi n°2004-575 du 21 juin 2004</p>
      </div>

      <Section title="Éditeur du site">
        <table className="text-sm w-full">
          <tbody className="divide-y divide-gray-100">
            {[
              ['Société',           'ThèsePro SAS'],
              ['Forme juridique',   'Société par Actions Simplifiée (SAS)'],
              ['Capital social',    '10 000 €'],
              ['SIRET',             '123 456 789 00010 (fictif)'],
              ['RCS',               'Paris B 123 456 789'],
              ['Siège social',      '1 rue de la République, 75001 Paris, France'],
              ['Email',             'contact@thesepro.fr'],
              ['Directeur de la publication', 'Le Président de ThèsePro SAS'],
            ].map(([k, v]) => (
              <tr key={k}>
                <td className="py-2 text-muted-foreground pr-4 font-medium w-1/2">{k}</td>
                <td className="py-2 text-[#333]">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Hébergement">
        <table className="text-sm w-full">
          <tbody className="divide-y divide-gray-100">
            {[
              ['Hébergeur',       'Vercel Inc.'],
              ['Adresse',         '440 N Barranca Ave #4133, Covina, CA 91723, USA'],
              ['Site web',        'vercel.com'],
              ['Base de données', 'Supabase (serveurs en Europe)'],
            ].map(([k, v]) => (
              <tr key={k}>
                <td className="py-2 text-muted-foreground pr-4 font-medium w-1/2">{k}</td>
                <td className="py-2 text-[#333]">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des contenus présents sur le site ThèsePro (textes, images, logos, icônes, structure)
          sont la propriété exclusive de ThèsePro SAS et sont protégés par les lois françaises et
          internationales relatives à la propriété intellectuelle.
        </p>
        <p>
          Toute reproduction, représentation, modification, publication ou transmission de tout ou partie
          de ces éléments, par quelque procédé que ce soit, est interdite sans l&apos;autorisation expresse
          de ThèsePro SAS.
        </p>
      </Section>

      <Section title="Liens hypertextes">
        <p>
          Le site peut contenir des liens vers des sites tiers. ThèsePro SAS n&apos;exerce aucun contrôle
          sur ces sites et décline toute responsabilité quant à leur contenu.
        </p>
      </Section>

      <Section title="Droit applicable">
        <p>
          Le présent site est soumis au droit français. En cas de litige, les tribunaux compétents
          seront ceux de Paris, sauf disposition légale impérative contraire.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Pour toute question, vous pouvez nous contacter à :{' '}
          <strong>contact@thesepro.fr</strong>
        </p>
      </Section>
    </div>
  )
}
