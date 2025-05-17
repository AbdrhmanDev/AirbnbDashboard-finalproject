export interface Message {
  _id?: string;
  sender: User;
  receiver: User ;
  content?: string;
  booking?: string;
  delivered?: boolean;
  deliveredAt?: Date;
  read?: boolean;
  readAt?: Date;
  edited?: boolean;
  editedAt?: Date;
  isAttachment?: boolean;
  attachmentType?: 'image' | 'video' | 'document' | 'audio';
  attachmentUrl?: string;
  reactions?: { [userId: string]: string }; // Assuming userId -> emoji or reaction type
  isGroupMessage?: boolean;
  group?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: 'delivered' | 'read' | 'sent';
  threadId?: string;
  threadMessageCount?: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}
