export default function ChatMessage(who: string, msg: string) {
  return (
    <div className="chat-message mb-4">
      <h4 className="chat-author font-bold text-gray-100">{who}</h4>
      <p className="chat-text text-white">{msg}</p>
    </div>
  );
}
