"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type Item = {
  id: string;
  quantity: number;
  priceUsd: string;
  partModel: {
    sku: string;
    name: string;
    category: string;
    compatibility: string | null;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    engineCode: string | null;
  } | null;
};

interface PublicCatalogClientProps {
  items: Item[];
  bcvRate: number;
}

export default function PublicCatalogClient({ items, bcvRate }: PublicCatalogClientProps) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;

    return items.filter((it) => {
      const name = it.partModel.name.toLowerCase();
      const sku = it.partModel.sku.toLowerCase();
      const vehicle = it.vehicle ? `${it.vehicle.make} ${it.vehicle.model}`.toLowerCase() : "";
      const compatibility = it.partModel.compatibility?.toLowerCase() || "";

      return (
        name.includes(q) ||
        sku.includes(q) ||
        vehicle.includes(q) ||
        compatibility.includes(q)
      );
    });
  }, [items, search]);

  return (
    <div className="space-y-8">
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, SKU o modelo..."
          className="pl-10 h-12 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((it) => {
            const priceUsd = Number(it.priceUsd);
            const priceVes = priceUsd * bcvRate;

            return (
              <Card key={it.id} className="flex flex-col hover:shadow-lg transition-shadow border-t-4 border-t-blue-600">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-50">
                      {it.partModel.category}
                    </Badge>
                    {it.vehicle && (
                      <Badge variant="secondary" className="text-[10px]">
                        {it.vehicle.make} {it.vehicle.model}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-semibold leading-tight">
                    {it.partModel.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-4 pt-0 flex flex-col flex-grow">
                  <div className="space-y-2 mb-6">
                    {it.partModel.sku && (
                      <p className="text-xs font-mono text-muted-foreground bg-gray-50 p-1 px-2 rounded w-fit">
                        SKU: {it.partModel.sku}
                      </p>
                    )}
                    {it.partModel.compatibility && (
                      <p className="text-sm text-gray-600 italic line-clamp-3">
                        "{it.partModel.compatibility}"
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-dashed">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-3xl font-bold text-green-700">
                          ${priceUsd.toFixed(2)}
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                          {priceVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })} VES
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Stock</div>
                        <div className="text-lg font-bold text-gray-800">{it.quantity}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
          <p className="text-gray-500 text-lg italic">
            {search ? "No se encontraron resultados para tu búsqueda." : "No hay repuestos disponibles en este momento."}
          </p>
        </div>
      )}
    </div>
  );
}
