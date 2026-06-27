// Runs only in browser (non-Electron) context.
// Mirrors the window.loupe IPC API using localStorage so the full UI works.

const KEY = 'loupe-data'

const DEFAULT = {
  completions: {},
  streakCount: 0,
  learnedWords: [],
  totalDrops: 0,
  history: {}
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { ...DEFAULT }
  } catch {
    return { ...DEFAULT }
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  return data
}

window.loupe = {
  readData: async () => load(),

  addDrop: async (amount, element) => {
    const data = load()
    const today = new Date().toISOString().slice(0, 10)
    if (!data.completions[today]) {
      data.completions[today] = { word: false, lesson: false, spark: false, wander: false, drops: 0 }
    }
    if (data.completions[today][element]) return data
    data.completions[today][element] = true
    data.completions[today].drops = (data.completions[today].drops || 0) + amount
    data.totalDrops = (data.totalDrops || 0) + amount
    return save(data)
  },

  recordWord: async (word) => {
    const data = load()
    if (!data.learnedWords.includes(word)) data.learnedWords.push(word)
    return save(data)
  },

  updateHistory: async (date, entry) => {
    const data = load()
    data.history[date] = { ...(data.history[date] || {}), ...entry }
    return save(data)
  },

  updateStreak: async () => {
    const data = load()
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const todayComplete = (data.completions[today]?.drops || 0) >= 4
    if (todayComplete) {
      const hadYesterday = (data.completions[yesterday]?.drops || 0) > 0
      if (hadYesterday || data.streakCount === 0) data.streakCount = (data.streakCount || 0) + 1
      return save(data)
    }
    return data
  },

  closeWindow:    async () => window.close(),
  minimizeWindow: async () => {}
}
