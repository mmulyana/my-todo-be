# Tutorial: Menambah Fitur Baru di NestJS + GraphQL (Step by Step)

Tutorial ini ngajarin cara nambah fitur baru dari nol sampai jalan, sambil ngerti
**konsep GraphQL-nya** (Query vs Mutation, Input, ObjectType, Resolver, ResolveField).

Kita pakai contoh nyata: **fitur Comment** — satu Todo bisa punya banyak Comment.
Konsepnya sama persis kayak waktu kita nambah `Project` kemarin, jadi kamu bisa
ikutin pola ini buat fitur apapun (Tag, Label, Attachment, dll).

---

## Konsep Dasar Dulu: GraphQL Itu Apa?

Sebelum ngoding, paham dulu 4 "bahan" utama di GraphQL:

| Konsep | REST setara | Fungsi |
|--------|-------------|--------|
| **Query** | `GET` | Ambil/baca data (tidak mengubah apapun) |
| **Mutation** | `POST/PATCH/DELETE` | Mengubah data (create, update, delete) |
| **ObjectType** | Response body shape | Bentuk data yang DIKEMBALIKAN ke client |
| **InputType** | Request body shape | Bentuk data yang DIKIRIM client ke server |

Aturan emas GraphQL: **client yang menentukan field apa yang mau diambil.**
Server cuma menyediakan "menu" (schema), client milih sendiri mau ambil apa.

```graphql
# Client minta cuma id & title → server cuma kirim itu
query {
  todos {
    id
    title
  }
}
```

---

## Gambaran Alur Request

```
Client (Apollo Sandbox / Frontend)
        │  kirim query/mutation
        ▼
  Resolver  ◄── pintu masuk GraphQL (mirip Controller di REST)
        │  panggil
        ▼
   Service  ◄── business logic (validasi, aturan)
        │  panggil
        ▼
 PrismaService ──► Database
```

Jadi setiap fitur baru biasanya butuh 6 file:

1. **Prisma schema** — definisi tabel di database
2. **Model** (`*.model.ts`) — ObjectType, bentuk OUTPUT
3. **Input** (`*.input.ts`) — InputType, bentuk INPUT
4. **Service** (`*.service.ts`) — logic + query ke database
5. **Resolver** (`*.resolver.ts`) — Query & Mutation
6. **Module** (`*.module.ts`) — daftarin semua di atas

Yuk kita kerjain satu-satu pakai contoh **Comment**.

---

## Langkah 1 — Definisikan Tabel di Prisma

Buka `prisma/schema.prisma`, tambahkan model `Comment` dan relasinya ke `Todo`.

```prisma
model Todo {
  id        String   @id @default(uuid())
  title     String
  // ... field lain yang sudah ada

  comments Comment[]   // satu todo punya banyak comment
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())

  todoId String
  todo   Todo   @relation(fields: [todoId], references: [id])
}
```

Penjelasan relasi:
- `comments Comment[]` di Todo = sisi "one" (satu todo → banyak comment)
- `todoId String` = foreign key di tabel comment
- `todo Todo` = sisi "many" (comment → satu todo)

Setelah ubah schema, **wajib** jalankan migration + generate client:

```bash
npx prisma migrate dev --name add_comment_model
npx prisma generate
```

> `migrate dev` = bikin & jalanin perubahan ke database.
> `generate` = update Prisma Client biar TypeScript kenal model `comment`.

---

## Langkah 2 — Buat Model (ObjectType = bentuk OUTPUT)

Ini yang DIKEMBALIKAN ke client. Bikin folder `src/comments/models/`.

```typescript
// src/comments/models/comment.model.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Todo } from '../../todos/models/todo.model';

@ObjectType()
export class Comment {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;

  @Field(() => String, { nullable: true })
  todoId?: string | null;

  @Field(() => Todo, { nullable: true })
  todo?: Todo | null;
}
```

**Inti konsepnya:**
- `@ObjectType()` = "ini sebuah tipe GraphQL yang bisa dikembalikan"
- `@Field()` = field yang muncul di schema dan boleh diminta client
- Field yang TIDAK dikasih `@Field()` → tidak akan kelihatan di GraphQL

---

## Langkah 3 — Buat Input (InputType = bentuk INPUT)

Ini yang DIKIRIM client saat create/update. Bikin folder `src/comments/dto/`.

```typescript
// src/comments/dto/create-comment.input.ts
import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class CreateCommentInput {
  @Field()
  content: string;

  @Field(() => ID)
  todoId: string;   // comment harus nempel ke todo mana
}
```

```typescript
// src/comments/dto/update-comment.input.ts
import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateCommentInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  content?: string;
}
```

**Kenapa Input dan Model dipisah?**
- Model (`@ObjectType`) = data keluar. Bisa punya field hasil komputasi/relasi.
- Input (`@InputType`) = data masuk. Cuma field yang boleh diisi client.
- Misal `id`, `createdAt` itu di-generate server → tidak boleh ada di CreateInput.

> Catatan: file `.dto.ts` (plain class tanpa decorator) cuma dibutuhkan kalau kamu
> juga bikin endpoint REST (Controller). Kalau cuma GraphQL, `.input.ts` saja cukup.

---

## Langkah 4 — Buat Service (logic + database)

Service tempat semua interaksi ke database lewat Prisma.

```typescript
// src/comments/comments.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  create(input: CreateCommentInput) {
    return this.prisma.comment.create({
      data: {
        content: input.content,
        todoId: input.todoId,
      },
    });
  }

  // READ (semua)
  findAll() {
    return this.prisma.comment.findMany();
  }

  // READ (satu)
  findOne(id: string) {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  // READ (semua comment milik 1 todo) — dipakai ResolveField nanti
  findByTodoId(todoId: string) {
    return this.prisma.comment.findMany({ where: { todoId } });
  }

  // UPDATE
  update(id: string, input: UpdateCommentInput) {
    return this.prisma.comment.update({
      where: { id },
      data: { content: input.content },
    });
  }

  // DELETE
  remove(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }
}
```

**Inti:** Service tidak tahu soal GraphQL. Dia cuma logic murni + Prisma.
Ini bagus karena bisa dipakai ulang (REST, cron job, dll).

---

## Langkah 5 — Buat Resolver (Query & Mutation) ⭐

Ini bagian paling penting buat ngerti GraphQL. Resolver = "pintu masuk".

```typescript
// src/comments/comments.resolver.ts
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { CommentsService } from './comments.service';
import { Comment } from './models/comment.model';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { Todo } from '../todos/models/todo.model';
import { TodosService } from '../todos/todos.service';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly todosService: TodosService,
  ) {}

  // ===== QUERY (baca data) =====

  // Schema jadi: comments: [Comment!]!
  @Query(() => [Comment], { name: 'comments' })
  findAll() {
    return this.commentsService.findAll();
  }

  // Schema jadi: comment(id: ID!): Comment
  @Query(() => Comment, { name: 'comment', nullable: true })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.commentsService.findOne(id);
  }

  // ===== MUTATION (ubah data) =====

  // Schema jadi: createComment(input: CreateCommentInput!): Comment!
  @Mutation(() => Comment)
  createComment(@Args('input') input: CreateCommentInput) {
    return this.commentsService.create(input);
  }

  // Schema jadi: updateComment(input: UpdateCommentInput!): Comment!
  @Mutation(() => Comment)
  updateComment(@Args('input') input: UpdateCommentInput) {
    return this.commentsService.update(input.id, input);
  }

  // Schema jadi: removeComment(id: ID!): Comment!
  @Mutation(() => Comment)
  removeComment(@Args('id', { type: () => ID }) id: string) {
    return this.commentsService.remove(id);
  }

  // ===== RESOLVE FIELD (relasi, lazy-load) =====

  // Cuma jalan kalau client minta field "todo" di dalam comment
  @ResolveField(() => Todo, { nullable: true })
  todo(@Parent() comment: Comment) {
    if (!comment.todoId) return null;
    return this.todosService.findOne(comment.todoId);
  }
}
```

### Bedah konsepnya:

**`@Query(() => Type, { name })`**
- Mendefinisikan operasi BACA.
- `() => [Comment]` = return type (array of Comment).
- `{ name: 'comments' }` = nama operasi yang dipanggil client.

**`@Mutation(() => Type)`**
- Mendefinisikan operasi UBAH (create/update/delete).
- Secara teknis sama aja kayak Query, bedanya cuma **niat/semantik**: mutation
  itu buat yang mengubah data.

**`@Args('input')`**
- Ngambil argument dari client. `input` = nama argumentnya.
- `@Args('id', { type: () => ID })` = argument bernama `id` bertipe ID.

**`@ResolveField()` + `@Parent()`**
- Buat relasi yang di-load HANYA kalau diminta.
- `@Parent()` = object induknya (comment yang lagi diproses).
- Ini yang bikin GraphQL hemat: kalau client gak minta `todo`, query ke DB-nya
  gak jalan.

---

## Langkah 6 — Daftarkan di Module

```typescript
// src/comments/comments.module.ts
import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { TodosService } from '../todos/todos.service';

@Module({
  providers: [CommentsService, CommentsResolver, TodosService],
})
export class CommentsModule {}
```

Lalu import ke `AppModule`:

```typescript
// src/app.module.ts
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    // ... module lain
    CommentsModule,
  ],
})
export class AppModule {}
```

> Karena resolver Comment butuh `TodosService` (buat resolve field `todo`), kita
> daftarkan juga di providers. Alternatif lebih rapi: bikin `TodosModule` meng-export
> `TodosService`, lalu `CommentsModule` tinggal `imports: [TodosModule]`.

---

## Langkah 7 — Tambah relasi di sisi Todo (opsional tapi recommended)

Biar dari Todo bisa ambil comments-nya. Tambah di `todo.model.ts`:

```typescript
@Field(() => [Comment])
comments?: Comment[];
```

Dan di `todos.resolver.ts` tambah ResolveField:

```typescript
@ResolveField(() => [Comment])
comments(@Parent() todo: Todo) {
  return this.commentsService.findByTodoId(todo.id);
}
```

Sekarang relasi jalan dua arah: `todo.comments` dan `comment.todo`.

---

## Langkah 8 — Restart & Test

```bash
npm run start:dev
```

Buka `http://localhost:3000/graphql` (Apollo Sandbox), lalu coba:

### Test Mutation (create)

```graphql
mutation {
  createComment(input: { content: "Mantap nih!", todoId: "todo-id-disini" }) {
    id
    content
    createdAt
    todo {
      id
      title
    }
  }
}
```

### Test Query (baca)

```graphql
query {
  comments {
    id
    content
    todo {
      title
    }
  }
}
```

### Test relasi dari Todo

```graphql
query {
  todos {
    id
    title
    comments {
      id
      content
    }
  }
}
```

---

## Checklist Nambah Fitur Baru (Ringkasan)

Setiap kali mau nambah fitur (entity) baru, ikutin urutan ini:

- [ ] 1. Tambah model di `prisma/schema.prisma`
- [ ] 2. `npx prisma migrate dev --name xxx` lalu `npx prisma generate`
- [ ] 3. Bikin `models/xxx.model.ts` (`@ObjectType` — output)
- [ ] 4. Bikin `dto/create-xxx.input.ts` & `dto/update-xxx.input.ts` (`@InputType`)
- [ ] 5. Bikin `xxx.service.ts` (logic + Prisma)
- [ ] 6. Bikin `xxx.resolver.ts` (`@Query`, `@Mutation`, `@ResolveField`)
- [ ] 7. Bikin `xxx.module.ts` dan import ke `AppModule`
- [ ] 8. (Opsional) tambah relasi balik + ResolveField di entity terkait
- [ ] 9. Restart server, test di Apollo Sandbox

---

## Cheat Sheet Decorator GraphQL

| Decorator | Dipakai di | Fungsi |
|-----------|-----------|--------|
| `@ObjectType()` | class model | Tandai tipe OUTPUT GraphQL |
| `@InputType()` | class input | Tandai tipe INPUT GraphQL |
| `@Field()` | property | Expose field ke schema |
| `@Resolver(() => Type)` | class resolver | Tandai class sbg resolver utk Type |
| `@Query(() => Type)` | method | Operasi BACA data |
| `@Mutation(() => Type)` | method | Operasi UBAH data |
| `@Args('name')` | parameter | Ambil argument dari client |
| `@ResolveField(() => Type)` | method | Resolve relasi (lazy load) |
| `@Parent()` | parameter | Akses object induk di ResolveField |

---

## Tips Mikir "Query vs Mutation"

Tanya ke diri sendiri:

> "Operasi ini MENGUBAH data di database gak?"

- **Tidak** (cuma baca) → `@Query`
- **Ya** (create/update/delete) → `@Mutation`

Contoh:
- Ambil daftar comment → Query
- Hitung jumlah comment → Query (cuma baca)
- Bikin comment baru → Mutation
- Edit isi comment → Mutation
- Hapus comment → Mutation

Gampang kan? Pola ini berlaku buat semua fitur. Selamat ngoding! 🚀
