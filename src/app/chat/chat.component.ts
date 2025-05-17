import { Component, OnInit } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { Message } from '../models/messges';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit {
  isChatOpen = false;
  messages: Message[] = [];
  newMessageContent: string = '';

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Subscribe to real-time messages when the component initializes
    // You might want to subscribe only when the chat is open in a real application
    // and unsubscribe when it closes for performance.
    // For simplicity here, we subscribe on init.
    const currentUserId = 'YOUR_USER_ID'; // Replace with the actual logged-in user ID
    this.chatService.subscribeToChat(currentUserId).subscribe((message) => {
      // Add the new message to the messages array
      // This will handle both new incoming messages and status updates for sent messages
      const existingMessageIndex = this.messages.findIndex(
        (m) => m._id === message._id
      );
      if (existingMessageIndex > -1) {
        // Update existing message (e.g., delivered, read status)
        this.messages[existingMessageIndex] = message;
      } else {
        // Add new message
        this.messages.push(message);
      }
    });

    // TODO: Fetch initial messages when the chat is opened.
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      // TODO: Fetch initial messages here when the chat opens
      console.log('Chat opened. Fetching initial messages...');
      // Example: Fetch messages for a specific conversation or user
      // const userId = 'current-user-id'; // Replace with actual user ID
      // this.chatService.getUserMessages(userId).subscribe(messages => {
      //   this.messages = messages;
      // });
    } else {
      console.log('Chat closed.');
      // TODO: You might want to unsubscribe from real-time updates here if you subscribed only on open.
    }
  }

  sendMessage() {
    if (this.newMessageContent.trim()) {
      const message: Message = {
        sender: 'YOUR_USER_ID', // Replace with actual sender ID
        receiver: 'RECIPIENT_USER_ID', // Replace with actual recipient ID
        content: this.newMessageContent.trim(),
      };

      this.chatService.sendMessage(message).subscribe(
        (response) => {
          console.log('Message sent:', response);
          this.newMessageContent = ''; // Clear input after sending
          // The new message will be added to the array via the Pusher subscription
        },
        (error) => {
          console.error('Error sending message:', error);
          // Handle error (e.g., show a notification)
        }
      );
    }
  }

  // Optional: Add ngOnDestroy to unsubscribe from Pusher when the component is destroyed
  // ngOnDestroy() {
  //   this.chatService.unsubscribeFromChat();
  // }
}
