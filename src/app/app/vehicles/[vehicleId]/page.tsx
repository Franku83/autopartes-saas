import VehiclePartsClient from "@/components/vehicles/vehicle-parts-client";

export default function VehiclePartsPage({ params }: { params: { vehicleId: string } }) {
  return <VehiclePartsClient vehicleId={params.vehicleId} />;
}