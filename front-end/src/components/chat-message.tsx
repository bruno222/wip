export interface Message {
  sender: string;
  text: string;
  interactionId?: number;
}

export default function ChatMessage({ sender, text }: Message) {
  return (
    <div className='chat-message mb-4'>
      <h4 className='chat-author font-bold text-zinc-950'>{sender}</h4>
      <p className='chat-text text-zinc-950'>{text}</p>
    </div>
  );
}
