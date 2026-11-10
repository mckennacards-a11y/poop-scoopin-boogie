// Business details shown on the public website. Edit these and push to main; the site redeploys itself.
export const BUSINESS = {
  name: "Poop Scoopin' Boogie",
  city: 'Tyler, TX',
  serviceArea: 'Tyler and nearby (Whitehouse, Bullard, Flint, Lindale). Not sure? Sign up and ask.',
  // Leave blank to hide. Example: '(903) 555-0100'
  phone: '',
  // Leave blank to hide. Example: 'poopscoopinboogie@gmail.com'
  email: 'poopscoopinboogietexas@gmail.com',
}

export const PLANS = [
  {
    value: 'weekly',
    name: 'Weekly',
    price: '$60',
    per: '/month',
    detail: 'Once a week, 1 dog. +$10/month for each extra dog.',
    popular: true,
  },
  {
    value: 'biweekly',
    name: 'Every other week',
    price: '$40',
    per: '/month',
    detail: 'Every two weeks, 1 dog. +$10/month for each extra dog.',
    popular: false,
  },
  {
    value: 'one_time',
    name: 'One-time cleanup',
    price: '$60',
    per: '+',
    detail: 'Party coming up, moving out, or just catching up. Priced by yard size and how long it’s been.',
    popular: false,
  },
] as const

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'Do I need to be home?',
    a: 'No. Just leave the gate unlocked or give us the code. After every visit we send you a photo of your clean yard and your latched gate.',
  },
  {
    q: 'What about my dogs?',
    a: 'Friendly dogs can stay out, and we’ll probably make friends. If your dog is nervous around strangers, keep them inside on your service day. We never go in a yard with a loose dog we haven’t met.',
  },
  {
    q: 'What do you do with the poop?',
    a: 'We double-bag it and put it in your outdoor trash bin. If you’d rather we take it with us, just tell us when you sign up.',
  },
  {
    q: 'Can you spread germs between yards?',
    a: 'We disinfect our tools and shoe soles after every single yard, and we scoop any yard with a sick dog last. Diseases like parvo and giardia spread through poop, so we take this seriously.',
  },
  {
    q: 'How much does it cost?',
    a: 'Weekly service is $60 a month for 1 dog, and every other week is $40 a month. Each extra dog adds $10 a month. If your yard hasn’t been cleaned in a while, the first visit may cost more. We’ll always tell you the price before we start.',
  },
  {
    q: 'Is there a contract?',
    a: 'No contract. Cancel anytime before your next month starts.',
  },
  {
    q: 'How do I pay?',
    a: 'You pay monthly at the start of the month by card, with automatic payments so you don’t have to think about it. You can update your card or see your visits anytime from your account page.',
  },
  {
    q: 'What if it rains?',
    a: 'Light rain doesn’t stop us. If there’s a storm, lightning, or ice, we’ll come the next good day and text you.',
  },
  {
    q: 'Where do you work?',
    a: 'Tyler and nearby towns like Whitehouse, Bullard, Flint, and Lindale. If you’re not sure we come to you, sign up and we’ll let you know.',
  },
  {
    q: 'Who are you?',
    a: 'We’re a mom-and-kid team from Tyler. We started Poop Scoopin’ Boogie so you can enjoy your yard instead of cleaning it.',
  },
]
