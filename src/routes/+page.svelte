<script lang="ts">
  import MarkdownIt from 'markdown-it';
  import { derived } from 'svelte/store';
  import CodeMirrorEditor from '$lib/components/CodeMirrorEditor.svelte';

  import {
    documents,
    currentDocument,
    goalInfo,
    createDocument,
    selectDocument,
    updateCurrentTitle,
    updateCurrentSubtitle,
    updateCurrentContent,
    updateCurrentWordGoal
  } from '$lib/stores/documents.store';
  import Footer from '$lib/components/Footer.svelte';

  const md = new MarkdownIt({ breaks: true });

  const previewHtml = derived(currentDocument, ($doc) =>
    md.render($doc?.content ?? '')
  );

  let showPreview = false;
  let searchQuery = '';
  let isDarkMode = false;

  // Check for dark mode
  $: if (typeof window !== 'undefined') {
    isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function matchesSearch(doc: any, query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    return (
      (doc.title ?? '').toLowerCase().includes(q) ||
      (doc.subtitle ?? '').toLowerCase().includes(q) ||
      (doc.content ?? '').toLowerCase().includes(q)
    );
  }

  // --- ACCURATE WORD COUNT LOGIC (RETAINED) ---
  
  /**
   * Removes common markdown syntax from a string for accurate word counting.
   */
  function stripMarkdown(markdownText: string): string {
    // 1. Remove link and image syntax [text](url)
    let cleanText = markdownText.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    // 2. Remove HTML tags (for inline HTML)
    cleanText = cleanText.replace(/<[^>]+>/g, '');
    // 3. Remove headers - FIXED to handle # at start with space
    cleanText = cleanText.replace(/^#{1,6}\s+/gm, '');
    // 4. Remove list markers, etc.
    cleanText = cleanText.replace(/^(\s*[\*+\-]\s+|[0-9]+\.\s+)/gm, '');
    cleanText = cleanText.replace(/^[>]{1,}\s+/gm, '');
    // 5. Remove emphasis/strong text (**, __, *, _) 
    cleanText = cleanText.replace(/(\*\*|__)(.*?)\1/g, '$2');
    cleanText = cleanText.replace(/(\*|_)(.*?)\1/g, '$2');
    // 6. Remove code blocks and inline code
    cleanText = cleanText.replace(/```[\s\S]*?```/g, '');
    cleanText = cleanText.replace(/`([^`]+)`/g, '$1');
    // 7. Remove special chars
    cleanText = cleanText.replace(/[\\~]/g, ''); 
    return cleanText;
  }

  function countWords(text: string): number {
    const trimmedText = text.trim();
    if (!trimmedText) return 0;
    return trimmedText.split(/\s+/).length;
  }

  // Define localWordCount (or update $lib/stores/documents.store.ts)
  const localWordCount = derived(currentDocument, ($doc) => {
    const content = $doc?.content ?? '';
    const contentWithoutMarkdown = stripMarkdown(content); 
    return countWords(contentWithoutMarkdown);
  });
  // --- END ACCURATE WORD COUNT LOGIC ---
</script>


<div class="h-screen flex flex-col bg-[#f5eee4] text-zinc-900 dark:bg-black dark:text-zinc-100 transition-colors">
  <header
    class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-8 py-3"
  >
    <div class="flex flex-col w-full max-w-1/2">
      <input
        class="bg-transparent text-xl font-semibold tracking-wide focus:outline-none"
        value={$currentDocument?.title ?? ''}
        on:input={(e) =>
          updateCurrentTitle((e.target as HTMLInputElement).value)}
      />
      <input
        class="bg-transparent text-sm text-zinc-500 focus:outline-none"
        placeholder="Optional subtitle"
        value={$currentDocument?.subtitle ?? ''}
        on:input={(e) =>
          updateCurrentSubtitle((e.target as HTMLInputElement).value)}
      />
    </div>

    <div class="flex items-center gap-6 text-sm text-zinc-500">
      <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
        <span>Goal</span>
        <input
          id="goal"
          type="number"
          min="0"
          class="w-20 rounded border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 py-1 text-right text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
          value={$currentDocument?.wordGoal ?? 0}
          on:input={(e) =>
            updateCurrentWordGoal(
              Number((e.target as HTMLInputElement).value) || 0
            )}
        />
      </div>

      <div class="flex flex-col items-end gap-1">
        <div class="mt-1 w-40 h-2 rounded-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden">
          <div
            class="h-full bg-zinc-700 dark:bg-zinc-300 transition-all"
            style={`width: ${$goalInfo.ratio * 100}%`}
          ></div>
        </div>

        <div class="text-[11px] text-zinc-500 dark:text-zinc-400">
          {$goalInfo.count}/{$goalInfo.goal} words ({$goalInfo.remaining} left)
        </div>
      </div>

      <button
        class="text-xs uppercase tracking-wide border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1"
        on:click={() => (showPreview = !showPreview)}
      >
        {showPreview ? 'Hide Preview' : 'Show Preview'}
      </button>
    </div>
  </header>

  <div class="flex flex-1 overflow-hidden">
    <aside
      class={`border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
        ${showPreview ? 'w-0 opacity-0 pointer-events-none' : 'w-64 opacity-100'}
      `}
    >
      <div class="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <input
            class="w-full rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            placeholder="Search documents..."
            bind:value={searchQuery}
        />
    </div>

      <div class="flex-1 px-4 py-3 text-sm overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs uppercase tracking-wide text-zinc-500">
            Documents
          </div>
          <button
            class="text-[11px] px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            on:click={createDocument}
          >
            Create New
          </button>
        </div>

    <div class="space-y-1">
        {#each $documents.filter((doc) => matchesSearch(doc, searchQuery)) as doc}
            <button
            class={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm
                ${
                $currentDocument && doc.id === $currentDocument.id
                    ? 'bg-zinc-200 dark:bg-zinc-800'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
            on:click={() => selectDocument(doc.id)}
            >
            <span class="h-2 w-2 rounded-full bg-zinc-500"></span>
            <span class="truncate">{doc.title || 'Untitled note'}</span>
            </button>
        {/each}
    </div>

      </div>

      <Footer />
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden">
      {#if $currentDocument}
        <div class="flex flex-1 overflow-hidden">
          <section
            class={`border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out ${
              showPreview ? 'basis-1/2' : 'basis-full'
            }`}
          >
            <CodeMirrorEditor
              value={$currentDocument.content}
              onUpdate={updateCurrentContent}
              isDark={isDarkMode}
            />
          </section>

          <section
            class={`overflow-y-auto px-10 py-8 bg-[#f8f2e8] dark:bg-zinc-950 transition-all duration-300 ease-in-out ${
              showPreview
                ? 'basis-2/3 opacity-100'
                : 'basis-0 opacity-0 pointer-events-none'
            }`}
          >
            {#if showPreview}
              <article class="prose prose-zinc max-w-none dark:prose-invert font-serif">
                {@html $previewHtml}
              </article>
            {/if}
          </section>
        </div>
      {:else}
        <section class="flex-1 flex items-center justify-center">
          <div class="text-sm text-zinc-500">
            No document selected. Create one from the sidebar.
          </div>
        </section>
      {/if}
    </main>
  </div>
</div>