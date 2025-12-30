
import React, { useState, useEffect } from 'react';
import { messagingService } from '../services/messagingService';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/UI/Spinner';
import { Message } from '../types';

export const Messaging: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [showCompose, setShowCompose] = useState(false);

  const [form, setForm] = useState({ recipientId: '', subject: '', body: '' });

  const fetchInbox = async () => {
    if (user) {
      const data = await messagingService.getInbox(user.id);
      setMessages(data);
      setLoading(false);
    }
  };

  useEffect(() => { fetchInbox(); }, [user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await messagingService.sendMessage({ ...form, senderId: user.id });
    setShowCompose(false);
    setForm({ recipientId: '', subject: '', body: '' });
    alert("Message sent successfully!");
  };

  if (loading) return <div className="p-20"><Spinner size="lg" /></div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6">
      <header className="flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Communication Center</h1>
            <p className="text-sm text-slate-500">Secure internal messaging across roles</p>
         </div>
         <button 
           onClick={() => setShowCompose(true)}
           className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
         >
           Compose Message
         </button>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar: Message List */}
        <div className="w-80 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-y-auto shadow-sm">
           {messages.map(m => (
             <button 
               key={m.id}
               onClick={() => { setSelectedMsg(m); messagingService.markAsRead(m.id); }}
               className={`w-full text-left p-6 border-b border-slate-50 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 relative ${selectedMsg?.id === m.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
             >
                {!m.isRead && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-600 rounded-full"></div>}
                <div className="flex justify-between items-start mb-1">
                   <p className="text-sm font-bold text-slate-900 dark:text-white">{m.sender?.firstName} {m.sender?.lastName}</p>
                   <span className="text-[10px] text-slate-400">{new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs font-bold text-indigo-600 truncate">{m.subject}</p>
                <p className="text-xs text-slate-500 truncate mt-1">{m.body}</p>
             </button>
           ))}
           {messages.length === 0 && <div className="p-10 text-center text-slate-400 italic text-sm">Inbox empty</div>}
        </div>

        {/* Content: View Message */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
           {selectedMsg ? (
             <div className="p-10 flex flex-col h-full">
                <div className="pb-8 border-b border-slate-50 dark:border-slate-800 mb-8">
                   <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{selectedMsg.subject}</h2>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {selectedMsg.sender?.firstName[0]}
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-800 dark:text-white">From: {selectedMsg.sender?.firstName} {selectedMsg.sender?.lastName}</p>
                         <p className="text-[10px] text-slate-400 uppercase font-black">{new Date(selectedMsg.sentAt).toLocaleString()}</p>
                      </div>
                   </div>
                </div>
                <div className="flex-1 text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                   {selectedMsg.body}
                </div>
                <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex gap-4">
                   <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">Reply</button>
                   <button className="px-6 py-2 text-slate-500 font-bold text-sm">Forward</button>
                </div>
             </div>
           ) : (
             <div className="m-auto text-center space-y-4">
                <div className="text-6xl opacity-10">📧</div>
                <p className="text-slate-400 font-medium italic">Select a message from the sidebar to read</p>
             </div>
           )}
        </div>
      </div>

      {showCompose && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl border border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8">New Message</h2>
            <form onSubmit={handleSend} className="space-y-4">
              <input 
                required 
                placeholder="Recipient User ID (e.g. u_acc)"
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                value={form.recipientId}
                onChange={e => setForm({...form, recipientId: e.target.value})}
              />
              <input 
                required 
                placeholder="Subject"
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white font-bold"
                value={form.subject}
                onChange={e => setForm({...form, subject: e.target.value})}
              />
              <textarea 
                required 
                rows={6}
                placeholder="Write your message here..."
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white resize-none"
                value={form.body}
                onChange={e => setForm({...form, body: e.target.value})}
              />
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl">Send Message</button>
                <button type="button" onClick={() => setShowCompose(false)} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-bold">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
