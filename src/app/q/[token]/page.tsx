import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { roomSlug } from "@/lib/security/tokens";
import { appConfig } from "@/config/app";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

/** Lien court : /q/<token> → page chambre complète */
export default async function ShortQrPage({ params }: PageProps) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    notFound();
  }

  const room = await prisma.room.findFirst({
    where: { qrToken: token, qrTokenActive: true, isActive: true },
  });
  if (!room) notFound();

  redirect(
    `${appConfig.publicRoomPathPrefix}/${roomSlug(room.number)}/${room.qrToken}`,
  );
}
