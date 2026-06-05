import apiClient from '@/shared/lib/apiClient';
import { type Voucher } from '@/shared/types/api';

export async function getPublicVouchers(): Promise<Voucher[]> {
  const response = await apiClient.get<Voucher[]>('/vouchers/public');
  return response.data;
}
