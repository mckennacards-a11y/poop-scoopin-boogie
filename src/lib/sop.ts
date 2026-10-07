/** Checklist shown on every job. Every box must be ticked before photos unlock. */
export const ARRIVAL_CHECKLIST = [
  { key: 'bleach', label: 'Fresh bleach mix in the car today' },
  { key: 'dogcheck', label: 'Looked over the fence and made noise' },
  { key: 'dogsafe', label: 'No dog out, or only a dog I know is friendly' },
  { key: 'gateclosed', label: 'Gate closed and latched behind me' },
] as const

export const FINISH_CHECKLIST = [
  { key: 'wholeyard', label: 'Scooped the whole yard, corners and fence line too' },
  { key: 'bagged', label: 'Waste double-bagged and disposed of as noted' },
  { key: 'tools', label: 'Tools, bucket bottom and shoe soles sprayed' },
  { key: 'gloves', label: 'Gloves in the trash, hands sanitized' },
] as const

export interface SopSection {
  title: string
  steps: string[]
}

export const SOPS: SopSection[] = [
  {
    title: 'Dogs and gates',
    steps: [
      'Look over the fence and make noise before opening the gate.',
      'Never enter with a dog loose unless the client said it is friendly and you have met it. If unsure, text the client and move on.',
      'Close and latch the gate behind you, and check it again when you leave.',
      'If a dog acts aggressive, do not run or turn your back. Back out slowly with the bucket between you and the dog.',
      'If bitten: wash with soap and water for 5 minutes, get the rabies vaccine status from the owner, and see a doctor the same day.',
    ],
  },
  {
    title: 'Heat and sun',
    steps: [
      'May through September, scoop before 11 a.m. or after 5 p.m.',
      'Drink water at every yard, not just when thirsty.',
      'Hat, light long sleeves, sunscreen.',
      'Dizzy, nauseous, headache or stopped sweating: sit in the air-conditioned car and end the route.',
      'Heat index over 105°F: cut the route short or move it.',
    ],
  },
  {
    title: 'Bleach mix',
    steps: [
      '32 oz spray bottle: 2 tablespoons bleach, fill the rest with water.',
      '1 gallon: 1/2 cup bleach, fill the rest with water.',
      'Mix fresh every route day and dump leftovers at night.',
      'Never mix bleach with vinegar, ammonia or other cleaners.',
      'Spray only your tools and shoe soles, never lawns, plants or pets.',
    ],
  },
  {
    title: 'Between every yard',
    steps: [
      'Bag the waste, tie it, double-bag it.',
      'Knock chunks off the rake and pan outside the gate.',
      'Spray rake, pan, bucket bottom and both shoe soles until wet.',
      'Gloves off, sanitize hands, then touch the car.',
      'The drive to the next yard is your 10 minutes of contact time.',
      'Tools go in the tote, never loose on the car floor.',
    ],
  },
  {
    title: 'Route order and sick yards',
    steps: [
      'Puppies and homes with old or sick dogs first, regular yards in the middle, known sick yards last.',
      'Never do a parvo yard and then a puppy yard on the same day.',
      'Bloody or very runny stool: text the owner a photo and suggest a vet. Add a note to the client.',
      'Confirmed parvo yard: separate shoes or boot covers, and soak tools at home in fresh bleach mix for 10 minutes.',
    ],
  },
  {
    title: 'End of route',
    steps: [
      'Spray all tools and buckets, wait 10 minutes, hose off, dry in the sun.',
      'Wipe door handles and the steering wheel.',
      'Wash hands with soap and water. Scooping clothes go straight in the wash.',
      'Whoever is not on the route gets a "done" text after the last yard.',
    ],
  },
]
