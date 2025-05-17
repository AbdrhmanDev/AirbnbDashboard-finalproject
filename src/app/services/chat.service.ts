import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Message, User } from '../models/messges';
import { environment } from '../../environments/environment';
import Pusher from 'pusher-js';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/messages`;
  private pusher: Pusher;
  private channel: any;
  private messageSubject = new Subject<Message>();

  constructor(private http: HttpClient) {
    // Initialize Pusher
    this.pusher = new Pusher(environment.pusher.key, {
      cluster: environment.pusher.cluster,
    });
  }

  // Subscribe to a chat channel
  subscribeToChat(userId: string): Observable<Message> {
    // Subscribe to the user's channel
    this.channel = this.pusher.subscribe(`private-chat-${userId}`);

    // Listen for new messages
    this.channel.bind('new-message', (data: Message) => {
      this.messageSubject.next(data);
    });

    // Listen for message updates (read, delivered status)
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

  // Send a new message
  sendMessage(message: Message): Observable<Message> {
    return this.http.post<Message>(this.apiUrl, message);
  }

  // Get messages between two users
  getMessages(senderId: string, receiverId: string): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.apiUrl}/conversation/${senderId}/${receiverId}`
    );
  }

  // Get all messages for a user
  getUserMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/user/${userId}`);
  }

  // Mark message as read
  markAsRead(messageId: string): Observable<Message> {
    return this.http.patch<Message>(`${this.apiUrl}/${messageId}/read`, {});
  }

  // Mark message as delivered
  markAsDelivered(messageId: string): Observable<Message> {
    return this.http.patch<Message>(
      `${this.apiUrl}/${messageId}/delivered`,
      {}
    );
  }

  // Edit a message
  editMessage(messageId: string, content: string): Observable<Message> {
    return this.http.patch<Message>(`${this.apiUrl}/${messageId}`, { content });
  }

  // Delete a message
  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${messageId}`);
  }

  // Add reaction to a message
  addReaction(
    messageId: string,
    userId: string,
    reaction: string
  ): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/${messageId}/reactions`, {
      userId,
      reaction,
    });
  }

  // Get group messages
  getGroupMessages(groupId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/group/${groupId}`);
  }

  // Send group message
  sendGroupMessage(message: Message): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/group`, message);
  }
}
