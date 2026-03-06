---
title: Contributing
hide_title: true
---

<img src="https://github.com/helapoint/hypertill-db/raw/master/assets/needyou.jpg" alt="We need you" width="220" />

**Hypertill DB is an open-source project and it needs your help to thrive!**

If there's a missing feature, a bug, or other improvement you'd like, we encourage you to contribute. Feel free to open an issue to get guidance, and use this guide for project setup, testing, and release details.

If you're just getting started, see [good first issues](https://github.com/helapoint/hypertill-db/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) that are easy to contribute to.

If you make or are considering making an app using Hypertill DB, please let us know!

<br />


## Before you send a pull request

1. Did you add or changed some functionality?

   Add (or modify) tests!
2. Check if the automated tests pass
   ```bash
   yarn ci:check
   ```
3. Format the files you changed
   ```bash
   yarn prettier
   ```
4. Mark your changes in CHANGELOG

   Put a one-line description of your change under Added/Changed section. See [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Running Hypertill in development

### Download source and dependencies

```bash
git clone https://github.com/helapoint/hypertill-db.git
cd hypertill-db
yarn
```

### Developing Hypertill alongside your app

To work on Hypertill code in the sandbox of your app:

```bash
yarn dev
```

This will create a `dev/` folder in the repository and watch JavaScript source files, recompiling them as needed.

Then in your app:

```bash
mkdir -p node_modules/@hypertill
cd node_modules/@hypertill
rm -fr db
ln -s /path/to/hypertill-db/dev db
```

**This will work in Webpack but not in Metro** (React Native). Metro doesn't follow symlinks. Instead, you can compile Hypertill DB directly to your project:

```bash
DEV_PATH="/path/to/your/app/node_modules/@hypertill/db" yarn dev
```

### Running tests

This runs Jest, ESLint and Flow:

```bash
yarn ci:check
```

You can also run them separately:

```bash
yarn test
yarn eslint
yarn flow
```

### Editing files

We recommend VS Code with ESLint, Flow, and Prettier (with prettier-eslint enabled) plugins for best development experience. (To see lint/type issues inline + have automatic reformatting of code)

## Editing native code

In `native/ios` and `native/android` you'll find the native bridge code for React Native.

It's recommended to use the latest stable version of Xcode / Android Studio to work on that code.

### Integration tests

If you change native bridge code or `adapter/sqlite` code, it's recommended to run integration tests that run the entire Hypertill code with SQLite and React Native in the loop:

```bash
yarn test:ios
yarn test:android
```

### Running tests manually

- For iOS open the `native/iosTest/HypertillTester.xcworkspace` project and hit Cmd+U.
- For Android open `native/androidTest` in Android Studio, navigate to `app/src/androidTest/java/com/hypertill/hypertillTest/BridgeTest.kt`, and click the green arrow near `class BridgeTest`

### Native linting

Make sure the native code you're editing conforms to Hypertill standards:

```bash
yarn ktlint
```

### Native code troubleshooting

1. If `test:ios` fails in terminal:
- Run tests in Xcode first before running from terminal
- Make sure you have the right version of Xcode CLI tools set in Preferences -> Locations
1. Make sure you're on the most recent stable version of Xcode / Android Studio
1. Remove native caches:
- Xcode: `~/Library/Developer/Xcode/DerivedData`:
- Android: `.gradle` and `build` folders in `native/android` and `native/androidTest`
- `node_modules` (because of React Native precompiled third party libraries)
