import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import UploadZone from '../components/documents/UploadZone';
import DocumentCard from '../components/documents/DocumentCard';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';
import AIAnalysisModal from '../components/documents/AIAnalysisModal';
import useDocumentStore from '../stores/documentStore';
import useAuthStore from '../stores/authStore';

const categories = [
  { id: 'all', label: 'Tümü' },
  { id: 'tahlil', label: 'Tahlil' },
  { id: 'mr', label: 'Görüntüleme' },
  { id: 'recete', label: 'Reçete' },
  { id: 'epikriz', label: 'Epikriz' },
  { id: 'diger', label: 'Diğer' },
];

function DocumentsPage() {
  const { user } = useAuthStore();
  const { documents, fetchDocuments, uploadDocument, deleteDocument, isLoading, uploading } = useDocumentStore();
  const [activeTab, setActiveTab] = useState('all');
  
  const [previewDoc, setPreviewDoc] = useState(null);
  const [analyzeDoc, setAnalyzeDoc] = useState(null);

  useEffect(() => {
    fetchDocuments(activeTab);
  }, [activeTab, fetchDocuments]);

  const handleUpload = async (file, category, notes) => {
    await uploadDocument(file, category, notes);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Tıbbi Belgelerim</h1>
            <p className="text-navy-400 text-sm mt-1">Tahlil, reçete ve raporlarınızı güvenle saklayın.</p>
          </div>
          
          {/* Limit Badge */}
          {!user?.is_premium && (
            <div className="glass border border-navy-700/50 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
              <div className="text-sm">
                <span className="text-navy-400">Ücretsiz Plan:</span>{' '}
                <span className="text-white font-medium">Aylık 3 belge</span>
              </div>
              <Link to="/billing" className="text-xs bg-teal-500 text-white px-2 py-1 rounded-md font-medium hover:bg-teal-600 transition-colors">
                Premium'a Geç
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sol Kolon: Yükleme Alanı */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <UploadZone onUpload={handleUpload} uploading={uploading} />
              
              {/* İpucu Kartı */}
              <div className="glass-card bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-pulse-glow" />
                <div className="relative z-10">
                  <h3 className="text-white font-semibold mb-2">Yapay Zeka Hazırlığı</h3>
                  <p className="text-navy-300 text-sm">
                    Yüklediğiniz karmaşık tahlil sonuçlarını yapay zekamız Türkçe ve anlaşılır bir dilde sizin için yorumlayacak.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Belge Listesi */}
          <div className="lg:col-span-8">
            <div className="glass-card rounded-2xl overflow-hidden min-h-[500px] flex flex-col relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none" />
              
              {/* Filtreleme */}
              <div className="flex overflow-x-auto border-b border-navy-700/50 hide-scrollbar p-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === cat.id 
                        ? 'bg-navy-700 text-teal-400' 
                        : 'text-navy-400 hover:text-white hover:bg-navy-700/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* İçerik */}
              <div className="p-6 flex-1 relative">
                {isLoading && (
                  <div className="absolute inset-0 z-10 bg-navy-800/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                  </div>
                )}

                {documents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-navy-700/50 rounded-full flex items-center justify-center mb-4 text-navy-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-navy-300">Bu kategoride henüz belge bulunmuyor.</p>
                    <p className="text-navy-500 text-sm mt-1">Sol taraftaki alanı kullanarak belge yükleyebilirsiniz.</p>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {documents.map(doc => (
                      <DocumentCard 
                        key={doc.id} 
                        document={doc} 
                        onDelete={deleteDocument} 
                        onPreview={setPreviewDoc}
                        onAnalyze={setAnalyzeDoc}
                      />
                    ))}
                  </motion.div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <DocumentPreviewModal 
        isOpen={!!previewDoc} 
        onClose={() => setPreviewDoc(null)} 
        document={previewDoc} 
      />

      <AIAnalysisModal
        isOpen={!!analyzeDoc}
        onClose={() => setAnalyzeDoc(null)}
        document={analyzeDoc}
      />

    </DashboardLayout>
  );
}

export default DocumentsPage;
