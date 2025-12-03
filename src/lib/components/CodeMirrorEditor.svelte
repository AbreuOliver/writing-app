<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView, keymap, lineNumbers, Decoration, ViewPlugin } from '@codemirror/view';
  import type { DecorationSet, ViewUpdate } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { defaultKeymap } from '@codemirror/commands';
  import { syntaxHighlighting, HighlightStyle, syntaxTree } from '@codemirror/language';
  import { tags } from '@lezer/highlight';

  export let value: string = '';
  export let onUpdate: (newValue: string) => void = () => {};
  export let isDark: boolean = false;

  let editorContainer: HTMLDivElement;
  let editorView: EditorView | null = null;

  // 1. Define the color variable correctly as a string
  const customColor: string = `#33a1fd`; // Changed name for clarity and consistency

  // Custom highlighting style for markdown
  // 2. Use the variable directly in the color property (no need for object wrapper)
  const customHighlight = HighlightStyle.define([
    // Markdown syntax markers - light blue
    { tag: tags.processingInstruction, color: customColor },
    { tag: tags.punctuation, color: customColor },
    { tag: tags.meta, color: customColor },
    { tag: tags.contentSeparator, color: customColor },
    { tag: tags.moduleKeyword, color: customColor },
    
    // Content stays normal color
    { tag: tags.heading, color: 'inherit' },
    { tag: tags.emphasis, color: 'inherit' },
    { tag: tags.strong, color: 'inherit' },
    { tag: tags.link, color: 'inherit' },
    { tag: tags.list, color: 'inherit' },
    { tag: tags.quote, color: 'inherit' },
    { tag: tags.content, color: 'inherit' },
  ]);

  // Additional decoration for markdown syntax characters
  const markdownSyntaxDecorator = ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView) {
      const marks: any[] = [];
      const syntaxMark = Decoration.mark({ class: 'cm-markdown-syntax' });

      for (let { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from, to,
          enter: (node) => {
            // Highlight specific markdown syntax node types
            if (
              node.name === 'HeaderMark' ||
              node.name === 'ATXHeading1' ||
              node.name === 'ATXHeading2' ||
              node.name === 'ATXHeading3' ||
              node.name === 'ATXHeading4' ||
              node.name === 'ATXHeading5' ||
              node.name === 'ATXHeading6' ||
              node.name === 'QuoteMark' ||
              node.name === 'ListMark' ||
              node.name === 'LinkMark' ||
              node.name === 'EmphasisMark' ||
              node.name === 'CodeMark' ||
              node.name === 'InlineCode' ||
              node.name === 'CodeText' ||
              node.name === 'Escape'
            ) {
              // For headings, only highlight the # characters
              const text = view.state.doc.sliceString(node.from, node.to);
              if (node.name.includes('Heading')) {
                const match = text.match(/^#{1,6}\s*/);
                if (match) {
                  marks.push(syntaxMark.range(node.from, node.from + match[0].length));
                }
              } else {
                marks.push(syntaxMark.range(node.from, node.to));
              }
            }
          }
        });
      }

      return Decoration.set(marks);
    }
  }, {
    decorations: v => v.decorations
  });

  // Theme customization
  // 3. Use the variable directly in the theme CSS (must use a string literal)
  const customTheme = EditorView.theme({
    '&': {
      height: '100%',
      backgroundColor: 'transparent',
      fontSize: '16px',
    },
    '.cm-content': {
      caretColor: isDark ? '#fafafa' : '#18181b',
      padding: '2rem 2.5rem',
      fontFamily: 'inherit',
      lineHeight: '1.5',
      color: isDark ? '#fafafa' : '#18181b',
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: 'inherit',
    },
    '.cm-line': {
      padding: '0',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-placeholder': {
      color: isDark ? '#71717a' : '#a1a1aa',
    },
    // Line number styling
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
      paddingLeft: '1rem',
      paddingRight: '0.5rem',
    },
    '.cm-lineNumbers': {
      color: isDark ? '#52525b' : '#d4d4d8',
      fontSize: '0.75rem',
      minWidth: '2rem',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 0.5rem 0 0',
      textAlign: 'right',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: isDark ? '#71717a' : '#a1a1aa',
    },
    // Custom markdown syntax highlighting
    // 4. Use a template literal for the CSS value
    [`.cm-markdown-syntax`]: {
      color: `${customColor}!important`,
    },
  });

  onMount(() => {
    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        markdown(),
        syntaxHighlighting(customHighlight),
        markdownSyntaxDecorator, // Add the custom decorator
        customTheme,
        keymap.of(defaultKeymap),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            onUpdate(newValue);
          }
        }),
        EditorView.lineWrapping,
        EditorView.domEventHandlers({
          focus: () => true,
        }),
      ],
    });

    editorView = new EditorView({
      state: startState,
      parent: editorContainer,
    });
  });

  onDestroy(() => {
    if (editorView) {
      editorView.destroy();
    }
  });

  // Update editor when value changes externally
  $: if (editorView && value !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: value,
      },
    });
  }
</script>

<div bind:this={editorContainer} class="h-full w-full"></div>