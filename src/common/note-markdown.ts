import { MarkdownManager } from '@tiptap/markdown';
import { StarterKit } from '@tiptap/starter-kit';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from '@tiptap/extension-table';
import type { ProseMirrorDoc } from '@/db/schema';

// note: penanda di title link markdown, supaya node attachment selamat dari round-trip agent/runner
const ATTACHMENT_PREFIX = 'attachment:';
const MISSING_ATTACHMENT = '(attachment dihapus)';

export type AttachmentRef = {
  url: string;
  title?: string | null;
  filename?: string | null;
};

// note: ekstensi harus sama dengan editor FE; node tanpa padanan markdown sengaja tidak dimasukkan
const manager = new MarkdownManager({
  extensions: [
    StarterKit.configure({ underline: false }),
    TaskList,
    TaskItem,
    Table,
    TableRow,
    TableHeader,
    TableCell,
  ],
});

function isDoc(value: unknown): value is ProseMirrorDoc {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'doc'
  );
}

export function attachmentIds(doc: ProseMirrorDoc | null | undefined) {
  const ids = new Set<string>();
  const walk = (node: ProseMirrorDoc) => {
    if (
      node.type === 'attachment' &&
      typeof node.attrs?.attachmentId === 'string'
    ) {
      ids.add(node.attrs.attachmentId);
    }
    node.content?.forEach(walk);
  };
  if (doc) walk(doc);
  return [...ids];
}

function attachmentToParagraph(
  node: ProseMirrorDoc,
  lookup: Map<string, AttachmentRef>,
): ProseMirrorDoc {
  const rawId = node.attrs?.attachmentId;
  const id = typeof rawId === 'string' ? rawId : '';
  const attachment = lookup.get(id);
  if (!attachment) {
    return {
      type: 'paragraph',
      content: [{ type: 'text', text: MISSING_ATTACHMENT }],
    };
  }
  const label = attachment.title || attachment.filename || attachment.url;
  return {
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: label,
        marks: [
          {
            type: 'link',
            attrs: { href: attachment.url, title: `${ATTACHMENT_PREFIX}${id}` },
          },
        ],
      },
    ],
  };
}

function expandAttachments(
  node: ProseMirrorDoc,
  lookup: Map<string, AttachmentRef>,
): ProseMirrorDoc {
  if (node.type === 'attachment') return attachmentToParagraph(node, lookup);
  if (!node.content) return node;
  return {
    ...node,
    content: node.content.map((child) => expandAttachments(child, lookup)),
  };
}

// note: hanya paragraf yang isinya satu link bertanda attachment yang jadi node; yang lain tetap link biasa
function collapseAttachments(node: ProseMirrorDoc): ProseMirrorDoc {
  if (node.type === 'paragraph' && node.content?.length === 1) {
    const [only] = node.content;
    const link = only.marks?.length === 1 ? only.marks[0] : null;
    const title = link?.type === 'link' ? link.attrs?.title : null;
    if (typeof title === 'string' && title.startsWith(ATTACHMENT_PREFIX)) {
      const attachmentId = title.slice(ATTACHMENT_PREFIX.length);
      if (attachmentId) return { type: 'attachment', attrs: { attachmentId } };
    }
  }
  if (!node.content) return node;
  return { ...node, content: node.content.map(collapseAttachments) };
}

export function markdownToDoc(markdown: string): ProseMirrorDoc | null {
  if (!markdown.trim()) return null;
  const parsed: unknown = manager.parse(markdown);
  if (!isDoc(parsed)) return null;
  return collapseAttachments(parsed);
}

export function docToMarkdown(
  doc: ProseMirrorDoc | null | undefined,
  lookup: Map<string, AttachmentRef> = new Map(),
): string {
  if (!doc) return '';
  const markdown = manager.serialize(expandAttachments(doc, lookup));
  return markdown.replace(/\n{3,}/g, '\n\n').trim();
}
