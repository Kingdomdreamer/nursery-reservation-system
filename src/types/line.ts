// LINE messaging API types
export interface LineTextMessage {
  type: 'text';
  text: string;
}

export interface LineImageMessage {
  type: 'image';
  originalContentUrl: string;
  previewImageUrl: string;
}

export interface LineVideoMessage {
  type: 'video';
  originalContentUrl: string;
  previewImageUrl: string;
}

export interface LineAudioMessage {
  type: 'audio';
  originalContentUrl: string;
  duration: number;
}

export interface LineLocationMessage {
  type: 'location';
  title: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface LineStickerMessage {
  type: 'sticker';
  packageId: string;
  stickerId: string;
}

export interface LineQuickReplyButton {
  type: 'action';
  action: {
    type: 'message' | 'postback' | 'uri' | 'datetimepicker' | 'camera' | 'cameraRoll' | 'location';
    label?: string;
    text?: string;
    data?: string;
    uri?: string;
    mode?: 'date' | 'time' | 'datetime';
    initial?: string;
    max?: string;
    min?: string;
  };
}

export interface LineQuickReply {
  items: LineQuickReplyButton[];
}

export interface LineFlexMessage {
  type: 'flex';
  altText: string;
  contents: LineFlexContainer;
}

export interface LineFlexContainer {
  type: 'bubble' | 'carousel';
  [key: string]: unknown;
}

export type LineMessage = 
  | LineTextMessage
  | LineImageMessage
  | LineVideoMessage
  | LineAudioMessage
  | LineLocationMessage
  | LineStickerMessage
  | LineFlexMessage;

export interface LineMessageRequest {
  to: string;
  messages: LineMessage[];
  notificationDisabled?: boolean;
}

export interface LineMessageResponse {
  success: boolean;
  error?: string;
}

// Type guards
export const isLineTextMessage = (message: LineMessage): message is LineTextMessage => {
  return message.type === 'text';
};

export const isLineImageMessage = (message: LineMessage): message is LineImageMessage => {
  return message.type === 'image';
};

export const isLineFlexMessage = (message: LineMessage): message is LineFlexMessage => {
  return message.type === 'flex';
};

// Validation functions
export const validateLineUserId = (userId: string): boolean => {
  return typeof userId === 'string' && userId.length === 33 && userId.startsWith('U');
};

export const validateLineMessage = (message: LineMessage): boolean => {
  if (!message || typeof message !== 'object') {
    return false;
  }

  switch (message.type) {
    case 'text':
      return typeof message.text === 'string' && message.text.length <= 5000;
    case 'image':
      return typeof message.originalContentUrl === 'string' && 
             typeof message.previewImageUrl === 'string';
    case 'flex':
      return typeof message.altText === 'string' && 
             typeof message.contents === 'object';
    default:
      return false;
  }
};

export const validateLineMessageRequest = (request: LineMessageRequest): boolean => {
  if (!validateLineUserId(request.to)) {
    return false;
  }

  if (!Array.isArray(request.messages) || request.messages.length === 0 || request.messages.length > 5) {
    return false;
  }

  return request.messages.every(validateLineMessage);
};