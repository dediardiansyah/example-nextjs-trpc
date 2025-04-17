'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { PaymentType } from '@prisma/client';
import useFormState from '@/hooks/useFromState';
import { transformObjectToFormData } from '@/utils/transformObjectToFormData';

type ReservationFormState = {
    customer: {
        name: string;
        ktpNumber: string;
        npwpNumber: string;
        email: string;
        phoneNumber: string;
        address: string;
        city: string;
        province: string;
        customerSource: string;
    }
    reservation: {
        mediaSourceCategory: string;
        mediaSourceDesc: string;
        notes: string;
        paymentType: PaymentType;
        unitId: number;
    }
};

type PaymentProofFormState = {
    paymentProof?: File;
    reservationUuid?: string;
};

export default function ReservationsPage() {
    const [page, setPage] = useState(1);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { formState: reservationFormState, handleChange: handleReservationChange, resetForm: resetReservationForm } = useFormState<ReservationFormState>({
        customer: {
            name: "",
            ktpNumber: "",
            npwpNumber: "",
            email: "",
            phoneNumber: "",
            address: "",
            city: "",
            province: "",
            customerSource: "",
        },
        reservation: {
            mediaSourceCategory: "",
            mediaSourceDesc: "",
            notes: "",
            paymentType: PaymentType.cash,
            unitId: 0,
        }
    });

    const { formState: paymentProofFormState, handleChange: handlePaymentProofChange, resetForm: resetPaymentProofForm } = useFormState<PaymentProofFormState>({
        paymentProof: undefined,
        reservationUuid: undefined,
    });

    const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});
    const limit = 10;

    const { data, isLoading, error, refetch } = trpc.reservation.getAll.useQuery({ page, limit });
    const unitsQuery = trpc.unit.getAll.useQuery({ page: 1, limit: 100 });
    const uploadProofMutation = trpc.reservation.uploadPaymentProof.useMutation();
    const updateStatusMutation = trpc.reservation.updateStatus.useMutation();
    const createReservationMutation = trpc.reservation.create.useMutation();

    const openCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        resetReservationForm();
    };

    const openUploadModal = (reservationUuid: string) => {
        paymentProofFormState.reservationUuid = reservationUuid;
        setIsUploadModalOpen(true);
    };

    const closeUploadModal = () => {
        setIsUploadModalOpen(false);
        resetPaymentProofForm();
    };

    const handleCreateReservation = () => {
        if (!reservationFormState) {
            setFormErrors({ customer: 'Required fields missing' });
            return;
        }

        createReservationMutation.mutate(
            reservationFormState,
            {
                onSuccess: () => {
                    refetch();
                    closeCreateModal();
                },
            }
        );
    };

    const handleUpload = async () => {
        if (!paymentProofFormState.paymentProof || !paymentProofFormState.reservationUuid) {
            setFormErrors({ paymentProof: 'Required' });
            return;
        }

        const formData = transformObjectToFormData(paymentProofFormState);

        uploadProofMutation.mutate(formData, {
            onSuccess: () => {
                refetch();
                closeUploadModal();
            },
        }
        );
    };


    if (isLoading || unitsQuery.isLoading) return <p>Loading reservations...</p>;
    if (error || unitsQuery.isLoading) return <p className="text-red-500">Failed to load reservations.</p>;

    const handleStatusChange = async (reservationUuid: string, status: "booked" | "declined") => {
        try {
            updateStatusMutation.mutate({
                reservationUuid,
                status,
            });
            refetch();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Reservations</h1>
            <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded mb-4"
            >
                Create New Reservation
            </button>

            <table className="w-full border border-gray-200 rounded-md">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="text-left p-2">Customer</th>
                        <th className="text-left p-2">Unit</th>
                        <th className="text-left p-2">Salesman</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Proof</th>
                        <th className="text-left p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data?.data.map((reservation) => (
                        <tr key={reservation.uuid} className="border-t">
                            <td className="p-2">{reservation.customer.name}</td>
                            <td className="p-2">{reservation.unit.unitCode}</td>
                            <td className="p-2">{reservation.salesman.name}</td>
                            <td className="p-2">{reservation.status}</td>
                            <td className="p-2">
                                {reservation.payment_proof_url ? (
                                    <a href={reservation.payment_proof_url} target="_blank" className="text-blue-600 underline">
                                        View
                                    </a>
                                ) : (
                                    'No proof'
                                )}
                            </td>
                            <td className="p-2 space-x-2">
                                <button
                                    onClick={() => openUploadModal(reservation.uuid)}
                                    className="px-2 py-1 bg-indigo-500 text-white rounded"
                                >
                                    Upload Proof
                                </button>
                                {reservation.status === 'paid' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusChange(reservation.uuid, 'booked')}
                                            className="px-2 py-1 bg-green-600 text-white rounded"
                                        >
                                            Mark Booked
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(reservation.uuid, 'declined')}
                                            className="px-2 py-1 bg-red-500 text-white rounded"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={!data?.prevPage}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Prev
                </button>
                <span>Page {data?.currentPage} of {data?.lastPage}</span>
                <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data?.nextPage}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            {/* Create Reservation Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create New Reservation</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Unit</label>
                                <select
                                    name="reservation.unitId"
                                    value={reservationFormState.reservation.unitId}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value={0} disabled>Select Unit</option>
                                    {unitsQuery.data?.data.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.unitCode}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Media Source Category</label>
                                <input
                                    type="text"
                                    name="reservation.mediaSourceCategory"
                                    value={reservationFormState.reservation.mediaSourceCategory}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Media Source Description</label>
                                <input
                                    type="text"
                                    name="reservation.mediaSourceDesc"
                                    value={reservationFormState.reservation.mediaSourceDesc}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Notes</label>
                                <textarea
                                    name="reservation.notes"
                                    value={reservationFormState.reservation.notes}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <select
                                name="reservation.paymentType"
                                value={reservationFormState.reservation.paymentType ?? ''}
                                onChange={handleReservationChange}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="" disabled>Select Payment Type</option>
                                {Object.values(PaymentType).map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>

                            <div>
                                <label className="block text-sm font-medium">Customer Name</label>
                                <input
                                    type="text"
                                    name="customer.name"
                                    value={reservationFormState.customer.name}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">KTP Number</label>
                                <input
                                    type="text"
                                    name="customer.ktpNumber"
                                    value={reservationFormState.customer.ktpNumber}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">NPWP Number</label>
                                <input
                                    type="text"
                                    name="customer.npwpNumber"
                                    value={reservationFormState.customer.npwpNumber}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    name="customer.email"
                                    value={reservationFormState.customer.email}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Phone Number</label>
                                <input
                                    type="tel"
                                    name="customer.phoneNumber"
                                    value={reservationFormState.customer.phoneNumber}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Address</label>
                                <input
                                    type="text"
                                    name="customer.address"
                                    value={reservationFormState.customer.address}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">City</label>
                                <input
                                    type="text"
                                    name="customer.city"
                                    value={reservationFormState.customer.city}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Province</label>
                                <input
                                    type="text"
                                    name="customer.province"
                                    value={reservationFormState.customer.province}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Customer Source</label>
                                <input
                                    type="text"
                                    name="customer.customerSource"
                                    value={reservationFormState.customer.customerSource}
                                    onChange={handleReservationChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 space-x-2">
                            <button
                                onClick={closeCreateModal}
                                className="px-4 py-2 rounded border border-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateReservation}
                                className="px-4 py-2 rounded bg-blue-600 text-white"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Proof Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Upload Payment Proof</h2>

                        <input
                            type="file"
                            name="paymentProof"
                            accept="image/*,application/pdf"
                            onChange={handlePaymentProofChange}
                            className="w-full"
                        />
                        {formErrors.paymentProof && (
                            <p className="text-red-500 text-sm">{formErrors.paymentProof}</p>
                        )}

                        <div className="flex justify-end mt-6 space-x-2">
                            <button
                                onClick={closeUploadModal}
                                className="px-4 py-2 rounded border border-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                className="px-4 py-2 rounded bg-blue-600 text-white"
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
