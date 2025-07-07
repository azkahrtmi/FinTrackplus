import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, EWallet } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface EWalletFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem?: EWallet | null;
}

const EWalletForm: React.FC<EWalletFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingItem
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setBalance(editingItem.balance.toString());
    } else {
      setName('');
      setBalance('0');
    }
  }, [editingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const loadingToast = toast.loading(
      editingItem ? 'Mengupdate e-wallet...' : 'Membuat e-wallet...'
    );

    try {
      const walletData = {
        name,
        balance: parseFloat(balance) || 0,
        user_id: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingItem) {
        const { error } = await supabase
          .from('e_wallets')
          .update(walletData)
          .eq('id', editingItem.id);

        if (error) throw error;
        
        toast.dismiss(loadingToast);
        toast.success('E-wallet berhasil diperbarui!');
      } else {
        const { error } = await supabase
          .from('e_wallets')
          .insert([{
            ...walletData,
            created_at: new Date().toISOString(),
          }]);

        if (error) throw error;
        
        toast.dismiss(loadingToast);
        toast.success('E-wallet berhasil dibuat!');
      }

      onSuccess();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(`Gagal ${editingItem ? 'memperbarui' : 'membuat'} e-wallet: ${error.message}`);
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
            {editingItem ? 'Edit E-Wallet' : 'Tambah E-Wallet'}
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
                Nama E-Wallet
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white"
                placeholder="Masukkan nama e-wallet"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Saldo Awal
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white"
                placeholder="0"
                min="0"
                step="any"
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
              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EWalletForm;