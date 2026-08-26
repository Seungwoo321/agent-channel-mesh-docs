---
title: Tools
description: The MCP tools for messaging, local inbox observation, and channel cleanup.
sidebar:
  order: 1
---

Which tools appear depends on whether a config exists. Without an identity you can neither send nor
read, so the mesh tools do not appear at all. `inbox` is available in delivery modes that expose the
inbox.

## Messaging and state

| Tool | What it does |
|---|---|
| `channels` | Shows attached channels and members |
| `send` | Sends one message to `channel_id` |
| `inbox` | Reads arrived messages from the local store; it does not fetch the relay again |
| `whoami` | Shows your `sign` and `kem` public keys and fingerprint |
| `status` | Reads relay, receiver, local-inbox, delivery, and host-wake state |
| `channel_status` | Reads configured members and signed session presence; read-only |
| `wait` | Waits for a local-store change for a bounded time in the current model turn |

`wait.timeout_ms` defaults to 5,000ms and is capped at 30,000ms. It also does not poll the relay or
create a new receiver loop.

## Session receiver and presence state

The normal MCP adapter runs one receiver for each session. It fetches ciphertext from the relay,
decrypts it, and writes it to that session's local store. A session has its own config, identity,
store namespace, and receiver lease, so sharing a relay and channel does not merge inboxes.

Starting two adapters against the same session config allows only one receiver lease. The second
adapter fails with `busy`, and a running adapter that loses its lease is reported as `lost`. This is
not a limit on different sessions; it is the protection that prevents two processes from draining
one inbox. When a duplicate is suspected, check `status`, stop only the stale adapter for that
session, and reopen the session. `channel_status` and the dashboard do not acquire this lease.

### `channel_status`

`channel_status` is a read-only snapshot of channel connections visible to the current session. It
does not fetch or delete messages, and it keeps configuration separate from observation.

- It shows configured channel members alongside observed presence.
- Presence is a TTL record signed by the same Ed25519 identity. A heartbeat is refreshed about every
  30 seconds and expires after about 90 seconds.
- Only a valid, unexpired heartbeat is `online`. Missing or old heartbeats remain `unknown`; that
  alone is not proof that a session is offline.
- A signed external session not present in this session's config appears as `unmatched_presence`.
  Add it only after comparing its fingerprint out of band.
- Multiple processes or PCs with the same identity remain separate by `session_id` and `instance_id`.

Presence may include the fingerprint, label, session/instance IDs, and observed/expiry timestamps
needed to correlate state, but it never includes message bodies. The relay temporarily stores this
signed metadata only.

### HTML status dashboard

The adapter CLI's `dashboard` command writes the same snapshot as `channel_status` to HTML.

```bash
bun run src/adapter/bin.ts dashboard \
  --config <session-config.json> \
  --output .local/dashboards/channel-status.html \
  --watch-ms 30000
```

`--config` selects the session to observe, `--output` selects the output file, and `--watch-ms` sets
the refresh interval. Omit `--watch-ms` for one snapshot. The command is an observer: it takes no
receiver lease and does not call relay `/fetch`. It shows identity, configured members, presence,
and `unmatched_presence`, but never message bodies, private seeds, or channel secrets. It keeps
observed external sessions and multiple instances in the board instead of reducing the view to one
orchestrator session.

When Relay is configured but the receiver lease is `busy` or `lost`, `inbox` may show records already
in the local store but returns an explicit error and marks the list as potentially incomplete. Do not
infer that no new message exists; check receiver state with `status`, then stop the duplicate adapter
or reopen the session.

## Session-local Croner scheduler

These three tools belong only to the current MCP process and session. A schedule is not written to
the config file or local store, and disappears when the MCP process ends.

| Tool | What it does |
|---|---|
| `schedule_poll` | Registers a bounded `inbox-check` observation of the local inbox |
| `schedule_cancel` | Cancels one schedule by `schedule_id` |
| `schedule_list` | Shows current schedules and their latest state |

### `schedule_poll`

Required inputs:

| Field | Contract |
|---|---|
| `schedule_id` | Non-empty session-local name, at most 128 characters. The same name replaces the existing policy |
| `interval_ms` | An integer from `180000` through `600000`, or 3–10 minutes |
| `max_runs` | Maximum run count, at least 1 |
| `action` | Only `inbox-check` is supported |

Optional inputs are `timeout_ms` (overall timeout in milliseconds), `expires_at` (expiry as epoch
milliseconds), and `channel_id` (observe one channel only). Unknown fields are rejected.

Each tick reads `store.undelivered()` and emits an observation with the pending count and messages.
It does not do any of the following:

- Relay fetch or post
- Acquire a new receiver lease
- Claim, delete, or mark messages read
- Inspect another session's schedules

The default receiver loop polls the relay separately. The scheduler does not replace it; it observes
only results already written to the local store. Empty or failed default receiver polls use backoff
from 2 seconds up to 5 minutes, resetting when a message arrives.

The scheduler uses Croner's session-local timer. `schedule_list` may show
`scheduled`, `running`, `completed`, `cancelled`, `expired`, or `replaced`. The timer does not keep
the host process alive.

Each tick is sent as an MCP logging notification with `host_wake.capable: false`. It is a
transport-level observation only; **an MCP notification does not start a model turn.** If the host is
idle, the model does not react. Messages already in the local store remain available to `inbox` on a
later turn.

## Cleaning up one channel

`channel_cleanup` previews and removes local records for **one selected joined channel only**. It
does not touch the relay or another channel's files.

| Input | Contract |
|---|---|
| `channel_id` | A channel joined by the current session; required |
| `mode` | `preview` or `execute`; required |
| `confirmation_token` | The confirmation token returned by preview; used by execute |
| `token` | Explicit alias for `confirmation_token`; use either one |

`preview` is non-destructive. It returns `channelId`, `count`, `oldestStoredAt`, `newestStoredAt`,
`confirmationToken`, the same value as `token`, and `expiresAt`. It does not return message contents,
message IDs, or internal fingerprints. The default token lifetime is 60 seconds.

`execute` deletes only the selected channel file after all of these checks pass:

1. The channel is still joined.
2. The token is valid and belongs to the same `channel_id` as the preview.
3. The channel content snapshot has not changed since preview.

Missing or mismatched tokens do not delete anything. An expired token or changed snapshot requires a
new preview. Membership is reserved during deletion so `channel_leave` cannot race the purge.

## Relay

| Tool | What it does |
|---|---|
| `relay_check` | Given `url`, checks that address; with none, this machine's local relay. Prints the start command if none is running |
| `relay_export` | Writes a deployable relay directory into `dir`. Does not deploy |

## Configuration

These edit the config file. They exist so nobody writes that JSON by hand — they validate it and hold
the file at mode 600.

| Tool | What it does |
|---|---|
| `setup` | Creates a seed and the config file. Never overwrites an existing one |
| `channel_join` | Joins a channel: name, secret, members, axis |
| `channel_leave` | Leaves a channel |
| `member_remove` | Removes one member from a channel |
| `trust_agent` | Adds a fingerprint to `self` — treated as your own agent |
| `untrust_agent` | Removes it from `self` |
| `peer_grant` | Grants an authority grade to one fingerprint |
| `relay_set` | Changes the relay address |

There is no tool that changes `policy.default`. No path exists for raising everyone at once.

## Blocked in a tainted turn

While a peer's message is in the turn, authority tools such as `trust_agent` and `peer_grant` are
refused. Any name not in the classification table counts as `execute`, so `relay_check` and
`relay_export` are blocked in that turn too. Details: [Authority](/en/guides/permissions/).
