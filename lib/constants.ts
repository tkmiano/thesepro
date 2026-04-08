export const CATEGORIES = [
  { value: 'correction-revision',      label: 'Correction & Révision',       icon: '✏️' },
  { value: 'redaction-academique',     label: 'Rédaction Académique',         icon: '📝' },
  { value: 'statistiques-analyse',     label: 'Statistiques & Analyse',       icon: '📊' },
  { value: 'tutorat-coaching',         label: 'Tutorat & Coaching',           icon: '🎓' },
  { value: 'traduction-academique',    label: 'Traduction Académique',        icon: '🌐' },
  { value: 'publication-scientifique', label: 'Publication Scientifique',     icon: '📚' },
] as const

export type CategoryValue = typeof CATEGORIES[number]['value']

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.value, c.label])
)

export const SUBCATEGORIES: Record<string, string[]> = {
  'correction-revision':      ['Orthographe & grammaire', 'Style & clarté', 'Mise en forme APA/MLA', 'Relecture globale'],
  'redaction-academique':     ['Introduction & conclusion', 'Chapitre de thèse', 'Mémoire complet', 'Article scientifique'],
  'statistiques-analyse':     ['SPSS', 'R', 'Python', 'Stata', 'Analyse qualitative', 'Méta-analyse'],
  'tutorat-coaching':         ['Méthodologie', 'Suivi régulier', 'Préparation soutenance', 'Plan de recherche'],
  'traduction-academique':    ['FR→EN', 'EN→FR', 'Multilingue', 'Résumé bilingue'],
  'publication-scientifique': ['Préparation soumission', 'Réponse reviewers', 'Mise en forme journal'],
}

export const LANGUAGES = [
  'Français', 'Anglais', 'Espagnol', 'Allemand', 'Arabe',
  'Portugais', 'Italien', 'Mandarin', 'Japonais', 'Russe',
]

export const ACADEMIC_DISCIPLINES = [
  'Droit', 'Économie', 'Gestion', 'Finance', 'Marketing',
  'Sociologie', 'Psychologie', 'Histoire', 'Géographie', 'Sciences politiques',
  'Philosophie', 'Linguistique', 'Littérature', 'Médecine', 'Santé publique',
  'Biologie', 'Chimie', 'Physique', 'Mathématiques', 'Informatique',
  "Sciences de l'éducation", 'Architecture', 'Urbanisme',
]

export const SORT_OPTIONS = [
  { value: 'newest',    label: 'Plus récents' },
  { value: 'rating',    label: 'Mieux notés' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc',label: 'Prix décroissant' },
]
