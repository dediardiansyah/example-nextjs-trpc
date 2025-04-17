'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { UnitStatus } from '@prisma/client';
import { createUnitSchema, updateUnitSchema } from '@/schemas/unit';
import { useFormMutationFormData } from '@/hooks/useFromMutationFormData';
import useFormState from '@/hooks/useFromState';
import Image from 'next/image';

type FormState = {
    id?: number;
    unitCode?: string;
    floorId?: number;
    roomTypeId?: number;
    priceOffer?: number | bigint;
    semiGrossArea?: number;
    status?: UnitStatus;
    facilities?: number[];
    images?: File[];
};

export default function UnitsPage() {
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { formState, handleChange, setFormState } = useFormState<FormState>({});
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});

    const limit = 10;

    const [unitCodeInput, setUnitCodeInput] = useState('');
    const [unitCode, setUnitCode] = useState('');
    const [selectedFacilityId, setSelectedFacilityId] = useState<number | ''>('');
    const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | ''>('');

    let debounceTimeout: ReturnType<typeof setTimeout>;

    const handleUnitCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUnitCodeInput(e.target.value);
        clearTimeout(debounceTimeout);

        debounceTimeout = setTimeout(() => {
            setUnitCode(e.target.value);
            setPage(1);
        }, 500);
    };

    const { data, refetch, isLoading, error } = trpc.unit.getAll.useQuery({
        page,
        limit,
        unitCode,
        facilityId: selectedFacilityId || undefined,
        roomTypeId: selectedRoomTypeId || undefined,
    });

    const facilitiesQuery = trpc.facility.getAll.useQuery({ page: 1, limit: 100 });
    const floorsQuery = trpc.floor.getAll.useQuery({ page: 1, limit: 100 });
    const roomTypesQuery = trpc.roomType.getAll.useQuery({ page: 1, limit: 100 });

    const createUnitMutation = trpc.unit.create.useMutation();
    const updateUnitMutation = trpc.unit.update.useMutation();
    const deleteUnitMutation = trpc.unit.delete.useMutation();

    const statusValues = Object.values(UnitStatus);

    const openCreateModal = () => {
        setFormState({
            floorId: floorsQuery.data?.data[0].id,
            roomTypeId: roomTypesQuery.data?.data[0].id,
            status: UnitStatus.available,
        });
        setFormErrors({});
        setIsModalOpen(true);
    };

    const openEditModal = (unit: NonNullable<typeof data>["data"][number]) => {
        setFormState({
            id: unit.id,
            floorId: Number(unit.floorId),
            roomTypeId: Number(unit.roomTypeId),
            priceOffer: unit.priceOffer,
            semiGrossArea: unit.semiGrossArea,
            unitCode: unit.unitCode,
            status: unit.status,
        });
        setFormErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const { handleSubmit } = useFormMutationFormData({
        formState,
        setFormErrors,
        createSchema: createUnitSchema,
        updateSchema: updateUnitSchema,
        createMutation: createUnitMutation,
        updateMutation: updateUnitMutation,
        onSuccess: () => {
            closeModal();
            refetch();
        },
    });

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this unit?')) {
            deleteUnitMutation.mutate({ id }, { onSuccess: () => refetch() });
        }
    };

    if (isLoading || floorsQuery.isLoading || roomTypesQuery.isLoading || facilitiesQuery.isLoading)
        return <p>Loading...</p>;
    if (error) return <p className="text-red-500">Error loading units</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Unit List</h1>

            <button
                onClick={openCreateModal}
                className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
            >
                + Create Unit
            </button>

            {/* ✅ UnitCode and Filters */}
            <div className="flex flex-wrap gap-4 items-center mb-4">
                <input
                    type="text"
                    placeholder="Search by unit code..."
                    value={unitCodeInput}
                    onChange={handleUnitCodeChange}
                    className="border px-3 py-2 rounded w-64"
                />

                <select
                    value={selectedFacilityId}
                    onChange={(e) => setSelectedFacilityId(Number(e.target.value) || '')}
                    className="border px-3 py-2 rounded"
                >
                    <option value="">All Facilities</option>
                    {facilitiesQuery.data?.data.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>

                <select
                    value={selectedRoomTypeId}
                    onChange={(e) => setSelectedRoomTypeId(Number(e.target.value) || '')}
                    className="border px-3 py-2 rounded"
                >
                    <option value="">All Room Types</option>
                    {roomTypesQuery.data?.data.map((rt) => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                    ))}
                </select>

                <button
                    onClick={() => {
                        setUnitCodeInput('');
                        setUnitCode('');
                        setSelectedFacilityId('');
                        setSelectedRoomTypeId('');
                        setPage(1);
                    }}
                    className="bg-gray-300 px-3 py-2 rounded"
                >
                    Reset
                </button>
            </div>

            {/* Table */}
            <table className="w-full border border-gray-200 rounded-md">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Unit Code</th>
                        <th className="text-left p-2">Price Offer</th>
                        <th className="text-left p-2">Semi Gross Area</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Room Type</th>
                        <th className="text-left p-2">Facilities</th>
                        <th className="text-left p-2">Images</th>
                        <th className="text-left p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data?.data.map((unit) => (
                        <tr key={unit.id} className="border-t">
                            <td className="p-2">{unit.id}</td>
                            <td className="p-2">{unit.unitCode}</td>
                            <td className="p-2">{unit.priceOffer}</td>
                            <td className="p-2">{unit.semiGrossArea}</td>
                            <td className="p-2">{unit.status}</td>
                            <td className="p-2">{unit.roomType?.name}</td>
                            <td className="p-2">
                                <ul className="list-disc list-inside space-y-1">
                                    {unit.facilities?.map((f, index) => (
                                        <li key={index}>{f.facility?.name}</li>
                                    ))}
                                </ul>
                            </td>
                            <td className="p-2">
                                <div className="flex flex-wrap gap-2">
                                    {unit.images?.map((img, index) => (
                                        <div key={index} className="w-16 h-16 rounded overflow-hidden">
                                            <Image src={img.imageUrl} alt={img.description || "Unit image"} className="w-full h-full object-cover" width={64} height={64} />
                                        </div>
                                    ))}
                                </div>
                            </td>
                            <td className="p-2">
                                <button
                                    onClick={() => openEditModal(unit)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(unit.id)}
                                    className="px-3 py-1 bg-red-500 text-white rounded"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
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

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {formState.id ? 'Edit Unit' : 'Create Unit'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Room Type</label>
                                <select
                                    name="roomTypeId"
                                    value={formState.roomTypeId}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value={0} disabled>Select Tower</option>
                                    {roomTypesQuery.data?.data.map((roomType) => (
                                        <option key={roomType.id} value={roomType.id}>
                                            {roomType.name}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.roomTypeId && <p className="text-red-500 text-sm">{formErrors.roomTypeId}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Floor</label>
                                <select
                                    name="floorId"
                                    value={formState.floorId}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value={0} disabled>Select Tower</option>
                                    {floorsQuery.data?.data.map((floor) => (
                                        <option key={floor.id} value={floor.id}>
                                            {floor.label}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.floorId && <p className="text-red-500 text-sm">{formErrors.floorId}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Price Offer</label>
                                <input
                                    name="priceOffer"
                                    value={typeof formState.priceOffer === 'bigint' ? Number(formState.priceOffer) : formState.priceOffer ?? 0}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                    type="number"
                                />
                                {formErrors.priceOffer && <p className="text-red-500 text-sm">{formErrors.priceOffer}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Semi Gross Area</label>
                                <input
                                    name="semiGrossArea"
                                    value={formState.semiGrossArea ?? ''}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                    type='number'
                                />
                                {formErrors.semiGrossArea && <p className="text-red-500 text-sm">{formErrors.semiGrossArea}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Unit Code</label>
                                <input
                                    name="unitCode"
                                    value={formState.unitCode ?? ''}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                                {formErrors.unitCode && <p className="text-red-500 text-sm">{formErrors.unitCode}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Status</label>
                                <select
                                    name="status"
                                    value={formState.status}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    {statusValues.map((r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.status && <p className="text-red-500 text-sm">{formErrors.status}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Facilities</label>
                                <select
                                    name="facilities"
                                    multiple
                                    value={(formState.facilities || []).map(String)}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    {facilitiesQuery.data?.data.map((facility) => (
                                        <option key={facility.id} value={facility.id}>
                                            {facility.name}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.facilities && (
                                    <p className="text-red-500 text-sm">{formErrors.facilities}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Images</label>
                                <input
                                    type="file"
                                    name="images"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                                {formErrors.images && (
                                    <p className="text-red-500 text-sm">{formErrors.images}</p>
                                )}
                            </div>

                            <div className="flex justify-end mt-6 space-x-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded border border-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 rounded bg-blue-600 text-white"
                                >
                                    {formState.id ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
