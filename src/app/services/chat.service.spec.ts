import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { Message } from '../models/messges';
import { environment } from '../../environments/environment';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChatService]
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send a message', () => {
    const testMessage: Message = {
      sender: 'senderId',
      receiver: 'receiverId',
      content: 'Test message'
    };

    service.sendMessage(testMessage).subscribe(message => {
      expect(message).toEqual(testMessage);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/messages`);
    expect(req.request.method).toBe('POST');
    req.flush(testMessage);
  });

  it('should get messages between two users', () => {
    const senderId = 'senderId';
    const receiverId = 'receiverId';
    const testMessages: Message[] = [
      {
        sender: senderId,
        receiver: receiverId,
        content: 'Test message 1'
      },
      {
        sender: receiverId,
        receiver: senderId,
        content: 'Test message 2'
      }
    ];

    service.getMessages(senderId, receiverId).subscribe(messages => {
      expect(messages).toEqual(testMessages);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/messages/conversation/${senderId}/${receiverId}`);
    expect(req.request.method).toBe('GET');
    req.flush(testMessages);
  });

  it('should mark message as read', () => {
    const messageId = 'messageId';
    const updatedMessage: Message = {
      sender: 'senderId',
      receiver: 'receiverId',
      content: 'Test message',
      read: true,
      readAt: new Date()
    };

    service.markAsRead(messageId).subscribe(message => {
      expect(message).toEqual(updatedMessage);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/messages/${messageId}/read`);
    expect(req.request.method).toBe('PATCH');
    req.flush(updatedMessage);
  });
}); 