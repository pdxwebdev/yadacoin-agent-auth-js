import { describe, it, expect } from "vitest";
import {
  fromHex,
  toHex,
  getPublicKey,
  signChallenge,
  AgentAuthClient,
  buildVCScope,
  parseScope,
} from "../yadacoin-agent-auth.mjs";

// Fixed test private key (32 bytes, non-zero)
const TEST_PRIV_HEX =
  "0101010101010101010101010101010101010101010101010101010101010101";

describe("fromHex / toHex roundtrip", () => {
  it("converts hex to bytes and back", () => {
    const bytes = fromHex(TEST_PRIV_HEX);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(32);
    expect(toHex(bytes)).toBe(TEST_PRIV_HEX);
  });
});

describe("getPublicKey", () => {
  it("returns a 33-byte Uint8Array (compressed public key)", () => {
    const pub = getPublicKey(TEST_PRIV_HEX);
    expect(pub).toBeInstanceOf(Uint8Array);
    expect(pub.length).toBe(33);
    expect(pub[0] === 0x02 || pub[0] === 0x03).toBe(true);
  });

  it("is deterministic for the same private key", () => {
    expect(toHex(getPublicKey(TEST_PRIV_HEX))).toBe(toHex(getPublicKey(TEST_PRIV_HEX)));
  });

  it("differs for different private keys", () => {
    const priv2 =
      "0202020202020202020202020202020202020202020202020202020202020202";
    expect(toHex(getPublicKey(TEST_PRIV_HEX))).not.toBe(toHex(getPublicKey(priv2)));
  });
});

describe("signChallenge", () => {
  it("returns a base64 string", () => {
    const sig = signChallenge("deadbeef", TEST_PRIV_HEX);
    expect(typeof sig).toBe("string");
    // base64 chars only
    expect(/^[A-Za-z0-9+/]+=*$/.test(sig)).toBe(true);
  });

  it("is deterministic", () => {
    expect(signChallenge("deadbeef", TEST_PRIV_HEX)).toBe(
      signChallenge("deadbeef", TEST_PRIV_HEX)
    );
  });

  it("differs for different challenges", () => {
    expect(signChallenge("aabbcc", TEST_PRIV_HEX)).not.toBe(
      signChallenge("ddeeff", TEST_PRIV_HEX)
    );
  });
});

describe("AgentAuthClient", () => {
  it("can be instantiated with a challengeEndpoint", () => {
    const client = new AgentAuthClient({
      challengeEndpoint: "/api/challenge",
    });
    expect(client).toBeTruthy();
  });
});

describe("buildVCScope / parseScope roundtrip", () => {
  const input = {
    operatorPubHex: toHex(getPublicKey(TEST_PRIV_HEX)),
    agentPubHex: toHex(getPublicKey(
      "0202020202020202020202020202020202020202020202020202020202020202"
    )),
    authorizationType: "TravelBookingAuthorization",
    authorization: {
      destination: "New York City",
      checkin: "May 10",
      checkout: "May 15",
      services: ["hotel", "flight"],
    },
  };

  it("buildVCScope returns a non-empty base64 string", () => {
    const b64 = buildVCScope(input);
    expect(typeof b64).toBe("string");
    expect(b64.length).toBeGreaterThan(0);
  });

  it("parseScope round-trips the services list", () => {
    const b64 = buildVCScope(input);
    const parsed = parseScope(b64);
    expect(parsed.services).toEqual(["hotel", "flight"]);
  });

  it("parseScope round-trips the destination", () => {
    const b64 = buildVCScope(input);
    const parsed = parseScope(b64);
    expect(parsed.dest).toBe("New York City");
  });
});
