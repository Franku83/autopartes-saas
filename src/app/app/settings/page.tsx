import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";
import JoinCodePanel from "@/components/settings/join-code-panel";
import WhitelistPanel from "@/components/settings/whitelist-panel";

export default async function SettingsPage() {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    select: { role: true }
  });

  const isOwner = membership?.role === "OWNER";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ajustes</h1>
        <p className="text-sm text-gray-600 mt-1">
          {isOwner ? "Configuración del negocio y accesos." : "Configuración de tu cuenta."}
        </p>
      </div>

      {isOwner ? (
        <div className="space-y-6">
          <JoinCodePanel />
          <WhitelistPanel />
        </div>
      ) : (
        <section className="rounded-xl border bg-white p-4">
          <div className="text-sm font-medium">Cuenta</div>
          <div className="text-sm text-gray-600 mt-2">
            Tu rol no permite ver configuraciones de acceso del negocio.
          </div>
        </section>
      )}
    </div>
  );
}