import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
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
  private conversationSubscription?: Subscription;

  constructor(
    private chatService: ChatService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadConversations();
    this.loadUnreadCount();
    this.loadOnlineUsers();
    this.subscribeToChat();

    // تحديث المحادثة المفتوحة فقط كل 5 ثواني
    setInterval(() => {
      if (this.selectedConversation) {
        this.chatService
          .getConversation(this.selectedConversation._id._id)
          .subscribe((response) => {
            if (response.type === 'initial' && Array.isArray(response.data)) {
              this.messages = response.data;
              this.changeDetectorRef.detectChanges();
            }
          });
      }
    }, 5000);
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
            if (message) {
              console.log('New message received in subscription:', message);
              this.handleNewMessage(message);
              // تحديث قائمة المحادثات مباشرة
              this.loadConversations();
              this.changeDetectorRef.detectChanges();
            }
          },
          error: (error) => {
            console.error('Error in chat subscription:', error);
          },
        });
    }
  }

  selectConversation(conversation: Conversation) {
    // إلغاء الاشتراك من المحادثة السابقة إذا كانت موجودة
    if (this.conversationSubscription) {
      this.conversationSubscription.unsubscribe();
    }

    this.selectedConversation = conversation;
    if (conversation._id._id) {
      // الاشتراك في تحديثات المحادثة
      this.conversationSubscription = this.chatService
        .getConversation(conversation._id._id)
        .subscribe({
          next: (response: any) => {
            if (!response) return;

            console.log('Conversation response:', response);

            switch (response.type) {
              case 'initial':
                if (Array.isArray(response.data)) {
                  this.messages = response.data;
                  // تحديث حالة القراءة للرسائل المستلمة
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
                  console.log('Initial messages loaded:', this.messages);
                }
                break;

              case 'message':
                const newMessage = response.data;
                if (!this.messages.some((m) => m._id === newMessage._id)) {
                  this.messages = [...this.messages, newMessage];
                  console.log('New message added to conversation:', newMessage);

                  if (
                    typeof newMessage.receiver === 'object' &&
                    newMessage.receiver._id === this.currentUserId &&
                    !newMessage.read &&
                    newMessage._id
                  ) {
                    this.chatService.markAsRead(newMessage._id).subscribe();
                  }
                }
                break;

              case 'update':
                const updatedMessage = response.data;
                const index = this.messages.findIndex(
                  (m) => m._id === updatedMessage._id
                );
                if (index !== -1) {
                  this.messages[index] = updatedMessage;
                  console.log(
                    'Message updated in conversation:',
                    updatedMessage
                  );
                }
                break;

              case 'error':
                console.error('Error in conversation:', response.error);
                break;
            }

            this.scrollToBottom();
            this.changeDetectorRef.detectChanges();
          },
          error: (error) => {
            console.error('Error in conversation subscription:', error);
          },
        });
    }
  }

  handleNewMessage(message: Message) {
    console.log('Handling new message:', message);

    // تحديث قائمة المحادثات
    this.loadConversations();

    // التحقق مما إذا كانت الرسالة تنتمي للمحادثة المفتوحة حالياً
    if (
      this.selectedConversation &&
      ((message.sender as User)._id === this.selectedConversation._id._id ||
        (message.receiver as User)._id === this.selectedConversation._id._id)
    ) {
      // إضافة الرسالة إلى المحادثة الحالية إذا لم تكن موجودة
      if (!this.messages.some((m) => m._id === message._id)) {
        this.messages = [...this.messages, message];
        console.log('Message added to current conversation:', message);

        // تحديث حالة القراءة إذا كنا المستلم
        if (
          typeof message.receiver === 'object' &&
          message.receiver._id === this.currentUserId &&
          !message.read &&
          message._id
        ) {
          this.chatService.markAsRead(message._id).subscribe();
        }

        // تحديث واجهة المستخدم
        this.changeDetectorRef.detectChanges();
        this.scrollToBottom();
      }
    }
  }

  sendMessage() {
    if (!this.newMessageContent.trim() || !this.selectedConversation) return;

    const message = {
      receiverId: this.selectedConversation._id._id,
      content: this.newMessageContent,
    };

    this.chatService.sendMessage(message).subscribe({
      next: (response: any) => {
        if (response.status === 'success' && response.data) {
          this.messages = [...this.messages, response.data];
          this.newMessageContent = '';
          this.scrollToBottom();
          this.loadConversations();
          this.changeDetectorRef.detectChanges();
        }
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

  editMessage(messageId: string, content: string) {
    // For now, we'll just update the message locally
    const index = this.messages.findIndex((m) => m._id === messageId);
    if (index !== -1) {
      this.messages[index] = {
        ...this.messages[index],
        content: content,
        edited: true,
      };
      this.changeDetectorRef.detectChanges();
    }
  }

  deleteMessage(messageId: string) {
    // For now, we'll just remove the message locally
    this.messages = this.messages.filter((m) => m._id !== messageId);
    this.changeDetectorRef.detectChanges();
  }

  updateUserStatus(status: string) {
    this.chatService.updateUserStatus(status).subscribe({
      error: (error) => {
        console.error('Error updating user status:', error);
      },
    });
  }

  ngOnDestroy() {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    if (this.conversationSubscription) {
      this.conversationSubscription.unsubscribe();
    }
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
