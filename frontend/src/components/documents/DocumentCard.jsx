import { FiFileText, FiImage, FiDownload, FiTrash2, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

function DocumentCard({ document, onDelete, onPreview, onAnalyze }) {
  const isPdf = document.file_type === 'application/pdf';

  return (
    <div className="bg-navy-900/40 border border-navy-700/50 rounded-xl p-4 group hover:border-teal-500/50 transition-all hover:shadow-lg hover:shadow-teal-500/5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPdf ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
          {isPdf ? <FiFileText size={20} /> : <FiImage size={20} />}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onAnalyze(document)}
            className="h-8 px-2 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 hover:bg-teal-500 hover:text-white transition-colors text-xs font-medium"
            title="AI ile Analiz Et"
          >
            ✨ AI Analiz
          </button>
          <button 
            onClick={() => onPreview(document)}
            className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center text-teal-400 hover:bg-teal-500 hover:text-white transition-colors"
            title="Önizle / İndir"
          >
            <FiEye size={16} />
          </button>
          <button 
            onClick={() => onDelete(document.id)}
            className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-colors"
            title="Sil"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
      
      <h4 className="text-white font-medium text-sm mb-1 truncate" title={document.original_filename}>
        {document.original_filename}
      </h4>
      
      <div className="flex flex-wrap items-center gap-2 text-xs text-navy-400">
        <span className="bg-navy-800 px-2 py-0.5 rounded-md capitalize">
          {document.category}
        </span>
        <span>•</span>
        <span>{(document.file_size / (1024 * 1024)).toFixed(2)} MB</span>
      </div>
      
      {document.notes && (
        <p className="text-navy-400 text-xs mt-3 line-clamp-2 leading-relaxed border-t border-navy-800 pt-2">
          {document.notes}
        </p>
      )}
      
      <p className="text-navy-500 text-[10px] mt-3">
        {format(new Date(document.created_at), 'd MMM yyyy, HH:mm', { locale: tr })}
      </p>
    </div>
  );
}

export default DocumentCard;
