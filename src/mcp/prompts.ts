import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    'daily_plan',
    {
      title: 'Daily plan',
      description:
        'Susun rencana hari ini dari todo user, urutkan by dueDate & important.',
    },
    () => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: 'Pakai list_todos (view: "today") untuk ambil todo hari ini, lalu susun jadi rencana yang diurutkan: yang important dulu, lalu berdasarkan dueDate. Cek juga list_todos (view: "all", completed: false) untuk todo yang dueDate-nya sudah lewat hari ini (overdue) dan sertakan itu di bagian atas.',
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'weekly_review',
    {
      title: 'Weekly review',
      description: 'Ringkas todo yang selesai minggu ini dan yang overdue.',
    },
    () => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: 'Pakai list_todos (completed: true) dan list_todos (completed: false) untuk menyusun ringkasan mingguan: apa yang sudah selesai, apa yang masih overdue (dueDate sebelum hari ini dan belum completed), dan rekomendasi prioritas untuk minggu depan.',
          },
        },
      ],
    }),
  );
}
