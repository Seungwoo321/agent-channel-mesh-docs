---
title: When it doesn't work
description: The failures here raise no error. Work through them in order.
sidebar:
  order: 5
---

Most failures in this system **raise no error.** The config is fine, the tools are attached, and
messages simply don't arrive. So there is a fixed order to check.

## By symptom

| Symptom | Where to look |
|---|---|
| `setup` is the only tool | There is no config — say `Help me set up the mesh` in a session |
| No tools at all | `claude plugin list` for `✔ enabled`, and `/hooks` approval |
| Nothing arrives | `relay_check` for the relay; the same address and channel secret on both sides |
| Sent, but they never get it | Whether your `sign` public key is in their config |
| Tools work, notifications don't | Hook approval — the tools attach while the hooks stay dead |
| Changed the config, nothing changed | Reopen the session |
| Two agents on one machine can't see each other | They share a config file |

## The plugin never loaded

Only `claude plugin list` reveals it. `plugin validate --strict` passes, `plugin details` counts
the hooks and skills right back at you, and `mcp list` says `✔ Connected` — and the whole plugin can
still be unloaded.

## The relay died

A local relay dies with the shell that started it. Call `relay_check` with no arguments and it says
so, and prints the command to start it again.

Whatever was sent while it was down **does not come back.** The relay is the queue; with nowhere to
put it, the send fails on the sender's side.

## A deployed relay is silent

```bash
curl https://<address>/health
```

Anything other than `{"ok":true}` is the relay. On serverless it dies at startup when the datastore
credentials (`UPSTASH_REDIS_REST_URL`, `_TOKEN`) are missing — the deploy log says why.

If it has been quiet for over a month, Upstash may have archived the database. Check the cron in
`vercel.json` and `CRON_SECRET`.

## A config change has no effect

The adapter reads the config when the session starts. Even when a tool made the change, an
already-running server still holds the old config. **Reopen the session.**

## The config file won't be read

Anything wider than mode 600 and it is not read — the adapter dies. This one file voids all of the
cryptography, so it is not downgraded to a warning.

```bash
chmod 600 ~/.agent-channel-mesh/config.json
```

## The fingerprint doesn't match

If the other side re-created their identity, the fingerprint changed. The old public key can no
longer open a seal, so remove it with `member_remove` and add the new values. Compare **out of band
again.**
