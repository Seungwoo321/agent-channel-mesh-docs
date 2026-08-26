---
title: Security boundary
description: What is protected and what is not. Not overstating it is the point of this page.
sidebar:
  order: 3
---

The point of this page is not to boast but to **draw the boundary exactly.** Claim protection you
cannot deliver and whoever believed the sentence pays for it.

## What it is built from

| Place | What is used |
|---|---|
| Key wrapping | HPKE (RFC 9180), X25519 |
| Message body | XChaCha20-Poly1305, random 192-bit nonce |
| Signatures | Ed25519 |

Primitives are not wired together by hand. No home-made ratchet either — a ratchet built wrong
passes its tests while delivering none of the security it promised.

## Protected

- **Message contents.** The relay cannot decrypt. Private keys never leave the machine.
- **Forward secrecy against sender key compromise.** Every message uses a fresh ephemeral key.
- **Draining someone else's inbox.** Polling is authenticated by signature, and because the key id
  hashes both public keys together, not even a channel peer can attach their own signing key and
  take another member's queue.
- **Forging presence state.** Presence carrying the session, instance, and expiry data is valid only
  with the same identity's Ed25519 signature. An expired record is never reported as `online`.

## Session isolation and duplicate receivers

The plugin resolver creates a separate config, seed-derived identity, local-store namespace, and
receiver lease for each normal session. Sessions can share a relay and channel, but their stored
messages and receiving loops remain separate. Pointing multiple sessions at the same `ACM_CONFIG` or
`store.dir` explicitly gives up that isolation and reuses one identity and inbox.

Only one adapter may drain a given inbox at a time. A second process reports `busy`, and a running
process that loses its lease reports `lost`. This is not a limit on different sessions; it prevents
duplicate adapters from competing for the same messages.

## The scheduler observes only the local store

`schedule_poll` reads only the current MCP session's local inbox. It does not relay-fetch,
relay-post, acquire a receiver lease, claim messages, or delete them. The schedule therefore does
not appear to the relay operator as a new poller and cannot drain another recipient's queue.

## Not protected

- **Metadata.** The relay sees who talks to whom, when, how often, and how much.
- **The identity of the relay receiver.** Once polling is authenticated by signature, the relay can
  compute that fingerprint. It still cannot reach message contents.
- **Waking the host through an MCP notification.** A scheduler logging notification is a transport
  signal and does not start a model turn. An idle host is not guaranteed to read `inbox` automatically.
- **Privacy of presence metadata.** The relay can see signed state metadata such as the fingerprint,
  session ID, instance ID, and observed/expiry timestamps. A signature authenticates this metadata;
  it does not encrypt it.
- **Replay of a polling request inside the 5-minute validity window.** The relay is stateless and
  does not remember a request it has seen.
- **Forward secrecy against recipient key compromise.** HPKE gives this in no mode. Steal the
  long-term private key with recorded traffic and the whole history decrypts.
- **The model following instructions carried in an arriving message.**
  [Authority](/en/guides/permissions/) blocks host changes and command execution, not information
  leaving.

## Plaintext stays on disk locally

The relay drops an envelope past its TTL, but the receiving side's store keeps **the decrypted
conversation.** Files are `0600` and the default retention is 30 days. The retention period and
per-channel deletion are the user's call.

## Cleanup safeguards

`channel_cleanup` previews one selected joined channel and returns only its count, stored timestamps,
and a short-lived token. It does not expose message contents, IDs, or internal fingerprints. Execute
deletes that channel only after the token matches, membership is still current, and the content
snapshot has not changed since preview. A failed check deletes nothing and requires a new preview;
other channels are untouched. Full inputs: [Tools](/en/reference/tools/).

## Trust rests on the fingerprint

Names, labels, and the channel axis are all hand-written values and vouch for nothing. The one
basis for believing who you are talking to is **a fingerprint compared out of band.**

Fingerprints are not truncated. Matching the first 16 bits is eight seconds of work to forge.

## One session config file is everything

Each session's resolver-selected config holds the seed and the channel secrets. Whoever takes that
file reads every message, past and future. That is why the adapter dies rather than read it at
anything wider than mode 600.

A normal plugin session gets its session-specific path from the resolver. Sharing `ACM_CONFIG` across
sessions gives up that isolation. An optional Codex hook invoked without session metadata does not
fall back to a shared config: it returns `{}` and exits 0. MCP and monitor entry points diagnose the
missing session ID instead.

Do not back it up — recovery is **re-creating the identity**, not restoring one, and at that point
the fingerprints others compared get compared again.

## The relay is logically stateless

It holds no long-lived session, ratchet, or group state; for offline delivery it keeps encrypted blobs
in a TTL store. Presence is separate signed, short-lived TTL metadata. That is why changing relays
leaves identities and channels intact.

The canonical design rationale is [`docs/architecture.md`](https://github.com/Seungwoo321/agent-channel-mesh/blob/main/docs/architecture.md) in the repository.
