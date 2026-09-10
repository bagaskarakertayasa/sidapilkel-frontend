import { useState, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { api } from '../api';

export default function useDeleteAction({
  endpoint,
  onSuccess,
  successMessage = 'Data berhasil dihapus',
  errorMessage = 'Gagal menghapus data',
}) {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestDelete = useCallback((item) => {
    setTargetItem(item);
    setModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!targetItem) return;
    setLoading(true);
    try {
      await api.del(`${endpoint}/${targetItem.id}`);
      toast.success(successMessage);
      setModalOpen(false);
      setTargetItem(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err?.data?.message || err.message || errorMessage);
    } finally {
      setLoading(false);
    }
  }, [targetItem, endpoint, successMessage, errorMessage, toast, onSuccess]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setTargetItem(null);
  }, []);

  return {
    modalOpen,
    targetItem,
    loading,
    requestDelete,
    confirmDelete,
    closeModal,
  };
}
