import { z } from 'zod';

export const createReportSchema = z.object({
  title: z.string().trim().min(5).max(140),
  description: z.string().trim().min(10).max(5000),
  category: z.enum(['Roads & sidewalks', 'Waste & sanitation', 'Streetlights', 'Water & drainage', 'Public safety', 'Parks & public spaces', 'Other']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  reporter: z.string().trim().max(120).optional().or(z.literal('')),
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  provinceId: z.string().uuid().optional(),
  municipalityId: z.string().uuid().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
});
