import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Notification } from '@/shared/types/api';

/**
 * Hook kết nối WebSocket cho Notifications.
 * Gắn hook này ở root (ví dụ App.tsx hoặc header có cái chuông) để lắng nghe sự kiện.
 */
export function useSocketNotifications(userId?: string | number) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    // Chỉ kết nối khi user đã login (có userId)
    if (!userId) return;

    // TODO: Thay URL này bằng biến môi trường (ví dụ process.env.NEXT_PUBLIC_API_URL)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const socketInstance = io(`${API_URL}/notifications`, {
      query: { userId: userId.toString() },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('🔗 Đã kết nối Socket tới Notifications server!');
    });

    // Lắng nghe sự kiện 'new_notification' từ server
    socketInstance.on('new_notification', (data: Notification) => {
      console.log('🔔 Có thông báo mới:', data);
      
      // Update state ngay lập tức (Nếu component UI dùng state này)
      setNotifications((prev) => [data, ...prev]);
      
      // Tăng số đếm chưa đọc lên 1
      setUnreadCount((prev) => prev + 1);
      
      // TIP: Bạn có thể gọi thêm Toast hiện pop-up ở đây
      // toast.success(`Thông báo mới: ${data.title}`);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  return { socket, notifications, unreadCount, setUnreadCount };
}
