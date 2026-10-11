import {
  attachmentIds,
  docToMarkdown,
  markdownToDoc,
  type AttachmentRef,
} from './note-markdown';

const ID = '2f6c0d2e-1111-4222-8333-444455556666';
const lookup = new Map<string, AttachmentRef>([
  [ID, { url: 'https://figma.com/file/abc', title: 'Figma detail pane' }],
]);

describe('note-markdown', () => {
  it('returns null for blank markdown and an empty string for a null doc', () => {
    expect(markdownToDoc('  \n')).toBeNull();
    expect(docToMarkdown(null)).toBe('');
  });

  it('round-trips headings, lists, task lists and links', () => {
    const md = [
      '## Acceptance criteria',
      '',
      '- satu',
      '- dua',
      '',
      '- [ ] belum',
      '- [x] sudah',
      '',
      'Lihat [PR](https://github.com/o/r/pull/1) **penting**',
    ].join('\n');
    const doc = markdownToDoc(md)!;
    expect(doc.type).toBe('doc');
    expect(docToMarkdown(doc)).toBe(md);
  });

  it('round-trips a GFM table', () => {
    const md = '| a   | b   |\n| --- | --- |\n| 1   | 2   |';
    const doc = markdownToDoc(md)!;
    expect(doc.content?.[0].type).toBe('table');
    expect(docToMarkdown(doc)).toBe(md);
  });

  it('turns a marked standalone link into an attachment node and back', () => {
    const md = `[Figma detail pane](https://figma.com/file/abc "attachment:${ID}")`;
    const doc = markdownToDoc(md)!;
    expect(doc.content).toEqual([
      { type: 'attachment', attrs: { attachmentId: ID } },
    ]);
    expect(attachmentIds(doc)).toEqual([ID]);
    expect(docToMarkdown(doc, lookup)).toBe(md);
  });

  it('keeps attachment nodes when an appended section is parsed again', () => {
    const base = docToMarkdown(
      {
        type: 'doc',
        content: [{ type: 'attachment', attrs: { attachmentId: ID } }],
      },
      lookup,
    );
    const next = markdownToDoc(`${base}\n\n## Agent note\n\nSelesai.`)!;
    expect(next.content?.[0]).toEqual({
      type: 'attachment',
      attrs: { attachmentId: ID },
    });
    expect(next.content).toHaveLength(3);
  });

  it('keeps a plain link inside a sentence as a link', () => {
    const doc = markdownToDoc(
      `lihat [x](https://e.com "attachment:${ID}") ya`,
    )!;
    expect(attachmentIds(doc)).toEqual([]);
  });

  it('renders a deleted attachment as text', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'attachment', attrs: { attachmentId: 'gone' } }],
    };
    expect(docToMarkdown(doc)).toBe('(attachment dihapus)');
  });
});
