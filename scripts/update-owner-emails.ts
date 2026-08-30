/**
 * Met à jour les comptes : Arnold + Ralph (emails + mots de passe).
 * Usage : npx tsx scripts/update-owner-emails.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ARNOLD_PASSWORD = "arnoldDemo123§";
const RALPH_PASSWORD = "ralphDemo123";

async function main() {
  // Arnold (ancien owner@coloclean.demo)
  const arnoldCandidates = await prisma.user.findMany({
    where: {
      OR: [
        { email: "owner@coloclean.demo" },
        { email: "arnold@coloclean.com" },
        { name: "Arnold" },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const arnold =
    arnoldCandidates.find((u) => u.email === "arnold@coloclean.com") ??
    arnoldCandidates.find((u) => u.email === "owner@coloclean.demo") ??
    arnoldCandidates[0];

  if (arnold) {
    await prisma.user.update({
      where: { id: arnold.id },
      data: {
        email: "arnold@coloclean.com",
        name: "Arnold",
        passwordHash: await bcrypt.hash(ARNOLD_PASSWORD, 12),
      },
    });
    console.log(`✔ Arnold → arnold@coloclean.com / ${ARNOLD_PASSWORD}`);
  } else {
    console.warn("⚠ Compte Arnold introuvable");
  }

  // Ralph (ancien ralps@coloclean.demo)
  const ralphCandidates = await prisma.user.findMany({
    where: {
      OR: [
        { email: "ralps@coloclean.demo" },
        { email: "ralph@coloclean.com" },
        { name: "Ralps" },
        { name: "Ralph" },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const ralph =
    ralphCandidates.find((u) => u.email === "ralph@coloclean.com") ??
    ralphCandidates.find((u) => u.email === "ralps@coloclean.demo") ??
    ralphCandidates.find((u) => u.name === "Ralps" || u.name === "Ralph");

  if (ralph) {
    await prisma.user.update({
      where: { id: ralph.id },
      data: {
        email: "ralph@coloclean.com",
        name: "Ralph",
        passwordHash: await bcrypt.hash(RALPH_PASSWORD, 12),
      },
    });

    // Renommer ses colocations si encore "Ralps"
    const props = await prisma.property.findMany({
      where: { ownerId: ralph.id },
    });
    for (const p of props) {
      if (p.name.includes("Ralps")) {
        await prisma.property.update({
          where: { id: p.id },
          data: { name: p.name.replaceAll("Ralps", "Ralph") },
        });
        console.log(`✔ Coloc renommée : ${p.name.replaceAll("Ralps", "Ralph")}`);
      }
    }

    console.log(`✔ Ralph → ralph@coloclean.com / ${RALPH_PASSWORD}`);
  } else {
    console.warn("⚠ Compte Ralph introuvable");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
