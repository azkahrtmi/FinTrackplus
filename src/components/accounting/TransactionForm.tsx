import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, Transaction, Theme } from '../../lib/supabase';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem?: Transaction | null;
  eWalletId: string;
  themes: Theme[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingItem,
  eWalletId,
  themes
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [themeId, setThemeId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setDescription(editingItem.description);
      setAmount(editingItem.amount.toString());
      setType(editingItem.type);
      setThemeId(editingItem.theme_id || '');
    } else {
      setDescription('');
      setAmount('');
      setType('expense');
      setThemeId('');
    }
  }, [editingItem]);

  const updateWalletBalance = async (walletId: string, amount: number, isIncome: boolean) => {
    const { data: wallet, error: fetchError } = await supabase
      .from('e_wallets')
      .select('balance')
      .eq('id', walletId)
      .single();

    if (fetchError) throw fetchError;

    const newBalance = isIncome 
      ? wallet.balance + amount 
      : wallet.balance - amount;

    const { error: updateError } = await supabase
      .from('e_wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', walletId);

    if (updateError) throw updateError;
  };

  const updateThemeSpending = async (themeId: string, amount: number, isAdd: boolean) => {
    const { data: theme, error: fetchError } = await supabase
      .from('themes')
      .select('current_spent')
      .eq('id', themeId)
      .single();

    if (fetchError) throw fetchError;

    const newSpent = isAdd 
      ? theme.current_spent + amount 
      : theme.current_spent - amount;

    const { error: updateError } = await supabase
      .from('themes')
      .update({ current_spent: Math.max(0, newSpent), updated_at: new Date().toISOString() })
      .eq('id', themeId);

    if (updateError) throw updateError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const loadingToast = toast.loading(
      editingItem ? 'Memperbarui transaksi...' : 'Membuat transaksi...'
    );

    try {
      const transactionAmount = parseFloat(amount) || 0;
      
      const transactionData = {
        description,
        amount: transactionAmount,
        type,
        theme_id: type === 'expense' ? themeId : null,
        e_wallet_id: eWalletId,
        updated_at: new Date().toISOString(),
      };

      if (editingItem) {
        // Kembalikan nilai lama terlebih dahulu
        if (editingItem.type === 'income') {
          await updateWalletBalance(eWalletId, editingItem.amount, false);
        } else {
          await updateWalletBalance(eWalletId, editingItem.amount, true);
          if (editingItem.theme_id) {
            await updateThemeSpending(editingItem.theme_id, editingItem.amount, false);
          }
        }

        // Update transaksi
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', editingItem.id);

        if (error) throw error;

        // Terapkan nilai baru
        if (type === 'income') {
          await updateWalletBalance(eWalletId, transactionAmount, true);
        } else {
          await updateWalletBalance(eWalletId, transactionAmount, false);
          if (themeId) {
            await updateThemeSpending(themeId, transactionAmount, true);
          }
        }
        
        toast.dismiss(loadingToast);
        toast.success('Transaksi berhasil diperbarui!');
      } else {
        // Buat transaksi baru
        const { error } = await supabase
          .from('transactions')
          .insert([{
            ...transactionData,
            created_at: new Date().toISOString(),
          }]);

        if (error) throw error;

        // Update saldo dan tema
        if (type === 'income') {
          await updateWalletBalance(eWalletId, transactionAmount, true);
        } else {
          await updateWalletBalance(eWalletId, transactionAmount, false);
          if (themeId) {
            await updateThemeSpending(themeId, transactionAmount, true);
          }
        }
        
        toast.dismiss(loadingToast);
        toast.success('Transaksi berhasil dibuat!');
      }

      onSuccess();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(`Gagal ${editingItem ? 'memperbarui' : 'membuat'} transaksi: ${error.message}`);
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
            {editingItem ? 'Edit Transaksi' : 'Tambah Transaksi'}
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
                Deskripsi
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white"
                placeholder="Masukkan deskripsi transaksi"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Jumlah
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white"
                placeholder="0"
                min="0"
                step="any"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Jenis
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as 'income' | 'expense');
                  if (e.target.value === 'income') {
                    setThemeId('');
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </div>

            {type === 'expense' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tema
                </label>
                <select
                  value={themeId}
                  onChange={(e) => setThemeId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white"
                  required
                >
                  <option value="">Pilih Tema</option>
                  {themes.map(theme => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;