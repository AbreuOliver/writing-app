import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';

const STORAGE_KEY = 'writer.state.v1';

export type Document = {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  wordGoal: number;
  createdAt: string;
  updatedAt: string;
};

type PersistedState = {
  documents: Document[];
  currentDocumentId: string | null;
};

function createBlankDocument(): Document {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: 'Untitled note',
    subtitle: '',
    content: '',
    wordGoal: 750,
    createdAt: now,
    updatedAt: now
  };
}

function loadInitial(): PersistedState {
  if (!browser) {
    const doc = createBlankDocument();
    return { documents: [doc], currentDocumentId: doc.id };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const doc = createBlankDocument();
    return { documents: [doc], currentDocumentId: doc.id };
  }

  try {
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed.documents || parsed.documents.length === 0) {
      const doc = createBlankDocument();
      return { documents: [doc], currentDocumentId: doc.id };
    }
    return parsed;
  } catch {
    const doc = createBlankDocument();
    return { documents: [doc], currentDocumentId: doc.id };
  }
}

const initial = loadInitial();

export const documents = writable<Document[]>(initial.documents);
export const currentDocumentId = writable<string | null>(initial.currentDocumentId);

// persist state to localStorage whenever docs or current id change
if (browser) {
  const persister = derived(
    [documents, currentDocumentId],
    ([$docs, $id]): PersistedState => ({
      documents: $docs,
      currentDocumentId: $id
    })
  );

  persister.subscribe((state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  });
}

// derived: current document
export const currentDocument = derived(
  [documents, currentDocumentId],
  ([$docs, $id]) => $docs.find((doc) => doc.id === $id) ?? null
);

// derived: word count and goal info
export const wordCount = derived(currentDocument, ($doc) => {
  if (!$doc) return 0;
  const text = $doc.content.trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
});

export const goalInfo = derived(
  [currentDocument, wordCount],
  ([$doc, $count]) => {
    if (!$doc) return { count: 0, goal: 0, remaining: 0, ratio: 0 };
    const goal = $doc.wordGoal || 0;
    const remaining = Math.max(goal - $count, 0);
    const ratio = goal ? Math.min($count / goal, 1) : 0;
    return { count: $count, goal, remaining, ratio };
  }
);

// Actions

export function selectDocument(id: string) {
  currentDocumentId.set(id);
}

function updateCurrent(updater: (doc: Document) => Document) {
  let currentId: string | null;
  currentDocumentId.subscribe((v) => (currentId = v))();
  if (!currentId) return;

  documents.update((docs) =>
    docs.map((doc) =>
      doc.id === currentId!
        ? (() => {
            const updated = updater(doc);
            return { ...updated, updatedAt: new Date().toISOString() };
          })()
        : doc
    )
  );
}

export function updateCurrentTitle(title: string) {
  updateCurrent((doc) => ({ ...doc, title }));
}

export function updateCurrentSubtitle(subtitle: string) {
  updateCurrent((doc) => ({ ...doc, subtitle }));
}

export function updateCurrentContent(content: string) {
  updateCurrent((doc) => ({ ...doc, content }));
}

export function updateCurrentWordGoal(wordGoal: number) {
  updateCurrent((doc) => ({ ...doc, wordGoal }));
}

export function createDocument() {
  const doc = createBlankDocument();
  documents.update((docs) => [...docs, doc]);
  currentDocumentId.set(doc.id);
}
