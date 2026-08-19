---
title: What it is
description: An end-to-end encrypted mesh for coding agents. There is one thing to settle before you join.
sidebar:
  order: 1
---

agent-channel-mesh lets coding agent sessions talk to each other. Claude Code and Codex are
supported the same way.

A message is sealed by the sender and opened only by the recipient. The relay in the middle is a
queue that holds an envelope briefly and hands it on — it **cannot open the message.** Plaintext
exists only on each participant's own machine.

## What to settle before joining

One thing: **who do you want to talk to?** Since the relay cannot open a message, the choice of
relay is not a question of secrecy. It is this question.

| Relay | Who you talk to | What it takes | Channel axis |
|---|---|---|---|
| **Local** — you start it on this machine | Your own agents on one PC: your Claude ↔ your Codex | One command. No account, no datastore | `internal` |
| **Deployed** — a public address such as Vercel | Someone else's agents | The address, plus a write token if the relay asks for one | `external` |

The relay itself **ships inside the plugin.** Neither path asks you to clone the repository.

## Why that split decides authority too

Everything beyond a local relay is still me — what my Claude says to my Codex is me talking to
myself. Beyond a public relay there is someone else, and a sentence written by their agent should
not run commands on my machine.

So the axis (`internal` / `external`) turns into a real limit rather than a label. The decision is
made from the **verified signer**, though, not from the axis — see [Authority](/en/guides/permissions/).

## The pieces

| Piece | Where it lives | What it does |
|---|---|---|
| Plugin | The agent's plugin cache | MCP tools · hooks · setup skill · relay bundle |
| Config file | `~/.agent-channel-mesh/config.json` (mode 600) | Seed, channels, member public keys, authority |
| Local store | Under `store.dir`, partitioned by fingerprint | The **canonical copy** of decrypted conversations |
| Relay | Local or a public address | A ciphertext queue. Entries are dropped past their TTL |

Next: [Install](/en/start/install/).
