import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiFile, FiImage, FiX } from 'react-icons/fi';

const categories = [
  { id: 'tahlil', label: 'Kan/İdrar Tahlili' },
  { id: 'mr', label: 'MR/Röntgen/Tomografi' },
  { id: 'recete', label: 'Reçete' },
  { id: 'epikriz', label: 'Epikriz / Rapor' },
  { id: 'diger', label: 'Diğer' },
];

function UploadZone({ onUpload, uploading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState('tahlil');
  const [notes, setNotes] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await onUpload(selectedFile, category, notes);
      setSelectedFile(null);
      setNotes('');
    } catch (err) {
      // Error handled in store
    }
  };

  const getFileIcon = (type) => {
    return type.includes('pdf') ? <FiFile size={24} className="text-red-400" /> : <FiImage size={24} className="text-blue-400" />;
  };

  return (
    <div className="bg-navy-800/60 border border-navy-700/50 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Yeni Belge Yükle</h3>
      
      {!selectedFile ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            isDragReject ? 'border-red-500 bg-red-500/10' :
            isDragActive ? 'border-teal-500 bg-teal-500/10' : 'border-navy-600 hover:border-teal-500 hover:bg-navy-700/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 bg-navy-900 rounded-full flex items-center justify-center mb-4 text-teal-400">
            <FiUploadCloud size={28} />
          </div>
          <p className="text-white font-medium mb-1">Dosyayı buraya sürükle veya seç</p>
          <p className="text-navy-400 text-sm">PDF, JPG, PNG (Maks 5MB)</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Seçilen dosya önizlemesi */}
          <div className="bg-navy-900/50 border border-navy-600 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-navy-800 rounded-lg flex items-center justify-center">
                {getFileIcon(selectedFile.type)}
              </div>
              <div className="overflow-hidden">
                <p className="text-white font-medium text-sm truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
                <p className="text-navy-400 text-xs">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedFile(null)} 
              className="text-navy-400 hover:text-red-400 p-2"
              disabled={uploading}
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Form Alanları */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-navy-300 text-sm mb-1.5">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={uploading}
                className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-navy-300 text-sm mb-1.5">Notlar (Opsiyonel)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={uploading}
                placeholder="Örn: Dr. Ahmet'in istediği tahlil"
                className="w-full bg-navy-900/50 border border-navy-600/50 rounded-xl px-4 py-2.5 text-white text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors flex justify-center items-center gap-2"
          >
            {uploading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Yükleniyor...</>
            ) : (
              <><FiUploadCloud /> Yüklemeyi Tamamla</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default UploadZone;
