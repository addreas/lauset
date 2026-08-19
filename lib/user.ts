import { createHash } from "node:crypto";
import type { Identity } from "@ory/client-fetch";

/**
 * Extract the user's full name from a Kratos identity.
 * Falls back: traits.name → traits.name.first + traits.name.last → email → identity ID.
 */
export function getUserFullName(identity: Identity | undefined): string {
  if (!identity) return "Unknown";

  const traits = identity.traits as Record<string, unknown> | undefined;
  if (!traits) return identity.id;

  // Try "name" as a string
  if (typeof traits.name === "string" && traits.name) {
    return traits.name;
  }

  // Try "name" as { first, last }
  if (
    traits.name &&
    typeof traits.name === "object" &&
    (traits.name as Record<string, unknown>).first
  ) {
    const name = traits.name as Record<string, string>;
    return [name.first, name.last].filter(Boolean).join(" ");
  }

  // Try verifiable email
  const firstEmail = identity.verifiable_addresses?.[0]?.value;
  if (firstEmail) return firstEmail;

  // Fallback to identity ID
  return identity.id;
}

/**
 * Compute the Gravatar hash from an identity's verified email.
 */
export function generateGravatarHash(
  identity: Identity,
): string {
  const email = identity.verifiable_addresses?.[0]?.value!;
  return md5Hex(email.toLowerCase());
}

/**
 * MD5 hex digest. Deno's `crypto.subtle` doesn't support MD5, but `node:crypto` does.
 */
function md5Hex(input: string): string {
  return createHash("md5").update(input).digest("hex");
}
