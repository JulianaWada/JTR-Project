import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createSessionToken, readSessionToken } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { verifyPaystackSignature } from "@/lib/paystack";
import { parseWebhook, verifyWhatsAppSignature } from "@/lib/whatsapp/cloud-api";

describe("signatures", () => {
  it("checks Meta's X-Hub-Signature-256", () => {
    const body = '{"entry":[]}';
    const good = `sha256=${createHmac("sha256", "app-secret").update(body).digest("hex")}`;
    expect(verifyWhatsAppSignature(body, good, "app-secret")).toBe(true);
    expect(verifyWhatsAppSignature(body + " ", good, "app-secret")).toBe(false);
    expect(verifyWhatsAppSignature(body, null, "app-secret")).toBe(false);
  });

  it("checks Paystack's x-paystack-signature", () => {
    const body = '{"event":"charge.success"}';
    const good = createHmac("sha512", "sk_test_x").update(body).digest("hex");
    expect(verifyPaystackSignature(body, good, "sk_test_x")).toBe(true);
    expect(verifyPaystackSignature(body, good, "sk_test_y")).toBe(false);
  });
});

describe("WhatsApp webhook parsing", () => {
  it("reads text, button replies, locations and voice notes", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: "123" },
                contacts: [{ wa_id: "2348031234567", profile: { name: "Ada" } }],
                messages: [
                  { from: "2348031234567", id: "w1", timestamp: "1790000000", type: "text", text: { body: "Hi" } },
                  { from: "2348031234567", id: "w2", timestamp: "1790000001", type: "interactive", interactive: { button_reply: { title: "Yes" } } },
                  { from: "2348031234567", id: "w3", timestamp: "1790000002", type: "location", location: { latitude: 9.07, longitude: 7.49, name: "Home" } },
                  { from: "2348031234567", id: "w4", timestamp: "1790000003", type: "audio", audio: {} },
                ],
                statuses: [{ id: "out1", status: "read" }],
              },
            },
          ],
        },
      ],
    };
    const { messages, statuses } = parseWebhook(payload);
    expect(messages.map((m) => m.text)).toEqual([
      "Hi",
      "Yes",
      "[Shared a location pin: Home (9.07, 7.49) https://maps.google.com/?q=9.07,7.49]",
      "[Sent a voice note]",
    ]);
    expect(messages[0]).toMatchObject({ phoneNumberId: "123", profileName: "Ada" });
    expect(messages[3].readable).toBe(false);
    expect(statuses).toEqual([{ id: "out1", status: "read", error: undefined }]);
    expect(parseWebhook({ nonsense: true })).toEqual({ messages: [], statuses: [] });
  });
});

describe("dashboard auth", () => {
  it("hashes passwords and signs sessions", () => {
    const hash = hashPassword("secret");
    expect(verifyPassword("secret", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
    const token = createSessionToken("tenant-1", 1_000_000);
    expect(readSessionToken(token, 1_000_000)).toBe("tenant-1");
    expect(readSessionToken(token.replace("tenant-1", "tenant-2"), 1_000_000)).toBeNull();
    expect(readSessionToken(token, 1_000_000 + 15 * 24 * 3600 * 1000)).toBeNull();
  });
});
