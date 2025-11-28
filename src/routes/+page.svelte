<script lang="ts">
  import MarkdownIt from 'markdown-it';
  import { derived } from 'svelte/store';

  import {
    documents,
    currentDocument,
    wordCount,
    goalInfo,
    createDocument,
    selectDocument,
    updateCurrentTitle,
    updateCurrentSubtitle,
    updateCurrentContent,
    updateCurrentWordGoal
  } from '$lib/stores/documents.store';

  const md = new MarkdownIt({ breaks: true });

  const previewHtml = derived(currentDocument, ($doc) =>
    md.render($doc?.content ?? '')
  );

  let showPreview = false;
</script>

<div class="h-screen flex flex-col bg-[#f5eee4] text-zinc-900 dark:bg-black dark:text-zinc-100 transition-colors">
  <!-- HEADER -->
  <header
    class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-8 py-3"
  >
    <!-- Title + subtitle -->
    <div class="flex flex-col">
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

    <!-- Progress + goal + preview toggle -->
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

  <!-- BODY: sidebar + main -->
  <div class="flex flex-1 overflow-hidden">
    <!-- SIDEBAR -->
    <aside
      class={`border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
        ${showPreview ? 'w-0 opacity-0 pointer-events-none' : 'w-64 opacity-100'}
      `}
    >
      <!-- Search above documents -->
      <div class="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <input
          class="w-full rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
          placeholder="Search files..."
          disabled
        />
      </div>

      <!-- Documents list + New button -->
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
          {#each $documents as doc}
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

      <!-- Footer -->
      <div
        class="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 text-[11px] text-zinc-500 flex items-center justify-between"
      >
        <span>Made with ♥ by Oliver Abreu</span>
      </div>
    </aside>

    <!-- MAIN EDITOR / PREVIEW -->
    <main class="flex-1 flex flex-col overflow-hidden">
      {#if $currentDocument}
        <div class="flex flex-1 overflow-hidden">
          <!-- Editor -->
          <section
            class={`border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out ${
              showPreview ? 'basis-1/2' : 'basis-full'
            }`}
          >
            <textarea
              class="h-full min-w-full resize-none bg-transparent px-10 py-8 text-base leading-relaxed focus:outline-none"
              spellcheck="false"
              placeholder="Start writing..."
              value={$currentDocument.content}
              on:input={(e) =>
                updateCurrentContent((e.target as HTMLTextAreaElement).value)}
            ></textarea>
          </section>

          <!-- Preview -->
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
