import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Message, User } from '../models/messges';
import { environment } from '../../environments/environment';
import Pusher from 'pusher-js';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;
  private pusher: Pusher;
  private channel: any;
  private messageSubject = new Subject<Message>();

  constructor(private http: HttpClient) {
    // Initialize Pusher
    this.pusher = new Pusher(environment.pusher.key, {
      cluster: environment.pusher.cluster,
      authEndpoint: `${environment.apiUrl}/chat/pusher/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      },
    });
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // Subscribe to a chat channel
  subscribeToChat(userId: string): Observable<Message> {
    // Subscribe to the user's channel
    this.channel = this.pusher.subscribe(`private-chat-${userId}`);

    this.channel.bind('new-message', (data: Message) => {
      this.messageSubject.next(data);
    });

    this.channel.bind('message-update', (data: Message) => {
      this.messageSubject.next(data);
    });

    return this.messageSubject.asObservable();
  }

  // Unsubscribe from chat
  unsubscribeFromChat() {
    if (this.channel) {
      this.pusher.unsubscribe(`private-chat-${this.channel.name}`);
    }
  }

  // Basic Message Operations
  sendMessage(message: {
    receiverId: string;
    content: string;
  }): Observable<Message> {
    return this.http.post<Message>(
      `${environment.apiUrl}/chat/messages`,
      message,
      {
        headers: this.getHeaders(),
      }
    );
  }

  getConversation(userId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/chat/conversations/${userId}`, {
      headers: this.getHeaders(),
    });
  }

  getAllConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/conversations`, {
      headers: this.getHeaders(),
    });
  }

  // Message Management
  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/messages/${messageId}`, {
      headers: this.getHeaders(),
    });
  }

  editMessage(messageId: string, content: string): Observable<Message> {
    return this.http.patch<Message>(
      `${this.apiUrl}/messages/${messageId}`,
      { content },
      { headers: this.getHeaders() }
    );
  }

  markAsDelivered(messageId: string): Observable<Message> {
    return this.http.patch<Message>(
      `${this.apiUrl}/messages/${messageId}/deliver`,
      {},
      { headers: this.getHeaders() }
    );
  }

  markAsRead(messageId: string): Observable<Message> {
    return this.http.patch<Message>(
      `${this.apiUrl}/messages/${messageId}/read`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/messages/unread/count`, {
      headers: this.getHeaders(),
    });
  }

  // Advanced Features
  sendAttachment(formData: FormData): Observable<Message> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<Message>(
      `${this.apiUrl}/messages/attachment`,
      formData,
      { headers }
    );
  }

  addReaction(
    messageId: string,
    userId: string,
    reaction: string
  ): Observable<Message> {
    return this.http.post<Message>(
      `${this.apiUrl}/messages/${messageId}/reactions`,
      { userId, reaction },
      { headers: this.getHeaders() }
    );
  }

  setTypingStatus(userId: string, isTyping: boolean): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/conversations/${userId}/typing`,
      { isTyping },
      { headers: this.getHeaders() }
    );
  }

  searchMessages(query: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages/search`, {
      params: { query },
      headers: this.getHeaders(),
    });
  }

  // Group Chat Management
  createGroup(groupData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/groups`, groupData, {
      headers: this.getHeaders(),
    });
  }

  addToGroup(groupId: string, userId: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/groups/${groupId}/members`,
      { userId },
      { headers: this.getHeaders() }
    );
  }

  removeFromGroup(groupId: string, userId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/groups/${groupId}/members/${userId}`,
      { headers: this.getHeaders() }
    );
  }

  // User Status Management
  updateUserStatus(status: string): Observable<User> {
    return this.http.patch<User>(
      `${this.apiUrl}/users/status`,
      { status },
      { headers: this.getHeaders() }
    );
  }

  getOnlineUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/online`, {
      headers: this.getHeaders(),
    });
  }
}
