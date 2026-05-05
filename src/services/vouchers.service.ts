import apiClient from '@/lib/apiClient';
import { type Voucher } from '@/types/api';

export async function getPublicVouchers(): Promise<Voucher[]> {
  const response = await apiClient.get<Voucher[]>('/vouchers/public');
  return response.data;
}
