import QRCode from "qrcode";
import { headers } from "next/headers";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getDefaultProperty } from "@/lib/property";
import { roomSlug } from "@/lib/security/tokens";
import { appConfig } from "@/config/app";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `QR codes — ${appConfig.name}`,
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

export default async function QrPage() {
  await requireOwner();
  const property = await getDefaultProperty();
  const baseUrl = await getBaseUrl();
  const rooms = await prisma.room.findMany({
    where: { propertyId: property.id, isActive: true },
    orderBy: { number: "asc" },
  });

  const cards = await Promise.all(
    rooms.map(async (room) => {
      const path = `${appConfig.publicRoomPathPrefix}/${roomSlug(room.number)}/${room.qrToken}`;
      const url = `${baseUrl}${path}`;
      const dataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        width: 280,
        color: { dark: "#134e4a", light: "#ffffff" },
      });
      return { room, url, path, dataUrl };
    }),
  );

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">QR codes</h1>
        <p className="mt-1 text-sm text-stone-600">
          À imprimer et coller dans chaque chambre. Liens permanents.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ room, url, dataUrl }) => (
          <article
            key={room.id}
            className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white p-5 text-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dataUrl}
              alt={`QR ${room.label}`}
              className="h-44 w-44"
              width={176}
              height={176}
            />
            <h2 className="mt-3 font-display text-lg font-semibold text-teal-950">
              {room.label}
            </h2>
            <p className="mt-1 break-all text-xs text-stone-500">{url}</p>
            <a
              href={dataUrl}
              download={`qr-${roomSlug(room.number)}.png`}
              className="touch-target mt-3 inline-flex w-full items-center justify-center rounded-xl border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Télécharger
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}
