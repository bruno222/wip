'use client';
import React, { useState, useEffect } from 'react';
import ChatMessage, { Message } from '@/components/chat-message';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    console.log('ws connecting...');
    const socket = new WebSocket('ws://localhost:8080');

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      setMessages((prevMessages) => {
        // add message to previous messages if it's from the same interaction
        if (prevMessages.length > 0) {
          const { interactionId, text: prevText } = prevMessages[prevMessages.length - 1];
          if (interactionId && interactionId === message.interactionId) {
            return [...prevMessages.slice(0, -1), { ...message, text: `${prevText} ${message.text.replace('•', '').trim()}` }];
          }
        }

        return [...prevMessages, { ...message }];
      });
    };

    socket.onclose = (event) => {
      console.log('ws closed', event);
    };

    socket.onerror = (event) => {
      console.log('Socket error', event);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className='flex flex-row h-screen'>
      <div className='flex-1 bg-red-500 flex flex-col justify-between'>
        <div id='chat' className='p-4 rounded shadow overflow-auto'>
          {ChatMessage('Customer', 'Hello, I need help with my order.')}
          {ChatMessage('Bot', 'Sure, I can assist you with that. Can you please provide your order number?')}
          {ChatMessage('Supervisor', 'Hello, I need help with my order.')}
          {ChatMessage('Customer', 'Hello, I need help with my order.')}
          {ChatMessage('Bot', 'Sure, I can assist you with that. Can you please provide your order number?')}
          {ChatMessage('Supervisor', 'Hello, I need help with my order.')}
          {ChatMessage('Customer', 'Hello, I need help with my order.')}
          {ChatMessage('Bot', 'Sure, I can assist you with that. Can you please provide your order number?')}
          {ChatMessage('Supervisor', 'Hello, I need help with my order.')}
          {ChatMessage('Customer', 'Hello, I need help with my order.')}
          {ChatMessage('Bot', 'Sure, I can assist you with that. Can you please provide your order number?')}
          {ChatMessage('Supervisor', 'Hello, I need help with my order.')}
          {ChatMessage('Customer', 'Hello, I need help with my order.')}
          {ChatMessage('Bot', 'Sure, I can assist you with that. Can you please provide your order number?')}
          {ChatMessage('Supervisor', 'Hello, I need help with my order.')}
          {messages.map((message, index) => (
            <ChatMessage key={index} {...message} />
          ))}
        </div>
        <div id='textbox' className='flex justify-end items-center space-x-2 bg-yellow-400 p-2'>
          <textarea className='flex-1' rows={3} />
          <button className='px-4 py-3 bg-green-500 text-white'>Send</button>
        </div>
      </div>
      <div className='flex-1 bg-blue-500'>bbb</div>
    </div>
  );
}
