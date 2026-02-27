import Sidebar from "@/components/app/sidebar";
import Topbar from "@/components/app/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-200 via-purple-200 to-indigo-300">
      <div className="min-h-screen grid grid-cols-[auto_1fr]">
        <Sidebar />

        <div className="min-w-0 p-6">
          <div className="rounded-2xl bg-white/90 backdrop-blur border shadow-sm overflow-hidden">
            <Topbar title="Autopartes" subtitle="Gestión de inventario y ventas" />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}