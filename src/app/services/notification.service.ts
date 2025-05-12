import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string;
  message: string;
  icon?: string;
  time: Date;
  read: boolean;
  type: 'booking' | 'payment' | 'system';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    console.log('Fetching all notifications...');
    return this.http.get<Notification[]>(this.apiUrl).pipe(
      tap(notifications => {
        console.log('Received notifications:', notifications);
        this.notificationsSubject.next(notifications);
      }),
      catchError(error => {
        console.error('Error fetching notifications:', error);
        throw error;
      })
    );
  }

  getHostNotifications(hostId: string): Observable<Notification[]> {
    console.log('Fetching host notifications for hostId:', hostId);
    const url = `${this.apiUrl}/host/${hostId}`;
    console.log('Request URL:', url);
    
    return this.http.get<Notification[]>(url).pipe(
      tap(notifications => {
        console.log('Received host notifications:', notifications);
        this.notificationsSubject.next(notifications);
      }),
      catchError(error => {
        console.error('Error fetching host notifications:', error);
        throw error;
      })
    );
  }

  markAllAsRead(): Observable<void> {
    console.log('Marking all notifications as read');
    return this.http.post<void>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => {
        console.log('Successfully marked all notifications as read');
        // Update local notifications state
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n => ({ ...n, read: true }));
        this.notificationsSubject.next(updatedNotifications);
      }),
      catchError(error => {
        console.error('Error marking notifications as read:', error);
        throw error;
      })
    );
  }

  markAsRead(notificationId: string): Observable<void> {
    console.log('Marking notification as read:', notificationId);
    return this.http.post<void>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        console.log('Successfully marked notification as read');
        // Update local notifications state
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        this.notificationsSubject.next(updatedNotifications);
      }),
      catchError(error => {
        console.error('Error marking notification as read:', error);
        throw error;
      })
    );
  }
}
