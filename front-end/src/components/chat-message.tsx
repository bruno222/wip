export interface Message {
  sender: string;
  text: string;
  interactionId: number | undefined;
}

export default function ChatMessage({ sender, text }: Message) {
  return (
    <div className='chat-message mb-4'>
      <h4 className='chat-author font-bold text-gray-100'>{sender}</h4>
      <p className='chat-text text-white'>{text}</p>
    </div>
  );
}
