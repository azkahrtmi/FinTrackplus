import React, { useState, useEffect } from 'react';
import { Plus, Wallet, Tag, Edit, Trash2, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, EWallet, Theme, Transaction } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import EWalletForm from './EWalletForm';
import ThemeForm from './ThemeForm';
import TransactionForm from './TransactionForm';
import ConfirmModal from '../modal/ConfirmModal';

const Accounting: React.FC = () => {
  const { user } = useAuth();
  const [eWallets, setEWallets] = useState<EWallet[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [showEWalletForm, setShowEWalletForm] = useState(false);
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInfo, setConfirmInfo] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedWallet) {
      fetchThemes();
      fetchTransactions();
    }
  }, [selectedWallet]);

  useEffect(() => {
    if (selectedTheme) {
      fetchTransactions();
    }
  }, [selectedTheme]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: walletData, error } = await supabase
        .from('e_wallets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEWallets(walletData || []);
      if (walletData && walletData.length > 0) {
        setSelectedWallet(walletData[0].id);
      }
    } catch (error: any) {
      toast.error(`Gagal memuat data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchThemes = async () => {
    if (!selectedWallet) return;
    
    try {
      const { data: themeData, error } = await supabase
        .from('themes')
        .select('*')
        .eq('e_wallet_id', selectedWallet)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setThemes(themeData || []);
    } catch (error: any) {
      toast.error(`Gagal memuat tema: ${error.message}`);
    }
  };

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedWallet) {
        query = query.eq('e_wallet_id', selectedWallet);
      }

      if (selectedTheme) {
        query = query.eq('theme_id', selectedTheme);
      }

      const { data: transactionData, error } = await query;
      
      if (error) throw error;
      setTransactions(transactionData || []);
    } catch (error: any) {
      toast.error(`Gagal memuat transaksi: ${error.message}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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

  const handleDeleteEWallet = async (id: string) => {
    const loadingToast = toast.loading('Menghapus e-wallet...');
    
    try {
      const { error } = await supabase
        .from('e_wallets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.dismiss(loadingToast);
      toast.success('E-wallet berhasil dihapus!');
      fetchData();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(`Gagal menghapus e-wallet: ${error.message}`);
    }
  };

  const handleDeleteTheme = async (id: string) => {
    const loadingToast = toast.loading('Menghapus tema...');
    
    try {
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.dismiss(loadingToast);
      toast.success('Tema berhasil dihapus!');
      fetchThemes();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(`Gagal menghapus tema: ${error.message}`);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const loadingToast = toast.loading('Menghapus transaksi...');
    
    try {
      // Ambil data transaksi yang akan dihapus
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Hapus transaksi
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Kembalikan saldo dan tema
      if (transaction.type === 'income') {
        await updateWalletBalance(transaction.e_wallet_id, transaction.amount, false);
      } else {
        await updateWalletBalance(transaction.e_wallet_id, transaction.amount, true);
        if (transaction.theme_id) {
          await updateThemeSpending(transaction.theme_id, transaction.amount, false);
        }
      }
      
      toast.dismiss(loadingToast);
      toast.success('Transaksi berhasil dihapus!');
      fetchTransactions();
      fetchData(); // Refresh wallet balances
      fetchThemes(); // Refresh theme spending
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(`Gagal menghapus transaksi: ${error.message}`);
    }
  };

  const confirmDelete = (type: string, name: string, deleteFunction: () => void) => {
    setConfirmInfo({
      title: `Hapus ${type}?`,
      description: `Apakah Anda yakin ingin menghapus ${type} "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: () => {
        deleteFunction();
        setShowConfirmModal(false);
      },
    });
    setShowConfirmModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Akuntansi
        </h1>
      </div>

      {/* E-Wallet Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
            E-Wallet
          </h2>
          <button
            onClick={() => setShowEWalletForm(true)}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Tambah E-Wallet</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eWallets.map(wallet => (
            <div key={wallet.id} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {wallet.name}
                  </h3>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setEditingItem(wallet);
                      setShowEWalletForm(true);
                    }}
                    className="text-blue-500 hover:text-blue-700 p-1"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => confirmDelete('e-wallet', wallet.name, () => handleDeleteEWallet(wallet.id))}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(wallet.balance)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pilih E-Wallet
            </label>
            <select
              value={selectedWallet}
              onChange={(e) => {
                setSelectedWallet(e.target.value);
                setSelectedTheme('');
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Pilih E-Wallet</option>
              {eWallets.map(wallet => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter Tema
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-700 dark:text-white"
              disabled={!selectedWallet}
            >
              <option value="">Semua Tema</option>
              {themes.map(theme => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedWallet && (
        <>
          {/* Theme Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
                Tema
              </h2>
              <button
                onClick={() => setShowThemeForm(true)}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
                <span>Tambah Tema</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map(theme => (
                <div key={theme.id} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {theme.name}
                      </h3>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setEditingItem(theme);
                          setShowThemeForm(true);
                        }}
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => confirmDelete('tema', theme.name, () => handleDeleteTheme(theme.id))}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Anggaran: {formatCurrency(theme.max_budget)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Terpakai: {formatCurrency(theme.current_spent)}
                    </p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      Sisa: {formatCurrency(theme.max_budget - theme.current_spent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
                Transaksi
              </h2>
              <button
                onClick={() => setShowTransactionForm(true)}
                className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
                <span>Tambah Transaksi</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-600">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      No
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Deskripsi
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Jenis
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Jumlah
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Tanggal
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id} className="border-b border-gray-100 dark:border-slate-700">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {transaction.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {new Date(transaction.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(transaction);
                              setShowTransactionForm(true);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => confirmDelete('transaksi', transaction.description, () => handleDeleteTransaction(transaction.id))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {transactions.length === 0 && (
                <div className="text-center py-8">
                  <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Belum ada transaksi
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showEWalletForm && (
        <EWalletForm
          isOpen={showEWalletForm}
          onClose={() => {
            setShowEWalletForm(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowEWalletForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
        />
      )}

      {showThemeForm && (
        <ThemeForm
          isOpen={showThemeForm}
          onClose={() => {
            setShowThemeForm(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            fetchThemes();
            setShowThemeForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          eWalletId={selectedWallet}
        />
      )}

      {showTransactionForm && (
        <TransactionForm
          isOpen={showTransactionForm}
          onClose={() => {
            setShowTransactionForm(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            fetchTransactions();
            fetchData();
            fetchThemes();
            setShowTransactionForm(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          eWalletId={selectedWallet}
          themes={themes}
        />
      )}

      {confirmInfo && (
        <ConfirmModal
          isOpen={showConfirmModal}
          title={confirmInfo.title}
          description={confirmInfo.description}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={confirmInfo.onConfirm}
        />
      )}
    </div>
  );
};

export default Accounting;