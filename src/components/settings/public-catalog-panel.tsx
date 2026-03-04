"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Globe, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PublicCatalogPanel({ 
  initialSlug, 
  orgName 
}: { 
  initialSlug: string | null;
  orgName: string;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const router = useRouter();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const publicUrl = `${baseUrl}/public/${slug}`;

  async function generateSlug() {
    setLoading(true);
    try {
      const res = await fetch("/api/org/catalog/slug", {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        setSlug(data.slug);
        router.refresh();
      } else {
        alert(data.error || "No se pudo generar el slug");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      alert("No se pudo copiar al portapapeles");
    }
  }

  return (
    <Card className="overflow-hidden border-blue-100 bg-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Tu Catálogo Público</CardTitle>
        </div>
        <CardDescription>
          Comparte tu inventario disponible con clientes externos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {slug ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-white border rounded-md font-mono text-sm truncate">
                {publicUrl}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="shrink-0"
                  onClick={copyToClipboard}
                >
                  {copying ? "¡Copiado!" : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="shrink-0"
                  asChild
                >
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <p className="text-sm text-gray-600 text-center max-w-sm">
              Tu catálogo público todavía no está configurado. Genera una URL única basada en el nombre de tu negocio.
            </p>
            <Button 
              onClick={generateSlug} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generar URL de Catálogo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
