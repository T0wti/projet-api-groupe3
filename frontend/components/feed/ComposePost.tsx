"use client"; // Required because we use React state and event listeners

import { useState, useRef, useEffect } from 'react'; // 1. Ajout de useEffect
import { Image as ImageIcon, X } from 'lucide-react'; // 2. Ajout de l'icône X pour supprimer l'image
import { useTranslation } from 'react-i18next';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { uploadMedia, deleteMedia, ALLOWED_AVATAR_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@/lib/api/media';

interface ComposePostProps {
  onPost: (content: string, image: File | null) => Promise<void>;
  isPosting?: boolean;
}

export default function ComposePost({ onPost, isPosting = false }: ComposePostProps) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // 3. State pour stocker l'URL temporaire de l'aperçu
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4. Générer ou nettoyer l'URL de preview quand le fichier change
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    // Crée l'URL locale
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Nettoyage de la mémoire quand le composant se démonte ou change de fichier
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  // 5. Fonction pour retirer l'image sélectionnée
  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset l'input pour pouvoir ré-uploader la même image au besoin
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // On permet de poster si le texte n'est pas vide OU si une image est présente
    if ((content.trim().length === 0 && !selectedFile) || isPosting) return;
    
    await onPost(content, selectedFile);
    setContent('');
    setSelectedFile(null);
  };

  return (
    <div className="border-b border-gray-200 p-4 px-12">
      <div className="flex gap-3">
        <Avatar
          src={user?.avatarUrl}
          alt="My Avatar"
          size="md"
        />
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('compose_post.placeholder')}
            className="w-full bg-transparent text-xl outline-none resize-none min-h-15 placeholder-gray-500"
            maxLength={280}
          />

          {/* 6. Zone d'aperçu de l'image (s'affiche uniquement si previewUrl existe) */}
          {previewUrl && (
            <div className="relative my-3 max-h-80 w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover max-h-80"
              />
              {/* Bouton de suppression en haut à droite de l'image */}
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black/80 text-white transition-colors backdrop-blur-sm"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-2">
            <div
              className="text-brand cursor-pointer hover:opacity-80 p-1 rounded-full hover:bg-brand/10 transition-colors"
              onClick={handleIconClick}>
              <ImageIcon size={20} />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp, image/gif"
                className="hidden"
              />
            </div>
            <Button
              type="submit"
              // Modifié : Le bouton s'active si texte OU image présente
              disabled={(content.trim().length === 0 && !selectedFile) || isPosting}
              className="bg-brand hover:bg-brand-hover text-white font-bold py-1.5 px-4 rounded-full disabled:opacity-50"
            >
              {isPosting ? '...' : t('compose_post.submit_button')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}