---
title: Install
description: Install the plugin into both agents, then confirm it actually loaded.
sidebar:
  order: 2
---

All you need is [Bun](https://bun.sh). The repository is itself the marketplace, so there is
nothing to clone. The current plugin release is v0.3.1.

Normal plugin-launched sessions do not use an implicit shared default config. Each session gets its
own config, seed-derived identity, local-store namespace, and receiver lease. Codex uses
`CODEX_THREAD_ID` or the `ACM_SESSION_ID` fallback to derive its session namespace. `ACM_CONFIG`
overrides the resolver only when you explicitly set it; use a unique path per session and do not
copy one session's config into another.

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

Hook approval controls optional hook notifications and safety integrations. It does not control the
normal MCP receiver: that receiver polls the relay, decrypts envelopes, and writes the session's
local inbox. An ordinary MCP notification also does not start a model turn, so an idle host still
needs a later turn to call `inbox`. Upgrading changes the hash, so approve the hooks again if you
use them.

An optional Codex hook invoked without `CODEX_THREAD_ID` or `ACM_SESSION_ID` returns `{}` and exits
0. It does not fall back to a shared `codex.json`. MCP and monitor entry points diagnose the
missing session ID instead. Start the hook from a normal Codex session or provide an explicit,
unique `ACM_CONFIG`.

## Receiving and observing

The normal MCP receiver uses adaptive polling: empty or failed relay polls back off from about
2 seconds up to 5 minutes and reset when a message arrives. `inbox` reads the local canonical copy.
`channel_status` and the `dashboard` command are read-only observability tools. They show configured
members, signed short-lived presence, multiple session/instance records, and
`unmatched_presence` for observed external sessions without acquiring a receiver lease, draining
messages, or exposing message bodies.

The Croner scheduler is local to the current MCP session. It observes only records already written
to the local store, cannot wake an idle model turn, and disappears when the MCP process ends. The
`channel_cleanup` tool is also local and scoped to one selected joined channel.

Only one adapter may own a receiver lease for a session config. A duplicate adapter reports `busy`,
and a running adapter that loses its lease reports `lost`. Stop the stale process and reopen the
session instead of starting another adapter against the same config.

## The first session

The session you open right after installing has no session config yet. The adapter does not die
there: it starts with the single `setup` tool and tells the agent so. A tool list containing only
`setup` is the expected state. After setup or a config change, fully reopen the session so its MCP
server and receiver use the new session state.

Next: [Choosing a relay](/en/start/relay/).
