<p align="center">
  <img src="./assets/logo-horizontal.svg" alt="Hypertill DB" width="539" />
</p>

<h1 align="center">Hypertill DB</h1>

<p align="center">
  A reactive database framework for fast, offline-first React and React Native apps.
</p>

<p align="center">
  <a href="https://github.com/helapoint/hypertill-db/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"/>
  </a>
  <a href="https://www.npmjs.com/package/@hypertill/db">
    <img src="https://img.shields.io/npm/v/@hypertill/db.svg" alt="npm"/>
  </a>
</p>

Hypertill DB is a HelaPoint-maintained reactive database framework. It began as a fork of the upstream project and keeps the same runtime architecture: lazy data access, reactive queries, offline-first synchronization primitives, and native SQLite-backed performance.

## Highlights

- Fast launch times, even with large local datasets
- Reactive queries and models for auto-updating UI
- Offline-first architecture with bring-your-own backend sync
- Native SQLite support on iOS, Android, Windows, and Node.js
- LokiJS-backed support for the web
- Framework helpers for React and React Native

## Why Hypertill DB?

Hypertill DB is designed for apps that need local-first reliability without sacrificing responsiveness. Records stay in the database until requested, queries run against the underlying engine instead of loading the whole dataset into JavaScript, and the observation layer keeps your UI current as records change.

This fork keeps the proven upstream model while shifting the package identity, docs, and assets to Hypertill DB for HelaPoint-controlled distribution and customization.

## Usage

**Quick (over-simplified) example:** an app with posts and comments.

First, you define Models:

```js
class Post extends Model {
  @field('name') name
  @field('body') body
  @children('comments') comments
}

class Comment extends Model {
  @field('body') body
  @field('author') author
}
```

Then, you connect components to the data:

```js
const Comment = ({ comment }) => (
  <View style={styles.commentBox}>
    <Text>{comment.body} — by {comment.author}</Text>
  </View>
)

// This is how you make your app reactive! ✨
const enhance = withObservables(['comment'], ({ comment }) => ({
  comment,
}))
const EnhancedComment = enhance(Comment)
```

And now you can render the whole Post:

```js
const Post = ({ post, comments }) => (
  <View>
    <Text>{post.name}</Text>
    <Text>Comments:</Text>
    {comments.map(comment =>
      <EnhancedComment key={comment.id} comment={comment} />
    )}
  </View>
)

const enhance = withObservables(['post'], ({ post }) => ({
  post,
  comments: post.comments
}))
```

The result is fully reactive! Whenever a post or comment is added, changed, or removed, the right components **will automatically re-render** on screen. Doesn't matter if a change occurred in a totally different part of the app, it all just works out of the box!

## Expo apps

Hypertill DB ships its Expo config plugin in the package. For Expo SDK 54+ apps that need the native SQLite and JSI runtime, install the package, enable the decorators Babel plugin, and register `@hypertill/db` in your Expo plugins list.

```bash
npm install @hypertill/db expo-dev-client
npm install -D @babel/plugin-proposal-decorators
```

```json
{
  "expo": {
    "plugins": ["@hypertill/db", "expo-dev-client"]
  }
}
```

```js
module.exports = function (api) {
  api.cache(true)

  return {
    presets: ['babel-preset-expo'],
    plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
  }
}
```

Run the native app with `npx expo run:android` or `npx expo run:ios`.

### Documentation

The docs site lives in [`docs-website`](./docs-website) and the package exports the same core primitives:

- `Database`
- `Collection`
- `Model`
- `Query`
- `Relation`
- schema helpers such as `appSchema()` and `tableSchema()`

## Contributing

Contributions to the fork should preserve API quality and platform compatibility. See [CONTRIBUTING](./CONTRIBUTING.md) for setup, testing, and release workflow details.

If you are migrating from the upstream package, the main changes in this fork are package identity, docs branding, and native library naming.

## Author and license

The upstream project was originally created by Nozbe and led by [Radek Pietruszewski](https://github.com/radex).

The Hypertill DB fork is maintained by [HelaPoint](https://github.com/helapoint).

[See all contributors](https://github.com/helapoint/hypertill-db/graphs/contributors).

Hypertill DB is available under the MIT license. See the [LICENSE file](https://github.com/helapoint/hypertill-db/LICENSE) for more info.
