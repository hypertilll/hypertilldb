---
title: 'Setup'
hide_title: true
---

# Set up your app for Hypertill DB

Make sure you [installed Hypertill](./Installation.mdx) before proceeding.

Create `model/schema.js` in your project. You'll need it for [the next step](./Schema.md).

```js
import { appSchema, tableSchema } from '@hypertill/db'

export default appSchema({
  version: 1,
  tables: [
    // We'll add tableSchemas here later
  ]
})
```

Similarly, create `model/migrations.js`. ([More information about migrations](./Advanced/Migrations.md)):

```js
import { schemaMigrations } from '@hypertill/db/Schema/migrations'

export default schemaMigrations({
  migrations: [
    // We'll add migration definitions here later
  ],
})
```

Now, in your `index.native.js`:

```js
import { Platform } from 'react-native'
import { Database } from '@hypertill/db'
import SQLiteAdapter from '@hypertill/db/adapters/sqlite'

import schema from './model/schema'
import migrations from './model/migrations'
// import Post from './model/Post' // ⬅️ You'll import your Models here

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
  schema,
  // (You might want to comment it out for development purposes -- see Migrations documentation)
  migrations,
  // (optional database name or file system path)
  // dbName: 'myapp',
  // (recommended option, should work flawlessly out of the box on iOS. On Android,
  // additional installation steps have to be taken - disable if you run into issues...)
  jsi: true, /* Platform.OS === 'ios' */
  // (optional, but you should implement this method)
  onSetUpError: error => {
    // Database failed to load -- offer the user to reload the app or log out
  }
})

// Then, make a Hypertill database from it!
const database = new Database({
  adapter,
  modelClasses: [
    // Post, // ⬅️ You'll add Models to Hypertill here
  ],
})
```

The above will work on React Native (iOS/Android) and NodeJS. For the web, instead of `SQLiteAdapter` use `LokiJSAdapter`:

```js
import LokiJSAdapter from '@hypertill/db/adapters/lokijs'

const adapter = new LokiJSAdapter({
  schema,
  // (You might want to comment out migrations for development purposes -- see Migrations documentation)
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  // dbName: 'myapp', // optional db name

  // --- Optional, but recommended event handlers:

  onQuotaExceededError: (error) => {
    // Browser ran out of disk space -- offer the user to reload the app or log out
  },
  onSetUpError: (error) => {
    // Database failed to load -- offer the user to reload the app or log out
  },
  extraIncrementalIDBOptions: {
    onDidOverwrite: () => {
      // Called when this adapter is forced to overwrite contents of IndexedDB.
      // This happens if there's another open tab of the same app that's making changes.
      // Try to synchronize the app now, and if user is offline, alert them that if they close this
      // tab, some data may be lost
    },
    onversionchange: () => {
      // database was deleted in another browser tab (user logged out), so we must make sure we delete
      // it in this tab as well - usually best to just refresh the page
      if (checkIfUserIsLoggedIn()) {
        window.location.reload()
      }
    },
  }
})

// The rest is the same!
```

* * *

## Next steps

➡️ After Hypertill is installed, [**define your app's schema**](./Schema.md)
