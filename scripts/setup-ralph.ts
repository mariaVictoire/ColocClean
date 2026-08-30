/**
 * Crée le compte Ralph + 3 colocations (6 chambres chacune).
 * Arnold (arnold@coloclean.com) garde la colocation existante.
 *
 * Usage : npx tsx scripts/setup-ralph.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { createPropertyForOwner } from "../src/lib/property-setup";

const prisma = new PrismaClient();

const RALPH = {
  email: "ralph@coloclean.com",
  password: "ralphDemo123",
  name: "Ralph",
  colocations: [
    "Colocation Ralph 1",
    "Colocation Ralph 2",
    "Colocation Ralph 3",
  ],
};

async function main() {
  const arnold =
    (await prisma.user.findUnique({
      where: { email: "arnold@coloclean.com" },
    })) ??
    (await prisma.user.findFirst({
      where: { role: UserRole.OWNER },
      orderBy: { createdAt: "asc" },
    }));

  if (!arnold) throw new Error("Aucun owner existant (Arnold).");

  if (arnold.email !== "arnold@coloclean.com") {
    await prisma.user.update({
      where: { id: arnold.id },
      data: { email: "arnold@coloclean.com", name: "Arnold" },
    });
  }

  const existingProps = await prisma.property.findMany({
    where: { ownerId: arnold.id },
    orderBy: { createdAt: "asc" },
  });
  if (existingProps.length === 0) {
    const orphan = await prisma.property.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (orphan) {
      await prisma.property.update({
        where: { id: orphan.id },
        data: { ownerId: arnold.id, name: "Colocation Arnold" },
      });
      console.log(`✔ Colocation liée à Arnold (${arnold.email})`);
    }
  } else {
    console.log(`✔ Arnold : ${existingProps.length} colocation(s)`);
  }

  let ralph = await prisma.user.findUnique({
    where: { email: RALPH.email },
  });
  const legacyRalph = await prisma.user.findUnique({
    where: { email: "ralps@coloclean.demo" },
  });

  if (!ralph && legacyRalph) {
    ralph = await prisma.user.update({
      where: { id: legacyRalph.id },
      data: {
        email: RALPH.email,
        name: RALPH.name,
        passwordHash: await bcrypt.hash(RALPH.password, 12),
      },
    });
    console.log(`✔ Compte migré : ${RALPH.email}`);
  } else if (!ralph) {
    ralph = await prisma.user.create({
      data: {
        email: RALPH.email,
        name: RALPH.name,
        role: UserRole.OWNER,
        passwordHash: await bcrypt.hash(RALPH.password, 12),
      },
    });
    console.log(`✔ Compte créé : ${RALPH.email}`);
  } else {
    console.log(`✔ Compte existant : ${RALPH.email}`);
  }

  const already = await prisma.property.count({
    where: { ownerId: ralph.id },
  });
  if (already >= 3) {
    console.log(`✔ Ralph a déjà ${already} colocations — rien à créer.`);
  } else {
    for (const name of RALPH.colocations.slice(already)) {
      const p = await createPropertyForOwner(ralph.id, name, 6);
      console.log(`✔ Créé : ${p.name} (${p.id})`);
    }
  }

  console.log("\nConnexions :");
  console.log(`  Arnold → arnold@coloclean.com`);
  console.log(`  Ralph  → ${RALPH.email} / ${RALPH.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
