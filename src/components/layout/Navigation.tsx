import React from 'react';
import { LayoutDashboard, Calculator, LogOut, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

interface NavigationProps {
  currentTab: 'dashboard' | 'accounting';
  onTabChange: (tab: 'dashboard' | 'accounting') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    const loadingToast = toast.loading('Keluar dari akun...');
    
    const { error } = await signOut();
    
    toast.dismiss(loadingToast);
    
    if (error) {
      toast.error('Gagal keluar dari akun');
    } else {
      toast.success('Berhasil keluar dari akun');
    }
  };

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-lg border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Wallet className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Fintrack Plus
              </span>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => onTabChange('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentTab === 'dashboard'
                    ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <LayoutDashboard size={20} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              
              <button
                onClick={() => onTabChange('accounting')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentTab === 'accounting'
                    ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <Calculator size={20} />
                <span className="hidden sm:inline">Accounting</span>
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;