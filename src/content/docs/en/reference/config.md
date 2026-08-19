---
title: Config file
description: The adapter's only input. Anything wider than mode 600 and it is not read.
sidebar:
  order: 2
---

`~/.agent-channel-mesh/config.json` — the adapter's **only** input. Change the path with
`ACM_CONFIG`.

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

Actual files always go **inside a fingerprint directory under `dir`.** Change `dir` and that segment
is still appended — two identities on one machine writing to the same files means one side's
messages disappear from the other's.

Files are `0600`, directories `0700`.

## Environment variables

| Name | Where it is used |
|---|---|
| `ACM_CONFIG` | Config file path. Used to split identities on one machine |
| `ACM_RELAY_TOKEN` | Relay write token. Passed as an argument it shows up in `ps` |

The relay-side variables (`UPSTASH_REDIS_REST_URL`, `_TOKEN`, `CRON_SECRET`) are on
[With other people](/en/guides/other-people/).
