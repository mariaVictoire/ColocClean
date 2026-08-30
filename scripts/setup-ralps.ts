/**
 * Crée le compte Ralps + 3 colocations (6 chambres chacune).
 * Arnold (owner@coloclean.demo) garde la colocation existante.
 *
 * Usage : npx tsx scripts/setup-ralps.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { createPropertyForOwner } from "../src/lib/property-setup";

const prisma = new PrismaClient();

const RALPS = {
  email: "ralps@coloclean.demo",
  password: "RalpsDemo123!",
  name: "Ralps",
  colocations: [
    "Colocation Ralps 1",
    "Colocation Ralps 2",
    "Colocation Ralps 3",
  ],
};

async function main() {
  const arnold = await prisma.user.findFirst({
    where: { role: UserRole.OWNER },
    orderBy: { createdAt: "asc" },
  });
  if (!arnold) throw new Error("Aucun owner existant (Arnold).");

  // Lie la coloc actuelle à Arnold + renomme
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
    const first = existingProps[0];
    if (first.name.includes("Démo") || first.name === "Colocation Démo") {
      await prisma.property.update({
        where: { id: first.id },
        data: { name: "Colocation Arnold" },
      });
    }
    console.log(`✔ Arnold : ${existingProps.length} colocation(s)`);
  }

  await prisma.user.update({
    where: { id: arnold.id },
    data: { name: arnold.name ?? "Arnold" },
  });

  let ralps = await prisma.user.findUnique({ where: { email: RALPS.email } });
  if (!ralps) {
    ralps = await prisma.user.create({
      data: {
        email: RALPS.email,
        name: RALPS.name,
        role: UserRole.OWNER,
        passwordHash: await bcrypt.hash(RALPS.password, 12),
      },
    });
    console.log(`✔ Compte créé : ${RALPS.email}`);
  } else {
    console.log(`✔ Compte existant : ${RALPS.email}`);
  }

  const already = await prisma.property.count({
    where: { ownerId: ralps.id },
  });
  if (already >= 3) {
    console.log(`✔ Ralps a déjà ${already} colocations — rien à créer.`);
  } else {
    for (const name of RALPS.colocations.slice(already)) {
      const p = await createPropertyForOwner(ralps.id, name, 6);
      console.log(`✔ Créé : ${p.name} (${p.id})`);
    }
  }

  console.log("\nConnexions :");
  console.log(`  Arnold → ${arnold.email} (mot de passe actuel)`);
  console.log(`  Ralps  → ${RALPS.email} / ${RALPS.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
