import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, Theme } from '../../lib/supabase';

interface ThemeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem?: Theme | null;
  eWalletId: string;
}

const ThemeForm: React.FC<ThemeFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingItem,
  eWalletId
}) => {
  const [name, setName] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setMaxBudget(editingItem.max_budget.toString());
    } else {
      setName('');
      setMaxBudget('');
    }
  }, [editingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const loadingToast = toast.loading(
      editingItem ? 'Memperbarui tema...' : 'Membuat tema...'
    );

    try {
      const themeData = {
        name,
        max_budget: parseFloat(maxBudget) || 0,
        e_wallet_id: eWalletId,
        updated_at: new Date().toISOString(),
      };

      if (editingItem) {
        const { error } = await supabase
          .from('themes')
          .update(themeData)
          .eq('id', editingItem.id);

        if (error) throw error;
        
        toast.dismiss(loadingToast);
        toast.success('Tema berhasil diperbarui!');
      } else {
        const { error } = await supabase
          .from('themes')
          .insert([{
            ...themeData,
            current_spent: 0,
            created_at: new Date().toISOString(),
          }]);

        if (error) throw error;
        
        toast.dismiss(loadingToast);
        toast.success('Tema berhasil dibuat!');
      }

      onSuccess();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(`Gagal ${editingItem ? 'memperbarui' : 'membuat'} tema: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full border border-gray-200 dark:border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingItem ? 'Edit Tema' : 'Tambah Tema'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Tema
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white"
                placeholder="Masukkan nama tema"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Anggaran Maksimal
              </label>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white"
                placeholder="0"
                min="0"
                step="any"
                required
              />
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ThemeForm;