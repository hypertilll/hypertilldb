---
title: Intro
hide_title: true
---

# Synchronization

Hypertill DB has been designed from scratch to be able to seamlessly synchronize with a remote database (and, therefore, keep multiple copies of data synced with each other).

Note that Hypertill is only a local database — you need to **bring your own backend**. What Hypertill provides are:

- **Synchronization primitives** — information about which records were created, updated, or deleted locally since the last sync — and which columns exactly were modified. You can build your own custom sync engine using those primitives
- **Built-in sync adapter** — You can use the sync engine Hypertill provides out of the box, and you only need to provide two API endpoints on your backend that conform to Hypertill sync protocol

To implement synchronization between your client side database (Hypertill DB) and your server, you need to implement synchronization in the [frontend](../Sync/Frontend.md) & the [backend](../Sync/Backend.md).
