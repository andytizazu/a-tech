import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { motion } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Truck, 
  Package, 
  Search,
  ExternalLink,
  ChevronRight,
  Globe
} from 'lucide-react';

const SuppliersView = ({ user }: { user: UserProfile }) => {
  const [suppliers, setSuppliers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Only approved importers
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'importer'),
      where('verificationStatus', '==', 'approved')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      setLoading(false);
    });

    return unsub;
  }, []);

  const filteredSuppliers = suppliers.filter(s => 
    (s.importerName || s.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.country || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Authorized Suppliers</h1>
          <p className="text-slate-500 dark:text-slate-400">Direct directory of verified B2B importers in the A-Tech network.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, country or city..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Building2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Suppliers Found</h3>
          <p className="text-slate-500 dark:text-slate-400">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <motion.div 
              layout
              key={supplier.uid}
              className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 hover:shadow-2xl hover:shadow-blue-100 dark:hover:shadow-none transition-all duration-500 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm group-hover:scale-110 transition-transform">
                  {(supplier.importerName || supplier.displayName || '?').charAt(0)}
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider">
                  Verified
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                    {supplier.importerName || supplier.displayName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <MapPin size={12} className="text-slate-400" />
                    {supplier.city && `${supplier.city}, `}{supplier.country}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Pricing Logic</p>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Truck size={12} className="text-blue-500" />
                      {supplier.deliverySettings?.isFreeDelivery ? 'Always Free' : 'Distance Based'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Stock status</p>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Package size={12} className="text-blue-500" />
                      In Network
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <Globe size={12} />
                  Shipments to {user.country || 'all regions'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuppliersView;
