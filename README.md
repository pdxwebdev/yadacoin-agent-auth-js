# @yadacoin/agent-auth (JavaScript)

Client-side JavaScript SDK for the [YadaCoin KEL Agent Auth Protocol](https://pdxwebdev.github.io/yadacoin-agent-auth-spec).

Implements protocol version **1.2**. Works in browsers (ESM) and Node.js ≥ 18.

## Install

```bash
npm install @yadacoin/agent-auth @noble/curves @noble/hashes
```

Or via CDN (no bundler):

```html
<script type="importmap">
  {
    "imports": {
      "@noble/curves/secp256k1": "https://esm.sh/@noble/curves@1.8.1/secp256k1",
      "@noble/hashes/sha256": "https://esm.sh/@noble/hashes@1.7.2/sha256",
      "@noble/hashes/hmac": "https://esm.sh/@noble/hashes@1.7.2/hmac",
      "@noble/hashes/utils": "https://esm.sh/@noble/hashes@1.7.2/utils"
    }
  }
</script>
<script type="module">
  import {
    AgentAuthClient,
    buildVCScope,
  } from "https://esm.sh/@yadacoin/agent-auth@1.2.0";
</script>
```

## Quick start

```js
import {
  AgentAuthClient,
  buildVCScope,
  deriveSecurePath,
  getPublicKey,
} from "@yadacoin/agent-auth";

// 1. Derive the agent key from stored key material + second factor
const child = deriveSecurePath(
  storedPrivKeyHex,
  storedChainCodeHex,
  secondFactor,
);
const agentPubHex = toHex(getPublicKey(child.privateKey));

// 2. Build the W3C VC 2.0 scope to commit on-chain
const relationshipB64 = buildVCScope({
  operatorPubHex: "02a1b2c3...",
  agentPubHex,
  authorizationType: "TravelBookingAuthorization",
  authorization: {
    destination: "New York",
    checkin: "May 10",
    checkout: "May 15",
    services: ["hotel", "flight"],
  },
  kelStatusMode: "rotation", // or "temporal" for long-lived credentials
});

// 3. Broadcast the rotation transaction with the VC in the relationship field
await fetch("/key-rotation/derived-child-key", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    public_key: childPubHex,
    second_factor: sf,
    relationship: relationshipB64,
  }),
});

// 4. Authenticate to a vendor with a VP
const client = new AgentAuthClient({
  challengeEndpoint: "/api/vendor/hotel/challenge",
});
const result = await client.authenticatedVPRequest("/api/vendor/hotel", {
  publicKey: agentPubHex,
  privateKey: agentPrivKey,
  vc: onChainVC,
});
```

## Credential status modes

VCs built with `kelStatusMode: "rotation"` (default) are one-time-use — revoked
once the key rotates. `kelStatusMode: "temporal"` allows the credential to survive
key rotations; the verifier checks that the VP is signed with the holder's _current_
active key per the KEL.

See [§5.1 of the spec](https://pdxwebdev.github.io/yadacoin-agent-auth-spec#yadakelstatus).

## API

| Export                                 | Description                                                       |
| -------------------------------------- | ----------------------------------------------------------------- |
| `AgentAuthClient`                      | High-level client — challenge fetch, signing, VP construction     |
| `buildVCScope(opts)`                   | Build a base64-encoded W3C VC 2.0 scope document                  |
| `parseScope(b64)`                      | Decode + normalise a scope document from a KEL relationship field |
| `signChallenge(challenge, privateKey)` | Sign a challenge string → base64 DER signature                    |
| `deriveSecurePath(priv, cc, sf)`       | BIP32-style key derivation (matches keyrotation.py)               |
| `getPublicKey(privateKey)`             | Derive a compressed secp256k1 public key                          |
| `buildVCScope`                         | Build + base64-encode a W3C VC 2.0 scope document                 |
| `buildScope`                           | _(deprecated)_ Legacy flat scope builder                          |

## Related

- [Python SDK](https://github.com/pdxwebdev/yadacoin-agent-auth-py) — `yadacoin-agent-auth`
- [Protocol specification](https://pdxwebdev.github.io/yadacoin-agent-auth-spec)
- [did:yadacoin method spec](https://pdxwebdev.github.io/yadacoin-agent-auth-spec/did-yadacoin-method-spec.html)
- [YadaCoin node](https://github.com/pdxwebdev/yadacoin)

## License

YadaCoin Open Source License (YOSL) v1.1 — Copyright © 2017-2026 Matthew Vogel, Inc.
