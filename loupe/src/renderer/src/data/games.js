export const GAMES = [
  {
    id: 'sort',
    title: 'The Sort',
    description: 'Group 12 terms into the right categories.'
  },
  {
    id: 'jargon',
    title: 'Jargon Decoder',
    description: 'Guess the AI term from clues in 5 tries.'
  },
  {
    id: 'truefalse',
    title: 'True / False / It Depends',
    description: 'Three statements about AI and UX. What\'s your call?'
  },
  {
    id: 'timeline',
    title: 'The Timeline',
    description: 'Put 5 AI milestones in the right order.'
  }
]

export const SORT_DATA = {
  categories: ['AI Concepts', 'Design Tools', 'Research Methods'],
  items: [
    { term: 'Hallucination', category: 'AI Concepts' },
    { term: 'Token', category: 'AI Concepts' },
    { term: 'Embeddings', category: 'AI Concepts' },
    { term: 'Fine-tuning', category: 'AI Concepts' },
    { term: 'Figma', category: 'Design Tools' },
    { term: 'Framer', category: 'Design Tools' },
    { term: 'Protopie', category: 'Design Tools' },
    { term: 'Principle', category: 'Design Tools' },
    { term: 'Affinity Mapping', category: 'Research Methods' },
    { term: 'Think-Aloud', category: 'Research Methods' },
    { term: 'Card Sorting', category: 'Research Methods' },
    { term: 'Diary Study', category: 'Research Methods' }
  ]
}

export const JARGON_DATA = [
  {
    answer: 'CONTEXT',
    clues: [
      'I determine how much an AI can remember at once',
      'I am measured in tokens',
      'Lose me and the AI forgets the start of your conversation',
      'Hint: I am a _____ window',
      'Final hint: I relate to short-term memory'
    ]
  },
  {
    answer: 'PROMPT',
    clues: [
      'I am what you give the AI before it responds',
      'Quality matters — garbage in, garbage out',
      'Engineers who specialise in crafting me have a job title',
      'Hint: I am an instruction or question',
      'Final hint: theatre directors use this word too'
    ]
  },
  {
    answer: 'AGENT',
    clues: [
      'I can take actions autonomously',
      'I can browse the web, write code, and use tools',
      'I complete multi-step tasks without constant human input',
      'Hint: travel and real estate professionals share my name',
      'Final hint: I am an AI that acts, not just responds'
    ]
  },
  {
    answer: 'LATENCY',
    clues: [
      'I am the delay between your request and the AI response',
      'High me = slow; low me = fast',
      'I am a UX problem as much as a technical one',
      'Hint: skeleton screens are designed to manage me',
      'Final hint: networks have me; so does human reaction time'
    ]
  }
]

export const TRUEFALSE_DATA = [
  {
    statements: [
      {
        text: 'AI will replace UX designers within 5 years.',
        answer: 'False',
        explanation: 'AI is reshaping UX roles but the core skills — empathy, systems thinking, facilitation, strategy — remain deeply human. Execution tasks are shifting, but the judgment work is growing in importance.'
      },
      {
        text: 'You should always verify facts in AI-generated research summaries.',
        answer: 'True',
        explanation: 'AI hallucinates confidently. Any statistic, citation, or factual claim from an AI summary should be traced back to a source before you use it.'
      },
      {
        text: 'A longer, more detailed prompt always produces better AI output.',
        answer: 'It Depends',
        explanation: 'More context usually helps, but padding a prompt with irrelevant detail can dilute it. The RTCC framework (Role, Task, Context, Constraints) is a better guide than "more is more."'
      }
    ]
  },
  {
    statements: [
      {
        text: 'AI-generated wireframes are ready to hand off to developers.',
        answer: 'False',
        explanation: 'AI-generated designs are rough starting points — they often have inconsistent spacing, generic components, and accessibility issues. Always treat them as explorations that need significant refinement.'
      },
      {
        text: 'Temperature settings affect how creative or random AI outputs are.',
        answer: 'True',
        explanation: 'Temperature is a real, adjustable parameter in AI models. Low temperature = predictable and conservative outputs; high temperature = more varied and surprising, but potentially less coherent.'
      },
      {
        text: 'Using AI for user research synthesis removes the need for a human review pass.',
        answer: 'It Depends',
        explanation: 'For low-stakes internal brainstorming, maybe. For any insight that will influence product direction, always do a human pass — AI synthesis tends to smooth over the outliers that contain the most interesting insights.'
      }
    ]
  }
]

export const TIMELINE_DATA = {
  milestones: [
    { year: '1950', event: 'Alan Turing publishes the "Computing Machinery and Intelligence" paper', order: 1 },
    { year: '1997', event: 'IBM\'s Deep Blue defeats chess world champion Garry Kasparov', order: 2 },
    { year: '2012', event: 'AlexNet wins ImageNet — deep learning goes mainstream', order: 3 },
    { year: '2017', event: 'Google publishes the Transformer paper — the foundation of modern LLMs', order: 4 },
    { year: '2022', event: 'ChatGPT launches and reaches 1 million users in 5 days', order: 5 }
  ]
}
