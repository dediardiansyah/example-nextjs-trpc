'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { createFloorSchema, updateFloorSchema } from '@/schemas/floor';
import { useFormMutationFormData } from '@/hooks/useFromMutationFormData';
import useFormState from '@/hooks/useFromState';

type FormState = {
    id?: number;
    towerId?: number;
    label: string;
    number: number;
    floorPlanImage?: File;
};

export default function FloorsPage() {
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { formState, handleChange, setFormState } = useFormState<FormState>({ label: '', number: 0 });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});

    const limit = 10;

    const { data, refetch, isLoading, error } = trpc.floor.getAll.useQuery({ limit, page })
    const towersQuery = trpc.tower.getAll.useQuery({ page: 1, limit: 100 });
    const createFloorMutation = trpc.floor.create.useMutation();
    const updateFloorMutation = trpc.floor.update.useMutation();
    const deleteFloorMutation = trpc.floor.delete.useMutation();

    const openCreateModal = () => {
        setFormErrors({});
        setFormState({ towerId: 0, label: '', number: 0 });
        setIsModalOpen(true);
    };

    const openEditModal = (floor: NonNullable<typeof data>["data"][number]) => {
        setFormState({
            id: floor.id,
            towerId: floor.towerId,
            label: floor.label,
            number: floor.number,
        });
        setFormErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const { handleSubmit } = useFormMutationFormData({
        formState,
        setFormErrors,
        createSchema: createFloorSchema,
        updateSchema: updateFloorSchema,
        createMutation: createFloorMutation,
        updateMutation: updateFloorMutation,
        onSuccess: () => {
            closeModal();
            refetch();
        },
    });

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this floor?')) {
            deleteFloorMutation.mutate({ id }, {
                onSuccess: () => refetch(),
            });
        }
    };

    if (isLoading || towersQuery.isLoading) return <p>Loading...</p>;
    if (error || towersQuery.error) return <p className="text-red-500">Error loading data</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Floor List</h1>

            <button
                onClick={openCreateModal}
                className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
            >
                + Create Floor
            </button>

            <table className="w-full border border-gray-200 rounded-md">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Label</th>
                        <th className="text-left p-2">Number</th>
                        <th className="text-left p-2">Tower</th>
                        <th className="text-left p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data?.data.map((floor) => (
                        <tr key={floor.id} className="border-t">
                            <td className="p-2">{floor.id}</td>
                            <td className="p-2">{floor.label}</td>
                            <td className="p-2">{floor.number}</td>
                            <td className="p-2">{floor.tower.name}</td>
                            <td className="p-2">
                                <button
                                    onClick={() => openEditModal(floor)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(floor.id)}
                                    className="px-3 py-1 bg-red-500 text-white rounded"
                                >
                                    Delete
                                </button>
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

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {formState.id ? 'Edit Floor' : 'Create Floor'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Tower</label>
                                <select
                                    name="towerId"
                                    value={formState.towerId}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value={0} disabled>Select Tower</option>
                                    {towersQuery.data?.data.map((tower) => (
                                        <option key={tower.id} value={tower.id}>
                                            {tower.name}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.towerId && <p className="text-red-500 text-sm">{formErrors.towerId}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Label</label>
                                <input
                                    name="label"
                                    value={formState.label}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                                {formErrors.label && <p className="text-red-500 text-sm">{formErrors.label}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Number</label>
                                <input
                                    type="number"
                                    name="number"
                                    value={formState.number}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                                {formErrors.number && <p className="text-red-500 text-sm">{formErrors.number}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Floor Plan Image</label>
                                <input
                                    type="file"
                                    name="floorPlanImage"
                                    onChange={handleChange}
                                    className="w-full"
                                />
                                {formErrors.floorPlanImage && (
                                    <p className="text-red-500 text-sm">{formErrors.floorPlanImage}</p>
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
