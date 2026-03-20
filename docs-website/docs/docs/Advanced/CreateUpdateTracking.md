---
title: Automatic create/update tracking
hide_title: true
---

# Create/Update tracking

You can expose per-table create/update tracking on the Model. When you do this, the Model will have information about when it was created, and when it was last updated.

:warning: **Note:** Hypertill DB automatically sets and persists the `created_at`/`updated_at` fields as _millisecond_ epochs when those columns exist. If you bootstrap with `createPlatformAdapter()`, those columns are injected for you automatically.

### When to use this

**Use create tracking**:

- When you display to the user when a thing (e.g. a Post, Comment, Task) was created
- If you sort created items chronologically (Note that Record IDs are random strings, not auto-incrementing integers, so you need create tracking to sort chronologically)

**Use update tracking**:

- When you display to the user when a thing (e.g. a Post) was modified

**Notes**:
 - you _don't have to_ enable both create and update tracking. You can do either, both, or none.
 - In your model, these fields need to be called createdAt and updatedAt respectively.

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

**Step 2:** Add this to the Model definition:

```js
import { date, readonly } from '@hypertill/db/decorators'

class Post extends Model {
  // ...
  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt
}
```

Again, you can add just `created_at` column and field if you don't need update tracking.

### How this behaves

If you have the magic `createdAt` field defined on the Model, the current timestamp will be set when you first call `collection.create()` or `collection.prepareCreate()`. It will never be modified again.

If the magic `updatedAt` field is also defined, then after creation, `model.updatedAt` will have the same value as `model.createdAt`. Then every time you call `model.update()` or `model.prepareUpdate()`, `updatedAt` will be changed to the current timestamp.
