---
title: Automatic create/update tracking
hide_title: true
---

# Create/Update tracking

Hypertill DB exposes built-in timestamp getters on every `Model`, so records can tell you when they were created, updated, or marked as deleted without repeating decorators on each class.

:warning: **Note:** Hypertill DB automatically sets and persists the `created_at`/`updated_at` fields as _millisecond_ epochs when those columns exist. If you bootstrap with `createPlatformAdapter()`, those columns are injected for you automatically.

### When to use this

**Use create tracking**:

- When you display to the user when a thing (e.g. a Post, Comment, Task) was created
- If you sort created items chronologically (Note that Record IDs are random strings, not auto-incrementing integers, so you need create tracking to sort chronologically)

**Use update tracking**:

- When you display to the user when a thing (e.g. a Post) was modified

**Notes**:
- you _don't have to_ enable both create and update tracking. You can do either, both, or none.
- `createdAt`, `updatedAt`, and `deletedAt` are reserved getters on every `Model`.
- avoid reusing those property names for unrelated columns.

### How to do this

**Step 1:** Make sure the table has `created_at` / `updated_at`:

```js
tableSchema({
  name: 'posts',
  columns: [
    // other columns
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ]
}),
```

If you use `createPlatformAdapter()`, you can skip this schema step because those metadata columns are injected automatically.

**Step 2:** No per-model declaration is required:

```js
class Post extends Model {
  // ...
}
```

You can read the built-in getters directly:

```js
post.createdAt // Date | null
post.updatedAt // Date | null
post.deletedAt // Date | null
```

Again, you can add just `created_at` if you only need create tracking, or skip `updated_at` if you do not need update tracking.

### How this behaves

If the table has `created_at`, the current timestamp is set when you first call `collection.create()` or `collection.prepareCreate()`. It will never be modified again.

If the table also has `updated_at`, then after creation, `model.updatedAt` will have the same value as `model.createdAt`. Then every time you call `model.update()` or `model.prepareUpdate()`, `updatedAt` will be changed to the current timestamp.

If the table has `deleted_at`, `model.deletedAt` is set when you call `model.markAsDeleted()` or `model.prepareMarkAsDeleted()`.
