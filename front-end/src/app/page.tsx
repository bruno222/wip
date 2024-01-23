'use client';
import React, { useState, useEffect } from 'react';
import ChatMessage, { Message } from '@/components/chat-message';

interface Call {
  CallSid: string;
  From: string;
  callId: number;
}

interface AllCalls {
  [callSid: string]: Call;
}
export default function Home() {
  const [messagesOne, setMessagesOne] = useState<Message[]>([]);
  const [messagesTwo, setMessagesTwo] = useState<Message[]>([]);
  // const [currentCalls, setCurrentCalls] = useState<AllCalls>({});
  const currentCalls: AllCalls = {};
  const [status, setStatus] = useState<string>('disconnected');

  function addMessage(callId: number, message: Message) {
    const setMessage = callId === 1 ? setMessagesOne : setMessagesTwo;
    setMessage((prevMessages) => {
      console.log('@@@ prevMessages', prevMessages);

      // add message to previous messages if it's from the same interaction
      if (prevMessages.length > 0) {
        const { interactionId, text: prevText } = prevMessages[prevMessages.length - 1];
        if (interactionId && interactionId === message.interactionId) {
          return [...prevMessages.slice(0, -1), { ...message, text: `${prevText} ${message.text.replace('•', '').trim()}` }];
        }
      }

      return [...prevMessages, { ...message, text: message.text.replace('•', '').trim() }];
    });
  }
  useEffect(() => {
    console.log('ws connecting...');
    const socket = new WebSocket('ws://localhost:8080');

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      //
      // New Msg
      //
      if (message.type === 'new-msg') {
        console.log('@@@ new-msg', message);

        const currentCall = currentCalls[message.CallSid];
        console.log('@@@ currentCall', currentCall, currentCalls);
        const callId = currentCall ? currentCall.callId : 0;
        if (!callId) {
          console.warn('callId is null');
          return;
        }

        addMessage(callId, message);
        return;
      }

      //
      // Call Started
      //
      if (message.type === 'call-started') {
        const { CallSid, From, callId } = message;
        currentCalls[CallSid] = { CallSid, From, callId };
        // setCurrentCalls((prevCalls) => ({ ...prevCalls, [CallSid]: { CallSid, From, callId } }));
        addMessage(callId, { sender: 'System', text: `Call started with ${From}` });
        return;
      }

      //
      // Call Ended
      //
      if (message.type === 'call-ended') {
        const { CallSid, From, callId } = message;
        currentCalls[CallSid] = { CallSid, From, callId };
        addMessage(callId, { sender: 'System', text: `Call ended.` });
        return;
      }

      //
      // Front End Connected to the Back End
      //
      if (message.type === 'front-end-connected') {
        setStatus('connected');
        return;
      }
    };

    socket.onclose = (event) => {
      console.log('ws closed', event);
      setStatus('disconnected');
    };

    socket.onerror = (event) => {
      console.error('Socket error', event);
      setStatus('disconnected');
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className='flex flex-row h-screen'>
      <RenderChat messages={messagesOne} color={'red'} status={status} />
      <RenderChat messages={messagesTwo} color={'blue'} status={status} />
    </div>
  );
}

function RenderChat({ messages, color, status }: { messages: Message[]; color: string; status: string }) {
  const [text, setText] = useState<string>('connecting...');
  // const [bgColor, setBgColor] = useState<string>('bg-gray-300');

  const bgColor = status === 'connected' ? '' : 'bg-gray-300';

  useEffect(() => {
    console.log('status changed', status);
    status === 'connected' ? setText('') : setText(status);
  }, [status]);

  return (
    <div className={`flex-1 bg-${color}-200 flex flex-col justify-between`}>
      <div id='chat' className='p-4 rounded shadow overflow-auto'>
        {messages.map((message, index) => (
          <ChatMessage key={index} {...message} />
        ))}
      </div>

      <div id='textbox' className={`flex justify-end items-center space-x-2 bg-${color}-500 p-2`}>
        <textarea className={`flex-1 ${bgColor}`} rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <button className='px-4 py-3 bg-green-500 text-white'>Send</button>
      </div>
    </div>
  );
}
