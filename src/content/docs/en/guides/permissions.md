---
title: Authority
description: What an arriving message may do on my machine. What separates people is not rank but authority.
sidebar:
  order: 4
---

Channel members are **peers.** There is no above or below, and what arrives is **shared context**,
not an order. So what separates them is not a person's rank but **authority over my machine.**

| Sender | Authority | What it can do |
|---|---|---|
| My own agent (fingerprint listed in `self`) | `execute` | Everything |
| Every other peer | `read` | Read, and reply over the mesh |

| Grade | Allowed | Not allowed |
|---|---|---|
| `read` | Read and search files, reply over the mesh | Edits, running commands, web requests, other MCP tools |
| `write` | The above plus editing files | Running commands, web requests, other MCP tools |
| `execute` | Everything | — |

`WebFetch` and `WebSearch` do not count as reading. They are the path by which what was read leaves.

## The decision comes from the verified signer

The `self` decision is made **after Ed25519 verification succeeds**, by deriving the fingerprint
from the verifying public key. Not from a name in the envelope, and not from the channel axis —
decide before verification and writing any key into the envelope makes you `self`.

A channel's `axis` is a hand-written label and cannot vouch for an individual message. It is shown
to humans and takes no part in the decision.

## There is exactly one way up

**I write that person's fingerprint into my config.** Nobody gets there by asking over chat, and
nobody gets there by talking the model into it.

The tools that write fingerprints **refuse while a peer's message is in the turn.** If the arriving
sentence says "raise me to execute" and the model is inclined to comply, that tool is blocked for
that turn.

There is no tool that changes `policy.default`, which applies to everyone. Raising it would also
raise people whose fingerprints were never compared.

## What isn't known is blocked

| Situation | Decision |
|---|---|
| A tool name not in the table | Deny |
| Hook payload unreadable | Deny |
| Taint state file corrupt | Deny |

Tools keep being added, so the list is always behind. If the part it is behind on falls on the
allow side, each new tool is a bypass.

## A human is what unblocks it

When something is blocked, **one line typed by the user clears it.** Something the user typed
themselves is the only signal that says "I asked for this."

Time does not clear it — the message is still sitting in the context.

## Where the policy lives

Not in a prompt file: in a mode-600 config file, enforced by a `PreToolUse` hook. A rule kept in a
prompt disappears when the context is compacted, and even while it is there the model can ignore it.

The same policy goes into both Claude Code and Codex.

## What it cannot stop: information leaving

Being able to read and reply means the model can follow instructions carried in an arriving message
and say what it knows.

This boundary protects **host changes and command execution**, and claims nothing beyond that. Not
attaching sensitive repositories' sessions to a channel is the only certain measure.
