import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload } from 'react-icons/fi';

function DocumentPreviewModal({ isOpen, onClose, document }) {
  if (!document) return null;

  const isPdf = document.file_type === 'application/pdf';
  // Use the API URL from environment, or fallback. Then append the static files path.
  // We mounted StaticFiles on /uploads, which is mapped directly on the FastAPI app.
  // Wait, the API base url is typically http://localhost:8000/api/v1. The /uploads is at the root.
  const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:8000';
  const fileUrl = `${backendUrl}/${document.file_path.replace(/\\/g, '/')}`;

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
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-navy-800 bg-navy-900/50">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-lg font-semibold text-white truncate">{document.original_filename}</h3>
                  <p className="text-navy-400 text-xs">{(document.file_size / (1024 * 1024)).toFixed(2)} MB • {document.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={fileUrl} 
                    download={document.original_filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiDownload size={16} /> İndir
                  </a>
                  <button
                    onClick={onClose}
                    className="text-navy-400 hover:text-white transition-colors p-2 bg-navy-800 rounded-lg"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-auto p-4 bg-black/20 flex items-center justify-center relative min-h-[300px]">
                {isPdf ? (
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
