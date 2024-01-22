import Image from "next/image";
// import { MainScreen } from "@/components/main-screen";
import ChatMessage from "@/components/chat-message";

export default function Home() {
  return (
    <div className="flex flex-row h-screen">
      <div className="flex-1 bg-red-500 flex flex-col justify-between">
        <div id="chat" className="p-4 rounded shadow overflow-auto">
          {ChatMessage("Customer", "Hello, I need help with my order.")}
          {ChatMessage("Bot", "Sure, I can assist you with that. Can you please provide your order number?")}
          {ChatMessage("Supervisor", "Hello, I need help with my order.")}
          {ChatMessage("Customer", "Hello, I need help with my order.")}
          {ChatMessage("Bot", "Sure, I can assist you with that. Can you please provide your order number?")}
          {ChatMessage("Supervisor", "Hello, I need help with my order.")}
          {ChatMessage("Customer", "Hello, I need help with my order.")}
          {ChatMessage("Bot", "Sure, I can assist you with that. Can you please provide your order number?")}
          {ChatMessage("Supervisor", "Hello, I need help with my order.")}
          {ChatMessage("Customer", "Hello, I need help with my order.")}
          {ChatMessage("Bot", "Sure, I can assist you with that. Can you please provide your order number?")}
          {ChatMessage("Supervisor", "Hello, I need help with my order.")}
          {ChatMessage("Customer", "Hello, I need help with my order.")}
          {ChatMessage("Bot", "Sure, I can assist you with that. Can you please provide your order number?")}
          {ChatMessage("Supervisor", "Hello, I need help with my order.")}
        </div>
        <div id="textbox" className="flex justify-end items-center space-x-2 bg-yellow-400 p-2">
          <textarea className="flex-1" rows={3} />
          <button className="px-4 py-3 bg-green-500 text-white">Send</button>
        </div>
      </div>
      <div className="flex-1 bg-blue-500">bbb</div>
    </div>
  );
}
