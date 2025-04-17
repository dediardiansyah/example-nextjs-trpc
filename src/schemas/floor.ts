import { z } from 'zod';
import { zfd } from 'zod-form-data';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const createFloorSchema = zfd.formData({
  towerId: zfd.text(z.coerce.number()),
  label: zfd.text(),
  number: zfd.text(z.coerce.number()),
  floorPlanImage: z.instanceof(File)
    .refine(file => file.size <= MAX_FILE_SIZE, {
      message: 'File size must be less than 5MB',
    })
    .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: 'Unsupported file type. Only JPG, PNG, and WEBP are allowed.',
    }),
});

export const updateFloorSchema = zfd.formData({
  id: zfd.text(z.coerce.number()),
  towerId: zfd.text(z.coerce.number()).optional(),
  label: zfd.text().optional(),
  number: zfd.text(z.coerce.number()).optional(),
  floorPlanImage: z.instanceof(File)
    .refine(file => file.size <= MAX_FILE_SIZE, {
      message: 'File size must be less than 5MB',
    })
    .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: 'Unsupported file type. Only JPG, PNG, and WEBP are allowed.',
    })
    .optional(),
});

export const floorIdSchema = z.object({ id: z.number() });
