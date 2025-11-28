import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'writer.currentDoc.v1';

export type Document = {
  title: string;
  subtitle?: string;
  content: string;
  wordGoal: number;
};

function loadInitial(): Document {
  if (!browser) {
    return {
      title: 'Current Title',
      subtitle: 'Optional Subtitle',
      content: '',
      wordGoal: 750
    };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      title: 'Current Title',
      subtitle: 'Optional Subtitle',
      content: '',
      wordGoal: 750
    };
  }

  try {
    return JSON.parse(raw) as Document;
  } catch {
    return {
      title: 'Current Title',
      subtitle: 'Optional Subtitle',
      content: '',
      wordGoal: 750
    };
  }
}

function createDocStore() {
  const { subscribe, update } = writable<Document>(loadInitial());

  // persist on change
  subscribe((value) => {
    if (!browser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  });

  return {
    subscribe,
    setTitle: (title: string) =>
      update((doc) => ({ ...doc, title })),
    setSubtitle: (subtitle: string) =>
      update((doc) => ({ ...doc, subtitle })),
    setContent: (content: string) =>
      update((doc) => ({ ...doc, content })),
    setWordGoal: (wordGoal: number) =>
      update((doc) => ({ ...doc, wordGoal }))
  };
}

export const currentDoc = createDocStore();

export const wordCount = derived(currentDoc, ($doc) => {
  const text = $doc.content.trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
});

export const goalInfo = derived(
  [currentDoc, wordCount],
  ([$doc, $count]) => {
    const goal = $doc.wordGoal || 0;
    const remaining = Math.max(goal - $count, 0);
    const ratio = goal ? Math.min($count / goal, 1) : 0;
    return { count: $count, goal, remaining, ratio };
  }
);
