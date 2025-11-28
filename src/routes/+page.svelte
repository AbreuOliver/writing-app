<script lang="ts">
  import MarkdownIt from 'markdown-it';
  import { derived } from 'svelte/store';
  import { currentDoc, wordCount, goalInfo } from '$lib/stores/document';

  const md = new MarkdownIt({ breaks: true });

  // Live HTML for preview
  const previewHtml = derived(currentDoc, ($doc) => md.render($doc.content));

  // UI state
  let showPreview = true;
</script>

<div
  class="flex h-screen bg-[#f5eee4] text-zinc-900 dark:bg-black dark:text-zinc-100 transition-colors"
>
  <!-- Sidebar -->
  <aside class="w-64 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
    <div class="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
      <div class="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Progress
      </div>

      {#if $goalInfo.goal > 0}
        <div class="mt-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden">
          <div
            class="h-full bg-zinc-700 dark:bg-zinc-300 transition-all"
            style={`width: ${$goalInfo.ratio * 100}%`}
          />
        </div>
        <div class="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          {$goalInfo.count}/{$goalInfo.goal} words ({$goalInfo.remaining} left)
        </div>
      {:else}
        <div class="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          {$wordCount} words
        </div>
      {/if}
    </div>

    <div class="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
      <input
        class="w-full rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
        placeholder="Search files..."
        disabled
      />
    </div>

    <div class="flex-1 px-4 py-3 text-sm">
      <div class="text-xs uppercase tracking-wide text-zinc-500 mb-2">
        Files
      </div>
      <button
        class="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm bg-zinc-100 dark:bg-zinc-900"
        disabled
      >
        <span class="h-2 w-2 rounded-full bg-zinc-500" />
        <span>Current note</span>
      </button>
    </div>

    <div
      class="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 text-[11px] text-zinc-500 flex items-center justify-between"
    >
      <span>Made with ♥ by Oliver Abreu</span>
    </div>
  </aside>

  <!-- Main area -->
  <div class="flex-1 flex flex-col">
    <!-- Top bar -->
    <header
      class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-8 py-3"
    >
      <div class="flex flex-col">
        <input
          class="bg-transparent text-xl font-semibold tracking-wide focus:outline-none"
          value={$currentDoc.title}
          on:input={(e) =>
            currentDoc.setTitle((e.target as HTMLInputElement).value)}
        />
        <input
          class="bg-transparent text-sm text-zinc-500 focus:outline-none"
          placeholder="Optional subtitle"
          value={$currentDoc.subtitle}
          on:input={(e) =>
            currentDoc.setSubtitle((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="flex items-center gap-4 text-sm text-zinc-500">
        <div class="flex items-center gap-2">
          <label for="goal" class="text-xs uppercase tracking-wide">Goal</label>
          <input
            id="goal"
            type="number"
            min="0"
            class="w-20 rounded border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            value={$currentDoc.wordGoal}
            on:input={(e) =>
              currentDoc.setWordGoal(
                Number((e.target as HTMLInputElement).value) || 0
              )}
          />
        </div>

        <button
          class="text-xs uppercase tracking-wide border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1"
          on:click={() => (showPreview = !showPreview)}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>
    </header>

    <!-- Editor + Preview -->
    <main class="flex flex-1 overflow-hidden">
      <!-- Editor -->
      <section
        class={`flex-1 border-r border-zinc-200 dark:border-zinc-800 ${
          showPreview ? '' : 'max-w-4xl mx-auto'
        }`}
      >
        <textarea
          class="h-full w-full resize-none bg-transparent px-10 py-8 text-[18px] leading-relaxed focus:outline-none very-serif"
          spellcheck="false"
          placeholder="Start writing..."
          value={$currentDoc.content}
          on:input={(e) =>
            currentDoc.setContent((e.target as HTMLTextAreaElement).value)}
        ></textarea>
      </section>

      <!-- Preview -->
      {#if showPreview}
        <section class="flex-1 overflow-y-auto px-10 py-8 bg-[#f8f2e8] dark:bg-zinc-950">
          <article class="prose prose-zinc max-w-none dark:prose-invert font-serif">
            {@html $previewHtml}
          </article>
        </section>
      {/if}
    </main>
  </div>
</div>
