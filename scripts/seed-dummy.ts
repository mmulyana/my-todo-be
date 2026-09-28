import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as schema from '../src/db/schema';

const DUMMY_EMAIL = 'dummy@mytodo.dev';
const DUMMY_USERNAME = 'dummy';
const DUMMY_PASSWORD = 'password123';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, DUMMY_EMAIL),
  });
  if (existing) {
    console.log(`User ${DUMMY_EMAIL} sudah ada, hapus dulu data lamanya...`);
    await db.delete(schema.todos).where(eq(schema.todos.userId, existing.id));
    await db
      .delete(schema.milestones)
      .where(eq(schema.milestones.userId, existing.id));
    await db
      .delete(schema.kanbanColumns)
      .where(eq(schema.kanbanColumns.userId, existing.id));
    await db.delete(schema.lists).where(eq(schema.lists.userId, existing.id));
    await db
      .delete(schema.documents)
      .where(eq(schema.documents.userId, existing.id));
    await db
      .delete(schema.projects)
      .where(eq(schema.projects.userId, existing.id));
    await db.delete(schema.users).where(eq(schema.users.id, existing.id));
  }

  const hashedPassword = await bcrypt.hash(DUMMY_PASSWORD, 10);
  const [user] = await db
    .insert(schema.users)
    .values({
      email: DUMMY_EMAIL,
      username: DUMMY_USERNAME,
      password: hashedPassword,
    })
    .returning();
  console.log('User dibuat:', user.email);

  const [project] = await db
    .insert(schema.projects)
    .values({
      code: 'DEMO',
      name: 'Demo Project',
      color: '#6366f1',
      description: 'Project dummy untuk testing FE',
      userId: user.id,
    })
    .returning();

  const [list1] = await db
    .insert(schema.lists)
    .values({ name: 'Belanja Bulanan', userId: user.id })
    .returning();
  const [list2] = await db
    .insert(schema.lists)
    .values({ name: 'Personal', userId: user.id })
    .returning();

  const kanbanColumnsData = [
    { name: 'To Do', position: 0 },
    { name: 'In Progress', position: 1 },
    { name: 'Done', position: 2 },
  ];
  const kanbanColumns = await db
    .insert(schema.kanbanColumns)
    .values(
      kanbanColumnsData.map((c) => ({
        ...c,
        projectId: project.id,
        userId: user.id,
      })),
    )
    .returning();

  const milestonesData = [
    { name: 'MVP Launch', dueDate: '2026-10-15', position: 0 },
    { name: 'Beta Release', dueDate: '2026-11-30', position: 1 },
  ];
  const milestones = await db
    .insert(schema.milestones)
    .values(
      milestonesData.map((m) => ({
        ...m,
        projectId: project.id,
        userId: user.id,
      })),
    )
    .returning();

  await db.insert(schema.documents).values({
    title: 'Catatan Project',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Ini dokumen dummy untuk testing.' }],
        },
      ],
    },
    projectId: project.id,
    userId: user.id,
  });

  const todosData = [
    {
      title: 'Setup repository',
      note: 'Init repo dan CI',
      completed: true,
      important: false,
      priority: 2,
      kanbanColumnId: kanbanColumns[2].id,
      milestoneId: milestones[0].id,
      projectId: project.id,
    },
    {
      title: 'Desain database schema',
      note: '',
      completed: true,
      important: false,
      priority: 2,
      kanbanColumnId: kanbanColumns[2].id,
      milestoneId: milestones[0].id,
      projectId: project.id,
    },
    {
      title: 'Implementasi fitur milestone',
      note: 'Tambah CRUD milestone + relasi ke todo',
      completed: false,
      important: true,
      priority: 1,
      kanbanColumnId: kanbanColumns[1].id,
      milestoneId: milestones[0].id,
      projectId: project.id,
    },
    {
      title: 'Testing fitur milestone di FE',
      note: '',
      completed: false,
      important: false,
      priority: 3,
      kanbanColumnId: kanbanColumns[0].id,
      milestoneId: milestones[0].id,
      projectId: project.id,
    },
    {
      title: 'Siapkan materi beta',
      note: '',
      completed: false,
      important: false,
      priority: null,
      kanbanColumnId: kanbanColumns[0].id,
      milestoneId: milestones[1].id,
      projectId: project.id,
    },
    {
      title: 'Beli susu',
      note: '',
      completed: false,
      important: false,
      priority: null,
      listId: list1.id,
      today: new Date().toISOString().slice(0, 10),
    },
    {
      title: 'Beli telur',
      note: '',
      completed: false,
      important: true,
      priority: null,
      listId: list1.id,
    },
    {
      title: 'Olahraga pagi',
      note: 'Lari 5km',
      completed: false,
      important: false,
      priority: null,
      listId: list2.id,
      today: new Date().toISOString().slice(0, 10),
    },
    {
      title: 'Baca buku',
      note: '',
      completed: true,
      important: false,
      priority: null,
      listId: list2.id,
    },
  ];

  await db.insert(schema.todos).values(
    todosData.map((t, i) => ({
      ...t,
      position: i,
      listPosition: i,
      userId: user.id,
    })),
  );

  console.log('Seed selesai.');
  console.log('---');
  console.log('Login dummy:');
  console.log('  email   :', DUMMY_EMAIL);
  console.log('  password:', DUMMY_PASSWORD);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
