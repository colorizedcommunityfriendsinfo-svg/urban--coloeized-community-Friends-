export const activities = Object.freeze([
  { id: 'color-walk', category: 'Create', title: 'Take a color walk', time: '15 min', color: 'peach', icon: 'sun', description: 'Step outside and notice five colors you usually walk past. Make a small palette of your neighborhood.', steps: ['Choose a familiar, accessible route or look out a window.', 'Write down five colors and where you found them.', 'Turn your palette into a sketch, a photo collection, or a few lines of writing.'] },
  { id: 'story-swap', category: 'Connect', title: 'Start with a story', time: '20 min', color: 'lilac', icon: 'chat', description: 'Invite someone you know to share the story behind a place, an object, or a favorite tradition.', steps: ['Ask someone if they would like to swap stories.', 'Take turns sharing a memory and listening without interruption.', 'Ask before recording, photographing, or sharing their story.'] },
  { id: 'kind-note', category: 'Care', title: 'Leave a little kindness', time: '10 min', color: 'yellow', icon: 'heart', description: 'A thoughtful note can make an ordinary day feel different. Tell someone what you appreciate about them.', steps: ['Think of someone whose everyday effort you appreciate.', 'Write a short, specific thank-you in your own words.', 'Give it to them in a way they are comfortable with.'] },
  { id: 'word-journal', category: 'Learn', title: 'Keep a word journal', time: '15 min', color: 'mint', icon: 'book', description: 'Collect words that catch your attention. Let curiosity be the beginning of your next discovery.', steps: ['Pick a word you heard or read today.', 'Record where you encountered it and what you think it means.', 'Look it up in a reputable dictionary. Keep a note of the source and separate evidence from guesses.'] },
  { id: 'shared-place', category: 'Care', title: 'Care for a shared place', time: '20 min', color: 'mint', icon: 'leaf', description: 'Choose one small, safe way to care for a space you share with others.', steps: ['Choose a space you have permission to help care for.', 'Ask what would be useful: watering a plant, tidying, or organizing supplies.', 'Keep the task small and avoid hazardous materials or unsafe areas.'] },
  { id: 'make-together', category: 'Create', title: 'Make something together', time: '30 min', color: 'peach', icon: 'spark', description: 'Bring a few everyday materials and two different imaginations to the same table.', steps: ['Invite a friend and choose materials you already have.', 'Take turns adding to a drawing, collage, or short story.', 'Give your creation a name. Get everyone’s permission before sharing it.'] }
]);

export function selectActivities({ query = '', category = 'All', savedOnly = false, favorites = [] } = {}) {
  const needle = query.trim().toLocaleLowerCase();
  return activities.filter(a => (category === 'All' || a.category === category) && (!savedOnly || favorites.includes(a.id)) && `${a.title} ${a.description} ${a.category}`.toLocaleLowerCase().includes(needle));
}

export function cleanState(value) {
  if (!value || typeof value !== 'object') return { favorites: [], tasks: [] };
  const favorites = [...new Set(Array.isArray(value.favorites) ? value.favorites.filter(id => activities.some(a => a.id === id)) : [])];
  const seen = new Set();
  const tasks = (Array.isArray(value.tasks) ? value.tasks : []).filter(t => {
    if (!t || typeof t.id !== 'string' || t.id.length > 80 || seen.has(t.id) || typeof t.title !== 'string' || !t.title.trim()) return false;
    seen.add(t.id); return true;
  }).slice(0, 100).map(t => ({ id: t.id, title: t.title.trim().slice(0, 160), done: t.done === true }));
  return { favorites, tasks };
}
