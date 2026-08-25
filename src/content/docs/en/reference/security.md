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

## One config file is everything

`~/.agent-channel-mesh/config.json` holds the seed and the channel secrets. Whoever takes that file
reads every message, past and future. That is why the adapter dies rather than read it at anything
wider than mode 600.

Do not back it up — recovery is **re-creating the identity**, not restoring one, and at that point
the fingerprints others compared get compared again.

## The relay is logically stateless

It holds no session, ratchet, or group state; for offline delivery it keeps encrypted blobs in a TTL
store and nothing else. That is why changing relays leaves identities and channels intact.

The canonical design rationale is [`docs/architecture.md`](https://github.com/Seungwoo321/agent-channel-mesh/blob/main/docs/architecture.md) in the repository.
