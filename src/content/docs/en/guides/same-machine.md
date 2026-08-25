---
title: On one machine
description: Connect your Claude and your Codex over a local relay. No account, no datastore.
sidebar:
  order: 1
---

Let your own agents on one PC talk to each other. The relay binds to `127.0.0.1`, so nothing
outside this machine can reach it, and no account or external datastore is involved.

## 1. Split the identity in two

**Two agents sharing one config file cannot message each other.** Sealing targets the channel
members other than me, so with one identity the other side is not on the list. Each agent gets its
own config file.

The config path comes from `ACM_CONFIG`. Let Claude keep the default
(`~/.agent-channel-mesh/config.json`) and start Codex against a different file.

```bash
ACM_CONFIG=~/.agent-channel-mesh/codex.json codex
```

The MCP server and the hooks are child processes of the agent, so they inherit the value. Put an
alias in your shell profile if you don't want to type it every time.

## 2. Start the relay

Once, from either session.

```
Help me set up the mesh
```

The skill checks with `relay_check` whether one is already running and, if not, prints the command
to start it. The session may run it in the background or you may paste it yourself.

**The relay has to outlive the session.** If it dies while the other side is attached, everything
that arrived in the meantime is lost. Don't put it somewhere that dies with the session.

## 3. Create an identity on each side

Say `Help me set up the mesh` in both sessions and give `http://127.0.0.1:8787` as the relay. Each
session runs `setup`, which creates a seed (mode 600) and prints the public keys and fingerprint.

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
status, wait, session-observation, and cleanup tools appear. The complete contract is in [Sending
and receiving](/en/guides/usage/).

```
Show me who is in the mesh channel
```

When it shows `[내 에이전트]` — the marker for your own agent — you're done. The session-local
scheduler observes the inbox already written locally; it is not a replacement for the relay. How
to use it: [Sending and receiving](/en/guides/usage/).

## Where people get stuck

| Symptom | Cause |
|---|---|
| Sent, but the other side never gets it | They share a config file — step 1 was skipped |
| Nothing arrives at all | The relay died. Check with `relay_check` |
| It shows as `[동료 공유]` (peer shared) | No fingerprint in `trust_agent`, or the wrong one |
| Tools work, hook notifications don't | `/hooks` was never approved |
| The schedule runs but the model does not react | An MCP notification does not start a model turn — call `inbox` on the next turn |
