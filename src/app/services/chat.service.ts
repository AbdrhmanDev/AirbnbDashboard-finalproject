import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Message, User } from '../models/messges';
import { environment } from '../../environments/environment';
import Pusher from 'pusher-js';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;
  private pusher: Pusher;
  private channels: Map<string, any> = new Map();
  private messageSubject = new BehaviorSubject<Message | null>(null);
  private conversationSubject = new BehaviorSubject<any>(null);
  private currentConversationId: string | null = null;

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

  private subscribeToChannel(channelName: string) {
    if (!this.channels.has(channelName)) {
      const channel = this.pusher.subscribe(channelName);

      channel.bind('new-message', (data: Message) => {
        console.log(`New message received in ${channelName}:`, data);

        // إرسال الرسالة إلى messageSubject
        this.messageSubject.next(data);

        // إذا كانت الرسالة تخص المحادثة الحالية، قم بتحديثها
        if (this.currentConversationId) {
          const conversationUserId = channelName.replace('private-chat-', '');
          if (
            (typeof data.sender === 'object' &&
              data.sender._id === conversationUserId) ||
            (typeof data.receiver === 'object' &&
              data.receiver._id === conversationUserId)
          ) {
            console.log(
              'Updating current conversation with new message:',
              data
            );
            this.conversationSubject.next({
              type: 'message',
              data: data,
            });
          }
        }
      });

      channel.bind('message-update', (data: Message) => {
        console.log(`Message update received in ${channelName}:`, data);
        this.messageSubject.next(data);

        // تحديث الرسالة في المحادثة الحالية إذا كانت موجودة
        if (this.currentConversationId) {
          const conversationUserId = channelName.replace('private-chat-', '');
          if (
            (typeof data.sender === 'object' &&
              data.sender._id === conversationUserId) ||
            (typeof data.receiver === 'object' &&
              data.receiver._id === conversationUserId)
          ) {
            this.conversationSubject.next({
              type: 'update',
              data: data,
            });
          }
        }
      });

      channel.bind('pusher:error', (error: any) => {
        console.error(`Pusher error in ${channelName}:`, error);
      });

      this.channels.set(channelName, channel);
    }
    return this.channels.get(channelName);
  }

  // Subscribe to chat messages
  subscribeToChat(userId: string): Observable<Message> {
    const channelName = `private-chat-${userId}`;
    this.subscribeToChannel(channelName);
    return this.messageSubject
      .asObservable()
      .pipe(filter((message): message is Message => message !== null));
  }

  // Get conversation messages
  getConversation(userId: string): Observable<any> {
    this.currentConversationId = userId;
    const channelName = `private-chat-${userId}`;
    this.subscribeToChannel(channelName);

    // Initial fetch of conversation
    this.http
      .get(`${environment.apiUrl}/chat/conversations/${userId}`, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response: any) => {
          console.log('Initial conversation response:', response);
          if (response.status === 'success' && Array.isArray(response.data)) {
            this.conversationSubject.next({
              type: 'initial',
              data: response.data,
            });
          } else {
            console.error('Invalid conversation data format:', response);
          }
        },
        error: (error) => {
          console.error('Error fetching conversation:', error);
          this.conversationSubject.next({
            type: 'error',
            error: error,
          });
        },
      });

    return this.conversationSubject.asObservable();
  }

  // Send message
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

  // Get all conversations
  getAllConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/conversations`, {
      headers: this.getHeaders(),
    });
  }

  // Mark message as read
  markAsRead(messageId: string): Observable<Message> {
    return this.http.patch<Message>(
      `${this.apiUrl}/messages/${messageId}/read`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Get unread count
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/messages/unread/count`, {
      headers: this.getHeaders(),
    });
  }

  // Unsubscribe from chat
  unsubscribeFromChat() {
    this.channels.forEach((channel, channelName) => {
      this.pusher.unsubscribe(channelName);
    });
    this.channels.clear();
    this.currentConversationId = null;
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

  // Add method to check if channel is subscribed
  isChannelSubscribed(): boolean {
    return this.channels.size > 0;
  }

  // Add method to resubscribe if needed
  resubscribeToChannel(userId: string) {
    this.unsubscribeFromChat();
    this.subscribeToChannel(`private-chat-${userId}`);
  }
}
