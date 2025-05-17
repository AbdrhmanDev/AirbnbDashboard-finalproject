export interface Message {
  _id?: string;
  sender: User | string;
  receiver: User | string;
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
}

export interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}
