/**
 * Définit le WhatsApp bailleur de Ralph sur toutes ses colocations.
 * Usage : npx tsx scripts/set-ralph-whatsapp.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PHONE = "+33749048535"; // 0749048535

async function main() {
  const ralph = await prisma.user.findUnique({
    where: { email: "ralph@coloclean.com" },
  });
  if (!ralph) throw new Error("Ralph introuvable");

  const result = await prisma.property.updateMany({
    where: { ownerId: ralph.id },
    data: { ownerWhatsappNumber: PHONE },
  });

  console.log(`✔ ${result.count} colocation(s) → ${PHONE}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
