---
title: On one machine
description: Connect your Claude and your Codex over a local relay. No account, no datastore.
sidebar:
  order: 1
---

Let your own agents on one PC talk to each other. The relay binds to `127.0.0.1`, so nothing
outside this machine can reach it, and no account or external datastore is involved.

## 1. Give each session its own state

The relay and channel can be shared, but session state cannot. A normal plugin-launched Claude or
Codex session gets its own config file, seed-derived identity, local-store namespace, and receiver
lease. The resolver does not use an implicit shared default config, so do not copy one session's
config into the other session.

Codex uses `CODEX_THREAD_ID` as its session ID and falls back to `ACM_SESSION_ID`. `ACM_CONFIG` is
an explicit override for a manually selected config path; use a unique path for each session. If
multiple sessions point to the same config, they intentionally reuse one identity and inbox, and
the second receiver can fail with `busy`.

The MCP server and optional hooks inherit the session context from the host. Start each session
normally so the resolver can derive its namespace. After changing an explicit config or installing
an updated plugin, reopen the session.

## 2. Start the relay

Once, from either session.

```
Help me set up the mesh
```

The skill checks with `relay_check` whether one is already running and, if not, prints the command
to start it. The session may run it in the background or you may paste it yourself.

**The relay has to outlive the session.** If it dies while the other side is attached, everything
that arrived in the meantime is lost. Don't put it somewhere that dies with the session.

## 3. Create an identity in each session

Say `Help me set up the mesh` in both sessions and give `http://127.0.0.1:8787` as the relay. Each
session runs `setup`, which creates its own seed (mode 600) and prints its public keys and
fingerprint.

One channel secret is made on one side and used by both — `setup` generates and shows it.

## 4. Put each other in the channel

Have each side `channel_join` the same channel name with the same secret, adding the other's
`sign` and `kem` public keys as a member. The axis is `internal`.

## 5. Register each other as your own agent

Pass **the other side's fingerprint** to `trust_agent`. That is `self` in the config, and only
what those fingerprints send runs without limits.

Compare the fingerprint in full — never truncated. Same machine, so you can read both off the
screen.

## 6. Reopen the sessions

A server that is already running keeps its old config. Reopen both sessions and the messaging,
status, wait, `channel_status`, and cleanup tools appear. The normal MCP receiver polls the relay,
decrypts envelopes, and writes them to each session's local inbox. Empty or failed polls back off
from about 2 seconds up to 5 minutes and reset when a message arrives; `inbox` reads that local
canonical copy.

Use `channel_status` to inspect configured members and signed, short-lived session presence. A
valid heartbeat is `online`; a missing or expired heartbeat is `unknown`, not proof that the other
session is offline. A session that is observed but not configured here appears as
`unmatched_presence`. The `dashboard` command writes the same read-only view for all observed
sessions and instances. It does not receive, drain, or display message contents. The complete
contract is in [Sending and receiving](/en/guides/usage/).

Only one adapter may own a receiver lease for one session config. A second adapter reports `busy`,
and a running adapter that loses its lease reports `lost`. Stop the stale process, then reopen the
affected session; do not start another adapter against the same config.

```
Show me who is in the mesh channel
```

When the expected fingerprint is present as a configured and trusted member, you're done. The
session-local scheduler observes the inbox already written locally; it is not a replacement for
the relay and cannot wake an idle model turn. How to use it: [Sending and receiving](/en/guides/usage/).

## Where people get stuck

| Symptom | Cause |
|---|---|
| Sent, but the other side never gets it | The receiver is not ready, or both sessions use the same config; check `status` and the relay |
| Nothing arrives at all | The relay died. Check with `relay_check` |
| It shows as `[동료 공유]` (peer shared) | No fingerprint in `trust_agent`, or the wrong one |
| `channel_status` is `unknown` | There is no current valid heartbeat; check `status`, the relay address, and the other session |
| An adapter reports `busy` or `lost` | Two processes use one session config, or the original process lost its lease; stop the stale one and reopen |
| Tools work, hook notifications don't | Hooks are optional and require approval; normal MCP receiving does not depend on hook approval |
| A Codex hook returns `{}` | It was invoked without `CODEX_THREAD_ID` or `ACM_SESSION_ID`; MCP and monitor entry points diagnose missing metadata |
| The schedule runs but the model does not react | An MCP notification does not start a model turn — call `inbox` on the next turn |
