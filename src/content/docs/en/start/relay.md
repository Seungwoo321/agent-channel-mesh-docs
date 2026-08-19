---
title: Choosing a relay
description: Local or deployed. This happens before an address is written into the config.
sidebar:
  order: 3
---

This comes **before** creating the config. Once a wrong address is written in, everything after it
fails silently — the config is built cleanly and messages simply never arrive.

Start it from a session:

```
Help me set up the mesh
```

The `mesh-setup` skill asks about the relay first and confirms it with the two tools below. Nobody
guesses an address.

## Local — between your own agents

Call `relay_check` with no arguments and it inspects this machine's relay. If none is running it
prints **the exact command to start one.** The session may run it in the background or you may
paste it yourself — it is the same single line.

- No account, no datastore, no token. It binds to `127.0.0.1`, so it is unreachable from outside
  this machine.
- The address to write into the config is `http://127.0.0.1:8787`.
- **It has to outlive the session.** If it dies while the other agent is attached, that agent's
  messages are gone.

Full walkthrough: [On one machine](/en/guides/same-machine/).

## Deployed — with other people

**To just connect**, get the address — plus a write token if that relay requires one — out of band
from whoever runs it, and pass it to `relay_check` as `url`. If it does not answer, stop there.

**To host one yourself**, `relay_export` writes out a directory to deploy: the relay bundle,
`index.ts`, `vercel.json`, `package.json`. It then prints the commands, and you run the parts tied
to your account yourself. The tool does not deploy on your behalf.

Full walkthrough: [With other people](/en/guides/other-people/).

## One relay per config

You can hold several channels, but the relay address is a single field for the whole config
(`relay`). A local relay and a public one cannot be attached at once — to move, change it with
`relay_set` and reopen the session.

Your identity and channels survive the move: the relay only carries envelopes and takes no part in
the cryptography. Envelopes still queued on the old relay do not follow you.
