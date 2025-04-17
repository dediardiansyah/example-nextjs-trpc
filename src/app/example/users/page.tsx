'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { createUserSchema, updateUserSchema } from '@/schemas/user';
import { useFormMutation } from '@/hooks/useFormMutation';
import { UserRole } from '@prisma/client';
import useFormState from '@/hooks/useFromState';

type FormState = {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { formState, handleChange, setFormState } = useFormState<FormState>({
    name: '',
    email: '',
    password: '',
    role: UserRole.salesman,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const limit = 10;

  const { data, refetch, isLoading, error } = trpc.user.getAll.useQuery({ page, limit });
  const createUserMutation = trpc.user.create.useMutation();
  const updateUserMutation = trpc.user.update.useMutation();
  const deleteUserMutation = trpc.user.delete.useMutation();

  const roleValues = Object.values(UserRole);

  const openCreateModal = () => {
    setFormErrors({});
    setFormState({ name: '', email: '', password: '', role: UserRole.salesman });
    setIsModalOpen(true);
  };

  const openEditModal = (user: NonNullable<typeof data>["data"][number]) => {
    setFormState({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
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
    createSchema: createUserSchema,
    updateSchema: updateUserSchema,
    createMutation: createUserMutation,
    updateMutation: updateUserMutation,
    onSuccess: () => {
      closeModal();
      refetch();
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate({ id }, {
        onSuccess: () => refetch(),
      });
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User List</h1>

      <button
        onClick={openCreateModal}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
      >
        + Create User
      </button>

      <table className="w-full border border-gray-200 rounded-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">ID</th>
            <th className="text-left p-2">Email</th>
            <th className="text-left p-2">Role</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map((user) => (
            <tr key={user.id} className="border-t">
              <td className="p-2">{user.id}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2 capitalize">{user.role}</td>
              <td className="p-2">
                <button
                  onClick={() => openEditModal(user)}
                  className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
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
              {formState.id ? 'Edit User' : 'Create User'}
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

              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formState.password}
                  onChange={handleChange}
                  placeholder={formState.id ? '(Biarkan kosong jika tidak ingin mengubah)' : ''}
                  className="w-full border rounded px-3 py-2"
                />
                {formErrors.password && <p className="text-red-500 text-sm">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">Role</label>
                <select
                  name="role"
                  value={formState.role}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                >
                  {roleValues.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {formErrors.role && <p className="text-red-500 text-sm">{formErrors.role}</p>}
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
