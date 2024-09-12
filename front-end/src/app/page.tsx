'use client';
import React, { useState, useRef, useEffect } from 'react';
import ChatMessage, { Message } from '@/components/chat-message';

interface Call {
  CallSid: string;
  From: string;
  callId: string;
}

interface AllCalls {
  [callSid: string]: Call;
}

interface MessageSocket extends Message {
  type: string;
  CallSid: string;
  From: string;
  callId: string;
}

export default function Home() {
  const [messagesOne, setMessagesOne] = useState<Message[]>([]);
  const [messagesTwo, setMessagesTwo] = useState<Message[]>([]);
  // const [currentCalls, setCurrentCalls] = useState<AllCalls>({});
  const currentCalls: AllCalls = {};

  const [status, setStatus] = useState<string>('disconnected');
  const [chatWindow, setChatWindow] = useState<{ [chatId: string]: undefined | string }>({ '1': undefined, '2': undefined });
  const [handsRaised, setHandsRaised] = useState('');

  const socketRef = useRef<WebSocket | null>(null);

  function addMessage(callId: string, message: Message) {
    const setMessage = +callId === 1 ? setMessagesOne : setMessagesTwo;
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

  const sendCommandSocket =
    (callId: string) =>
    (type: string, text = '') => {
      const CallSid = chatWindow[callId];
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type, text, CallSid }));
      }

      if (type === 'hijack-call') {
        addMessage(callId, { sender: 'System', text: `Forwarding the call to you...` });
      }

      if (type === 'new-msg-from-supervisor' && text !== '') {
        setHandsRaised((prev) => prev.replace(`|${callId}|`, '').replace('||', '|')); // outputs |1| or |1|2|
        callId;
      }
    };

  useEffect(() => {
    console.log('ws connecting...');
    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const message: MessageSocket = JSON.parse(event.data);

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
        setChatWindow((prevChatWindow) => ({ ...prevChatWindow, [callId]: CallSid }));
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
        setChatWindow((prevChatWindow) => ({ ...prevChatWindow, [callId]: undefined }));
        addMessage(callId, { sender: 'System', text: `Call with the Bot has ended.` });
        return;
      }

      //
      // Front End Connected to the Back End
      //
      if (message.type === 'front-end-connected') {
        console.log('@@@ front-end-connected');
        setStatus('connected');
        sendCommandSocket('0')('give-me-all-current-calls');
        return;
      }

      //
      // Virtual Agent wants the help of the Supervisor
      //
      if (message.type === 'raise-hand') {
        const { callId } = message;
        setHandsRaised((prev) => `${prev}|${callId}|`.replace('||', '|')); // outputs |1| or |1|2|
        return;
      }
    };

    socket.onclose = (event) => {
      console.log('ws closed', event);
      setStatus('disconnected');
    };

    socket.onerror = (event) => {
      console.error('Socket error', event);
      setStatus('disconnected & error');
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div className='flex flex-row h-screen'>
      <RenderChat
        messages={messagesOne}
        color={'red'}
        status={status}
        sendCommandSocket={sendCommandSocket('1')}
        CallSid={chatWindow[1]}
        isHandRaised={handsRaised.includes('1')}
      />
      <RenderChat
        messages={messagesTwo}
        color={'blue'}
        status={status}
        sendCommandSocket={sendCommandSocket('2')}
        CallSid={chatWindow[2]}
        isHandRaised={handsRaised.includes('2')}
      />
    </div>
  );
}

function RenderChat({
  messages,
  color,
  status,
  sendCommandSocket,
  CallSid,
  isHandRaised,
}: {
  messages: Message[];
  color: string;
  status: string;
  sendCommandSocket: Function;
  CallSid: undefined | string;
  isHandRaised: boolean;
}) {
  const [text, setText] = useState<string>('connecting...');
  const [placeHolder, setPlaceHolder] = useState<string>('connecting...');
  // const [bgColor, setBgColor] = useState<string>('bg-gray-300');

  if (status === 'connected' && !CallSid) {
    status = 'waiting for a call...';
  }

  const bgColor = status === 'connected' ? '' : 'bg-gray-100';
  const isDisabled = status !== 'connected';

  useEffect(() => {
    console.log('status changed', status);
    setText('');
    status === 'connected' ? setPlaceHolder('Send a hint') : setPlaceHolder(status);
  }, [status]);

  function sendMessage() {
    sendCommandSocket('new-msg-from-supervisor', text);
    setText('');
  }

  function hijackCall() {
    updateFlexActivityToAvailable();
    sendCommandSocket('hijack-call');
  }

  function updateFlexActivityToAvailable() {
    // if not loaded in an iframe, don't do anything
    if (!window.parent) {
      return;
    }

    // was loaded in an iframe of Flex
    window.parent.postMessage({ type: 'FLEX_CHANGE_ACTIVITY_TO_AVAILABLE' }, '*');
  }

  function handleKeyPress(event: any) {
    if (event.key === 'Enter') {
      sendMessage();
      event.preventDefault();
    }
  }

  function showRaisedHand() {
    if (!isHandRaised) {
      return;
    }

    return (
      <div className='flex-1 bg-indigo-100 flex flex-col justify-between p-4 space-y-4 items-center'>
        <img src='/raise-hand.png' width='200px' />
      </div>
    );
  }

  return (
    <div className='flex-1 bg-indigo-100 flex flex-col justify-between p-4 space-y-4'>
      <div id='chat' className='p-4 rounded shadow overflow-auto bg-indigo-200'>
        {messages.map((message, index) => (
          <ChatMessage key={index} {...message} />
        ))}
      </div>
      {showRaisedHand()}
      <div id='textbox' className={`mt-auto flex justify-end items-center space-x-2 bg-${color}-600 p-2 rounded-lg`}>
        <textarea
          placeholder={placeHolder}
          className={`flex-1 ${bgColor} rounded-lg`}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isDisabled}
        />
        <button
          className='px-4 py-2 bg-red-500 text-white rounded shadow-md hover:bg-red-600 transition-colors duration-200'
          onClick={sendMessage}
        >
          Send
        </button>
        <button
          className='px-4 py-2 bg-green-500 text-white rounded shadow-md hover:bg-green-600 transition-colors duration-200'
          onClick={hijackCall}
        >
          Hijack
        </button>
      </div>
    </div>
  );
}
