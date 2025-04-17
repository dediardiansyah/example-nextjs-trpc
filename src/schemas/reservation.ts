import { PaymentType, ReservationStatus } from "@prisma/client";
import { z } from "zod";
import { zfd } from "zod-form-data";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const createReservationSchema = z.object({
    customer: z.object({
        name: z.string(),
        ktpNumber: z.string(),
        npwpNumber: z.string(),
        email: z.string().email(),
        phoneNumber: z.string(),
        address: z.string(),
        city: z.string(),
        province: z.string(),
        customerSource: z.string(),
       
    }),
    reservation: z.object({
        mediaSourceCategory: z.string(),
        mediaSourceDesc: z.string(),
        paymentType: z.enum([
            PaymentType.cash,
            PaymentType.credit,
            PaymentType.installment,
            PaymentType.mortgage,
        ]),
        notes: z.string(),
        unitId: z.coerce.number(),
    }),
});

export const uploadReservationPaymentProofSchema = zfd.formData({
    reservationUuid: z.string(),
    paymentProof: z.instanceof(File)
        .refine(file => file.size <= MAX_FILE_SIZE, {
            message: 'File size must be less than 5MB',
        })
        .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), {
            message: 'Unsupported file type. Only JPG, PNG, and WEBP are allowed.',
        }),
});

export const updateReservationStatuSchema = z.object({
    reservationUuid: z.string(),
    status: z.enum([ReservationStatus.booked, ReservationStatus.declined]),
})