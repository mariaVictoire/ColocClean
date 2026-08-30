import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getActiveOwnedProperty } from "@/lib/property";
import { roomSlug } from "@/lib/security/tokens";
import { appConfig } from "@/config/app";
import { RoomEditor } from "@/components/admin/RoomEditor";
import { OwnerWhatsAppEditor } from "@/components/admin/OwnerWhatsAppEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Chambres — ${appConfig.name}`,
};

export default async function ChambresPage() {
  await requireOwner();
  const { property } = await getActiveOwnedProperty();
  const rooms = await prisma.room.findMany({
    where: { propertyId: property.id },
    orderBy: { number: "asc" },
  });

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Chambres</h1>
        <p className="mt-1 text-sm text-stone-600">
          Numéros WhatsApp et tokens QR permanents.
        </p>
      </div>

      <OwnerWhatsAppEditor ownerWhatsappNumber={property.ownerWhatsappNumber} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rooms.map((room) => {
          const slug = roomSlug(room.number);
          const qrPath = `${appConfig.publicRoomPathPrefix}/${slug}/${room.qrToken}`;
          return (
            <RoomEditor
              key={room.id}
              roomId={room.id}
              label={room.label}
              whatsappNumber={room.whatsappNumber}
              qrPath={qrPath}
            />
          );
        })}
      </div>
    </main>
  );
}
