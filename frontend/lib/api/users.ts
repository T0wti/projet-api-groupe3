import api from '../api';
import type { BackendUser } from '@/types/user';

export async function fetchUserById(id: string): Promise<BackendUser> {
  const res = await api.get<BackendUser>(`/users/${id}`);
  return res.data;
}
