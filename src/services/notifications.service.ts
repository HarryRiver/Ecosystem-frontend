/**
 * src/services/notifications.service.ts
 * ─────────────────────────────────────────────────────────────
 * API thông báo dành cho khách hàng.
 * Ref: API_Specs.md – Mục III.5 (Customer – Notifications)
 * ─────────────────────────────────────────────────────────────
 */

import apiClient from '@/lib/apiClient';
import { type Notification, type UnreadCount } from '@/types/api';

// ─── GET /me/notifications ────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  const response = await apiClient.get<Notification[]>('/me/notifications');
  return response.data;
}

// ─── GET /me/notifications/unread-count ──────────────────────────────────────

export async function getUnreadCount(): Promise<UnreadCount> {
  const response = await apiClient.get<UnreadCount>(
    '/me/notifications/unread-count',
  );
  return response.data;
}

// ─── PATCH /me/notifications/:id/read ────────────────────────────────────────

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/me/notifications/${id}/read`);
}

// ─── POST /me/notifications/read-all ─────────────────────────────────────────

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/me/notifications/read-all');
}
