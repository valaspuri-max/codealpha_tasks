export interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  matchedQuestion?: string;
  similarity?: number; // 0..1
}
