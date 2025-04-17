'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { useFormMutation } from '@/hooks/useFormMutation';
import { createRoomTypeSchema, updateRoomTypeSchema } from '@/schemas/roomType';
import useFormState from '@/hooks/useFromState';

type FormState = {
  id?: number;
  name: string;
};

export default function RoomTypesPage() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { formState, handleChange, setFormState } = useFormState<FormState>({ name: "" });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const limit = 10;

  const { data, refetch, isLoading, error } = trpc.roomType.getAll.useQuery({ page, limit });
  const createRoomTypeMutation = trpc.roomType.create.useMutation();
  const updateRoomTypeMutation = trpc.roomType.update.useMutation();
  const deleteRoomTypeMutation = trpc.roomType.delete.useMutation();

  const openCreateModal = () => {
    setFormErrors({});
    setFormState({ name: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (roomType: NonNullable<typeof data>["data"][number]) => {
    setFormState({
      id: roomType.id,
      name: roomType.name,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const { handleSubmit } = useFormMutation({
    formState,
    setFormErrors,
    createSchema: createRoomTypeSchema,
    updateSchema: updateRoomTypeSchema,
    createMutation: createRoomTypeMutation,
    updateMutation: updateRoomTypeMutation,
    onSuccess: () => {
      closeModal();
      refetch();
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this roomType?')) {
      deleteRoomTypeMutation.mutate({ id }, {
        onSuccess: () => refetch(),
      });
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">RoomType List</h1>

      <button
        onClick={openCreateModal}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
      >
        + Create RoomType
      </button>

      <table className="w-full border border-gray-200 rounded-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">ID</th>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map((roomType) => (
            <tr key={roomType.id} className="border-t">
              <td className="p-2">{roomType.id}</td>
              <td className="p-2">{roomType.name}</td>
              <td className="p-2">
                <button
                  onClick={() => openEditModal(roomType)}
                  className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(roomType.id)}
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
              {formState.id ? 'Edit RoomType' : 'Create RoomType'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
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
