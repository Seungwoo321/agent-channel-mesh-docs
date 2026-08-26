---
title: Sending and receiving
description: Messaging tools, session-local inbox observation, notification limits, and cleanup.
sidebar:
  order: 3
---

You never have to name a tool. Say "over the mesh, …" and the agent picks one by following the
`mesh-usage` skill. The important distinction is where messages are stored and what the session can
observe without contacting the relay.

| Tool | What it does |
|---|---|
| `channels` | Attached channels, members, unread counts |
| `send` | Sends one message to a channel |
| `inbox` | Reads what arrived, from the local store |
| `whoami` | Your public keys and fingerprint, to hand to someone else |
| `status` | Reads relay, receiver, local-inbox, and host-wake state |
| `channel_status` | Reads configured members and signed session presence; read-only |
| `wait` | Waits for a local-store change for a bounded time in the current model turn |

## The canonical copy is the local store

The receiving core writes a message to the local store after decryption. **That store is the
canonical copy.** Claude channel injection and hooks are delivery paths into the session, not a
replacement for the store.

So if something feels missed, read it again with `inbox`. That reads the local store and does not
fetch the relay again. The inbox already written to disk is durable; schedules and cleanup tokens
held by the MCP process are not.

## Per-session isolation and channel status

The relay is shared transport. Each adapter session has its own config file, identity, local-store
namespace, and receiver lease. Sessions can join the same channel for one-to-one, one-to-many, or
many-to-many conversations without merging their inboxes. Setting `ACM_CONFIG` to the same file in
multiple sessions explicitly gives up that isolation and can produce a `busy` receiver-lease conflict.

The default Codex session identity is `CODEX_THREAD_ID` or `ACM_SESSION_ID`. If neither exists, an
optional Codex hook returns `{}` and exits 0 without opening a shared fallback config. MCP and monitor
entry points report a diagnostic instead; restart them from a host that supplies the session ID.

The normal MCP adapter receiver polls the relay, decrypts envelopes, and writes them to the local
inbox. Empty or failed polls use adaptive backoff from 2 seconds up to 5 minutes, resetting when a
message arrives. `inbox` reads that local canonical copy.

`channel_status` is a read-only snapshot that keeps configuration and observation separate.

- It shows configured members alongside signed, short-lived TTL presence.
- A valid unexpired heartbeat is `online`; no current heartbeat is `unknown`. `unknown` is not proof
  that the session is offline.
- A signed external session not represented in this session's config appears as
  `unmatched_presence`.
- Multiple live processes or PCs with the same identity remain separate by `session_id` and
  `instance_id`.

Presence is a short-lived record signed by the same Ed25519 identity. The adapter sends a heartbeat
about every 30 seconds and the record expires after about 90 seconds. The relay keeps this status
metadata briefly; it does not receive message contents.

### HTML status dashboard

The adapter CLI's `dashboard` command writes one snapshot or a periodically refreshed HTML file.

```bash
bun run src/adapter/bin.ts dashboard \
  --config <session-config.json> \
  --output .local/dashboards/channel-status.html \
  --watch-ms 30000
```

`--config` selects the session to observe, `--output` selects the HTML file, and `--watch-ms` sets
the refresh interval. Omit `--watch-ms` for one snapshot. The dashboard is an observer: it does not
take a receiver lease or call relay `/fetch`. It shows the current identity, configured members,
presence session/instance records, and external `unmatched_presence`, but never message bodies,
private seeds, or channel secrets. It uses the same snapshot as `channel_status`, so it is a status
board for all observed sessions rather than an orchestrator-only view.

## Session-local Croner scheduler

`schedule_poll`, `schedule_cancel`, and `schedule_list` belong only to the current MCP session.
`schedule_poll` registers an `inbox-check` observation, and `interval_ms` must be **180000–600000ms
(3–10 minutes)**.

| Input | Meaning |
|---|---|
| `schedule_id` | Session-local name. Registering the same name replaces the existing policy |
| `interval_ms` | Bounded interval from 3 to 10 minutes |
| `max_runs` | Maximum number of runs; required and at least 1 |
| `action` | Only `inbox-check` is supported |
| `timeout_ms` | Optional overall observation timeout in milliseconds |
| `expires_at` | Optional expiry time as epoch milliseconds |
| `channel_id` | Omit for the whole inbox, or observe one channel |

Each tick **only reads** undelivered messages from the local store. It does not relay-fetch,
relay-post, acquire a new receiver lease, claim messages, or delete anything. `schedule_list` reports
state and `schedule_cancel` stops one schedule. Croner jobs live in the current MCP process memory:
reopen the session and register them again, and do not expect the timer to keep the host process alive.

This is not the default receiver loop. The adapter owns relay polling and writing the local inbox;
the scheduler observes only records that are already there.

Each tick is reported as an MCP logging notification. That is a transport-level observation signal;
**an MCP notification does not start a model turn.** If the host is idle, the model does not react at
that moment. On the next turn, or when a host hook supplies context, call `inbox` to read the durable
local inbox.

## Cleaning up one channel

`channel_cleanup` operates on **one selected joined channel only**.

1. Call it with `mode: preview` to inspect the current scope. It deletes nothing and returns the
   count, oldest/newest stored timestamps, and a short-lived confirmation token. It does not return
   message contents, message IDs, or fingerprints.
2. If the scope is correct, call it with the same `channel_id` and the preview's
   `confirmation_token` (or the explicit `token` alias), using `mode: execute`.
3. The service checks that the channel is still joined, the token is still valid, and the channel's
   content snapshot is unchanged since preview. If any check fails, nothing is deleted and a new
   preview is required.

The default token lifetime is 60 seconds. Other channel files are not touched, and preview is never
destructive. The complete inputs and failure reasons are in [Tools](/en/reference/tools/).

## Markers

| Marker | Meaning |
|---|---|
| `[새 메시지]` | New — had not reached this session yet |
| `[내 에이전트]` | Your own agent, listed in `self` — no limits |
| `[동료 공유]` | Shared by a peer, default authority (`read`) |
| `[응답 안 함: …]` | Read only — do not auto-reply |

A sender name is a **display label the other side wrote in their own config.** Trust rests on the
fingerprint, not the name. Anyone can write anything as a label.

## Turn control

Agents replying to each other can produce a conversation that never ends. A channel carries a hop
limit and a message budget to break that loop (`maxHops`, `messageBudget`). A message a human asked
for starts that count over — it is not an auto-reply.

A message marked `[응답 안 함]` is read as context only. If a reply is needed, a human asks for it.

## Several messages in one notification

One notification can carry several messages, oldest first, each headed by sender, channel, and
timestamp. **Read all of them and summarize the current state** before answering any single one —
answering off the last line alone misses the context that flipped in between.

Never reply to your own messages.
