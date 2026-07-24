import { describe, expect, it } from "vitest";
import {
  fillWhatsAppTemplate,
  toWhatsAppDigits,
  whatsappDeepLink,
} from "@/lib/whatsapp/messages";

describe("whatsapp messages", () => {
  it("remplit les placeholders", () => {
    const text = fillWhatsAppTemplate(
      "Chambre {numero_chambre} : {nom_tache} → {lien_validation}",
      {
        numero_chambre: 3,
        nom_tache: "Cuisine",
        date_limite: "dimanche",
        lien_validation: "https://exemple.test/q/abc",
      },
    );
    expect(text).toBe("Chambre 3 : Cuisine → https://exemple.test/q/abc");
  });

  it("normalise un numéro FR", () => {
    expect(toWhatsAppDigits("06 12 34 56 78")).toBe("33612345678");
  });

  it("construit un lien wa.me", () => {
    const link = whatsappDeepLink("+33612345678", "Bonjour");
    expect(link).toBe(
      "https://wa.me/33612345678?text=Bonjour",
    );
  });
});
