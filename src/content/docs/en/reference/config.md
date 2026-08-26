---
title: Config file
description: The adapter's only input. Anything wider than mode 600 and it is not read.
sidebar:
  order: 2
---

The config file is the adapter's **only** input. Set its path explicitly with `ACM_CONFIG`. A normal
plugin-launched session whose session ID is available uses a config under its session namespace by
default. An explicit `ACM_CONFIG` takes precedence over that resolver choice.

**Anything wider than mode 600 and it is not read; the adapter dies.** This one file voids all of
the cryptography, so it is not downgraded to a warning. This page documents what the values mean;
the file is not written by hand — the [config tools](/en/reference/tools/) validate it and hold the
permissions.

## Top level

| Field | Meaning |
|---|---|
| `seed` | The identity's private seed (64 hex chars). **Never leaves the machine** |
| `relay` | Relay base URL. One per config |
| `relayToken` | For a relay that requires a write token. The environment variable is preferred |
| `channels` | The channel list |
| `self` | Fingerprints of your own agents. Only these are `execute` |
| `policy` | Default authority for arriving messages, plus per-fingerprint exceptions |
| `store` | Local store location and retention |

## Per-session isolation

A normal plugin-launched session has its own config file, identity derived from its seed, local-store
namespace, and receiver lease. Sessions may share a relay and channel, but one session's `inbox` does
not appear in another. Codex prefers `CODEX_THREAD_ID` as its session ID and falls back to
`ACM_SESSION_ID`.

Pointing multiple sessions at the same `ACM_CONFIG` explicitly gives up that isolation. They reuse the
same identity, store, and receiver lease, so a second adapter may fail with `busy`. An optional Codex
hook invoked without session metadata does not fall back to this shared path: it returns `{}` and exits
0. MCP and monitor entry points report a missing-session-ID diagnostic instead.

## `channels[]`

| Field | Meaning |
|---|---|
| `secret` | Channel secret (64 hex chars). Whoever opens the channel creates it and shares it out of band |
| `name` | Human-readable channel name |
| `members[]` | The other side's `sign` and `kem` public keys, plus a display `label` |
| `axis` | `internal` / `external` — a label for humans. Takes no part in the authority decision |
| `mentions` | The names that address you |
| `maxHops` | Hop limit on a chain of auto-replies |
| `messageBudget` | Message budget for one conversation |

`members[].label` is the name **you** write in **your** config, not the name they gave themselves.
Either way it is not a basis for trust — the fingerprint is.

## `policy`

| Field | Meaning |
|---|---|
| `default` | The grade for a fingerprint in neither `self` nor `peers`. Defaults to `read` |
| `peers` | Fingerprint → grade. Differs for that one person |

Grades are `read`, `write`, `execute`. No tool changes `default` — raising it would also raise
people whose fingerprints were never compared.

## `store`

| Field | Default | Meaning |
|---|---|---|
| `dir` | `~/.agent-channel-mesh/messages` | The outer directory |
| `retentionMs` | 30 days | Retention. Unlimited is not offered |
| `maxPerChannel` | 2000 | Cap on stored messages per channel |

For resolver-created session configs, actual files go under the session-specific `store.dir` namespace
and are partitioned further by identity and channel. Manually sharing `ACM_CONFIG` or `store.dir`
between sessions breaks that isolation: messages may mix or the receiver lease may conflict.

Files are `0600`, directories `0700`.

## Environment variables

| Name | Where it is used |
|---|---|
| `ACM_CONFIG` | Config file path. Overrides the resolver's session-specific default |
| `CODEX_THREAD_ID` | Codex session ID. Takes precedence over `ACM_SESSION_ID` |
| `ACM_SESSION_ID` | Fallback Codex session ID used by the resolver for namespace and presence |
| `ACM_RELAY_TOKEN` | Relay write token. Passed as an argument it shows up in `ps` |

The relay-side variables (`UPSTASH_REDIS_REST_URL`, `_TOKEN`, `CRON_SECRET`) are on
[With other people](/en/guides/other-people/).

## Session-only state

Croner jobs registered by `schedule_poll` and confirmation tokens issued by a `channel_cleanup`
preview are not written to the config file or local store. They disappear when the MCP process ends.
Messages already stored remain under the local inbox retention policy and can be read with `inbox` in
a later session using the same session namespace. Presence heartbeats are signed TTL metadata held
briefly by the relay, not persistent session state in the config file.
