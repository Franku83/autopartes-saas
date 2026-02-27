import { z } from "zod";

export const vehicleCreateSchema = z.object({
  make: z.string().min(1).max(40),
  model: z.string().min(1).max(60),
  year: z.number().int().min(1950).max(2035),
  trim: z.string().max(60).optional(),
  engineCode: z.string().max(40).optional(),
  vin: z.string().max(40).optional(),
  notes: z.string().max(500).optional()
});

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;