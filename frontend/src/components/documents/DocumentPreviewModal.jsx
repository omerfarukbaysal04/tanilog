import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiRefreshCw, FiX } from 'react-icons/fi';
import api from '../../lib/api';

function DocumentPreviewModal({ isOpen, onClose, document }) {
  const [fileUrl, setFileUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isPdf = document?.file_type === 'application/pdf';

  useEffect(() => {
    if (!isOpen || !document) return undefined;

    let objectUrl = null;
    let isCancelled = false;

    const loadFile = async () => {
      setIsLoading(true);
      setError(null);
      setFileUrl(null);

      try {
        const response = await api.get(`/documents/${document.id}/file`, {
          responseType: 'blob',
        });

        if (isCancelled) return;
        objectUrl = URL.createObjectURL(response.data);
        setFileUrl(objectUrl);
      } catch {
        if (!isCancelled) setError('Belge açılırken bir hata oluştu.');
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadFile();

    return () => {
      isCancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, document]);

  const handleDownload = () => {
    if (!fileUrl || !document) return;

    const link = window.document.createElement('a');
    link.href = fileUrl;
    link.download = document.original_filename;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!document) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-4xl pointer-events-auto overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-navy-800 bg-navy-900/50">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-lg font-semibold text-white truncate">{document.original_filename}</h3>
                  <p className="text-navy-400 text-xs">
                    {(document.file_size / (1024 * 1024)).toFixed(2)} MB - {document.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!fileUrl}
                    className="flex items-center gap-2 bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white disabled:opacity-50 disabled:hover:bg-teal-500/10 disabled:hover:text-teal-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiDownload size={16} /> İndir
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-navy-400 hover:text-white transition-colors p-2 bg-navy-800 rounded-lg"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-black/20 flex items-center justify-center relative min-h-[300px]">
                {isLoading && (
                  <div className="flex items-center gap-2 text-navy-300">
                    <FiRefreshCw className="animate-spin" /> Belge yükleniyor...
                  </div>
                )}

                {!isLoading && error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                )}

                {!isLoading && !error && fileUrl && (
                  isPdf ? (
                    <iframe
                      src={`${fileUrl}#toolbar=0`}
                      className="w-full h-[60vh] rounded-xl border border-navy-700"
                      title={document.original_filename}
                    />
                  ) : (
                    <img
                      src={fileUrl}
                      alt={document.original_filename}
                      className="max-w-full max-h-[70vh] rounded-xl object-contain border border-navy-700"
                    />
                  )
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default DocumentPreviewModal;
