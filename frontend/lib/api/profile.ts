import api from '../api';
import type { BackendProfile } from '@/types/profile';

export async function fetchProfileById(userId: string): Promise<BackendProfile> {
  const res = await api.get<BackendProfile>(`/profile/${userId}`);
  return res.data;
}