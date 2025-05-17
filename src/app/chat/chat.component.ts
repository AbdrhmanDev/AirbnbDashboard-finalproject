import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ChatService } from '../services/chat.service';
import { Message, User } from '../models/messges';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';

interface Conversation {
  _id: {
    _id: string;
    email: string;
    name: string;
    avatar: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  isChatOpen = false;
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  currentUserId = localStorage.getItem('userId') || '';
  newMessageContent = '';
  isTyping = false;
  unreadCount = 0;
  onlineUsers: User[] = [];
  private chatSubscription?: Subscription;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.loadConversations();
    this.loadUnreadCount();
    this.loadOnlineUsers();
    this.subscribeToChat();
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.loadConversations();
    }
  }

  loadConversations() {
    this.chatService.getAllConversations().subscribe({
      next: (response: any) => {
        if (response.status === 'success' && Array.isArray(response.data)) {
          this.conversations = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
      },
    });
  }

  loadUnreadCount() {
    this.chatService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      },
    });
  }

  loadOnlineUsers() {
    this.chatService.getOnlineUsers().subscribe({
      next: (users) => {
        this.onlineUsers = users;
      },
      error: (error) => {
        console.error('Error loading online users:', error);
      },
    });
  }

  subscribeToChat() {
    if (this.currentUserId) {
      this.chatSubscription = this.chatService
        .subscribeToChat(this.currentUserId)
        .subscribe({
          next: (message) => {
            this.handleNewMessage(message);
          },
          error: (error) => {
            console.error('Error in chat subscription:', error);
          },
        });
    }
  }

  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
    if (conversation._id._id) {
      this.chatService.getConversation(conversation._id._id).subscribe({
        next: (response: any) => {
          if (response.status === 'success' && Array.isArray(response.data)) {
            this.messages = response.data;
            // Mark messages as read if they are received messages
            this.messages.forEach((message) => {
              if (
                typeof message.receiver === 'object' &&
                message.receiver._id === this.currentUserId &&
                !message.read &&
                message._id
              ) {
                this.chatService.markAsRead(message._id).subscribe();
              }
            });
            this.scrollToBottom();
          }
        },
        error: (error) => {
          console.error('Error loading conversation:', error);
        },
      });
    }
  }

  handleNewMessage(message: Message) {
    if (
      this.selectedConversation &&
      ((message.sender as User)._id === this.selectedConversation._id._id ||
        (message.receiver as User)._id === this.selectedConversation._id._id)
    ) {
      this.messages.push(message);
      this.scrollToBottom();
    }

    if ((message.sender as User)._id !== this.currentUserId && message._id) {
      this.chatService.markAsDelivered(message._id).subscribe();
      if (
        this.selectedConversation &&
        (message.sender as User)._id === this.selectedConversation._id._id
      ) {
        this.chatService.markAsRead(message._id).subscribe();
      }
    }

    this.loadConversations();
  }

  sendMessage() {
    if (!this.newMessageContent.trim() || !this.selectedConversation) return;

    const message = {
      receiverId: this.selectedConversation._id._id,
      content: this.newMessageContent,
    };

    this.chatService.sendMessage(message).subscribe({
      next: (response) => {
        this.messages.push(response);
        this.newMessageContent = '';
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error sending message:', error);
      },
    });
  }

  sendAttachment(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.selectedConversation) return;

    const formData = new FormData();
    formData.append('file', input.files[0]);
    formData.append('receiverId', this.selectedConversation._id._id);

    this.chatService.sendAttachment(formData).subscribe({
      next: (response) => {
        this.messages.push(response);
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error sending attachment:', error);
      },
    });
  }

  setTypingStatus(isTyping: boolean) {
    if (this.selectedConversation) {
      this.chatService
        .setTypingStatus(this.selectedConversation._id._id, isTyping)
        .subscribe();
    }
  }

  editMessage(messageId: string, content: string) {
    this.chatService.editMessage(messageId, content).subscribe({
      next: (updatedMessage) => {
        const index = this.messages.findIndex((m) => m._id === messageId);
        if (index !== -1) {
          this.messages[index] = updatedMessage;
        }
      },
      error: (error) => {
        console.error('Error editing message:', error);
      },
    });
  }

  deleteMessage(messageId: string) {
    this.chatService.deleteMessage(messageId).subscribe({
      next: () => {
        this.messages = this.messages.filter((m) => m._id !== messageId);
      },
      error: (error) => {
        console.error('Error deleting message:', error);
      },
    });
  }

  addReaction(messageId: string, reaction: string) {
    this.chatService
      .addReaction(messageId, this.currentUserId, reaction)
      .subscribe({
        next: (updatedMessage) => {
          const index = this.messages.findIndex((m) => m._id === messageId);
          if (index !== -1) {
            this.messages[index] = updatedMessage;
          }
        },
        error: (error) => {
          console.error('Error adding reaction:', error);
        },
      });
  }

  updateUserStatus(status: string) {
    this.chatService.updateUserStatus(status).subscribe({
      error: (error) => {
        console.error('Error updating user status:', error);
      },
    });
  }

  ngOnDestroy() {
    this.chatSubscription?.unsubscribe();
    this.chatService.unsubscribeFromChat();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }
    });
  }

  // Helper methods for type checking
  isSender(message: Message): boolean {
    if (typeof message.sender === 'string') {
      return message.sender === this.currentUserId;
    }
    return message.sender._id === this.currentUserId;
  }

  isReceiver(message: Message): boolean {
    if (typeof message.receiver === 'string') {
      return message.receiver === this.currentUserId;
    }
    return message.receiver._id === this.currentUserId;
  }
}
