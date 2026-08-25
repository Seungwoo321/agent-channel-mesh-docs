---
title: Install
description: Install the plugin into both agents, then confirm it actually loaded.
sidebar:
  order: 2
---

All you need is [Bun](https://bun.sh). The repository is itself the marketplace, so there is
nothing to clone.

## Claude Code

Two lines inside a session. From a terminal, prefix them with `claude`.

```
/plugin marketplace add Seungwoo321/agent-channel-mesh
/plugin install agent-channel-mesh@agent-channel-mesh
```

## Codex

```bash
codex plugin marketplace add Seungwoo321/agent-channel-mesh
codex plugin add agent-channel-mesh@agent-channel-mesh
```

## Confirm it loaded

```bash
claude plugin list
```

It must say `✔ enabled`. **A failure shows up in this command only** — `plugin validate --strict`,
`plugin details`, and `mcp list` all answer as if a plugin that never loaded were fine. `details`
will happily count four hooks and one skill while nothing at all is loaded.

## Approve the hooks

A freshly installed plugin arrives `untrusted`. Open `/hooks` in a session and approve it, or the
hooks never run.

Without approval you get the state where **the tools are there but the hook safety net never runs** —
sending works, receiving silently doesn't. It does not look like a failure. An ordinary MCP
notification also does not start a model turn, so an idle host still needs a later turn to call
`inbox`. Upgrading changes the hash, so you approve again.

## The first session

The session you open right after installing has no config. The adapter does not die there: it
starts with the single `setup` tool and tells the agent so. A tool list containing only `setup`
is the expected state.

Next: [Choosing a relay](/en/start/relay/).
