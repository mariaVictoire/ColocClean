import { prisma } from "@/lib/db";

/** MVP : une seule propriété (seed démo). */
export async function getDefaultProperty() {
  const property = await prisma.property.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!property) {
    throw new Error("Aucune propriété configurée. Lancez le seed.");
  }
  return property;
}

export async function getDefaultPropertyId() {
  const property = await getDefaultProperty();
  return property.id;
}
