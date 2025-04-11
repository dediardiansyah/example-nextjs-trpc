'use client';
import { trpc } from '@/utils/trpc';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function PostPage() {
  const { data: session } = useSession();
  const postQuery = trpc.post.getAll.useQuery();

  const createPost = trpc.post.create.useMutation({
    onSuccess: () => postQuery.refetch(),
  });

  const updatePost = trpc.post.update.useMutation({
    onSuccess: () => postQuery.refetch(),
  });

  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => postQuery.refetch(),
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  const handleSubmit = () => {
    if (editId) {
      updatePost.mutate({ id: editId, title, content });
      setEditId(null);
    } else {
      createPost.mutate({ title, content });
    }
    setTitle('');
    setContent('');
  };

  const handleEdit = (post: { id: number; title: string; content: string }) => {
    setEditId(post.id);
    setTitle(post.title);
    setContent(post.content);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost.mutate({ id });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Post List</h1>

      {session && (
        <div className="bg-white rounded shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            {editId ? 'Update Post' : 'Create New Post'}
          </h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul"
            className="w-full mb-4 px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-gray-700"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Konten"
            rows={4}
            className="w-full mb-4 px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-gray-700"
          />
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {editId ? 'Update Post' : 'Tambah Post'}
          </button>
        </div>
      )}

      <div className="space-y-6">
        {postQuery.data?.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded shadow p-5 flex flex-col gap-2 border-l-4 border-blue-500"
          >
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold text-gray-700">{post.title}</h2>
              {session?.user?.email === post.author.email && (
                <div className="space-x-2">
                  <button
                    onClick={() => handleEdit(post)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-700">{post.content}</p>
            <small className="text-gray-500">By {post.author.email}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
