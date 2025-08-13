import React, { useEffect, useMemo, useRef, useState } from "react";
import ApiService from './services/api';

const K = { EVENTS: "MB_EVENTS", USERS: "MB_USERS", SESS: "MB_SESSION", JOINED: "MB_JOINED", SAVED: "MB_SAVED", CHATS: "MB_CHATS", PMAP: "MB_PMAP" };
const g = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : structuredClone(d); } catch (e) { return structuredClone(d); } };
const s = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const wipe = () => { [K.EVENTS, K.JOINED, K.SAVED, K.PMAP].forEach((k) => localStorage.removeItem(k)); };

const dateStr = (add = 0, hm = "19:00") => { const d = new Date(); d.setDate(d.getDate() + add); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); const dd = String(d.getDate()).padStart(2, "0"); return `${y}-${m}-${dd} ${hm}`; };
const SEED = [
  { id: "e1", title: "Sushi Night at Sakura", cate: "Japanese", place: "Sakura Restaurant · Downtown", time: dateStr(0, "19:00"), budget: 40, cap: 4, joined: 2, desc: "Authentic sushi night at 7 PM. Table for 4.", host: { user: "jess", name: "Jessica L.", rate: 4.7, punctual: 97, tags: "#Sushi #Split bill" }, img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80", isNew: true, tags: ["Sushi", "Japanese", "Dinner"] },
  { id: "e2", title: "Italian Trattoria Lunch", cate: "Western", place: "Little Italy · Trattoria", time: dateStr(1, "12:30"), budget: 25, cap: 5, joined: 3, desc: "Let’s try their lunch menu together.", host: { user: "mike", name: "Mike R.", rate: 4.8, punctual: 96, tags: "#Italian #Casual" }, img: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80", tags: ["Pasta", "Lunch"] },
  { id: "e3", title: "Friday Sichuan Dinner", cate: "Sichuan", place: "Wangjing · Pepper House", time: dateStr(2, "19:00"), budget: 70, cap: 6, joined: 5, desc: "Spicy night out!", host: { user: "allen", name: "Allen", rate: 4.7, punctual: 97, tags: "#Spicy #OnTime" }, img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop", tags: ["Sichuan", "Spicy"] },
];

function migrate() {
  let ev = g(K.EVENTS, null);
  if (!Array.isArray(ev) || ev.some((x) => !x || !x.id || !x.title || !x.place)) { s(K.EVENTS, SEED); ev = SEED; }
  if (g(K.USERS, null) == null) { s(K.USERS, { jess: { pass: "123", nick: "Jessica L.", email: "jess@example.com", avatar: "", bio: "" }, mike: { pass: "123", nick: "Mike R.", email: "mike@example.com", avatar: "", bio: "" }, allen: { pass: "123", nick: "Allen", email: "allen@example.com", avatar: "", bio: "" } }); }
  if (!g(K.JOINED, null)) s(K.JOINED, {});
  if (!g(K.SAVED, null)) s(K.SAVED, {});
  if (!g(K.CHATS, null)) s(K.CHATS, {});
  if (!g(K.PMAP, null)) { const pm = {}; (ev || SEED).forEach((e) => { pm[e.id] = [e.host.user]; }); s(K.PMAP, pm); }
}

const soonTag = (when) => { const now = new Date(); const t = new Date(when); const diff = (t - now) / 36e5; if (diff < 0) return ""; if (now.toDateString() === t.toDateString()) { if (diff <= 2) return "within 2 hours"; return "Tonight " + when.split(" ")[1]; } return ""; };
const pickImgByCate = (c) => { const x = (c || "").toLowerCase(); if (x.includes("hot")) return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop"; if (x.includes("sich")) return "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop"; if (x.includes("jap")) return "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=800&auto=format&fit=crop"; if (x.includes("bbq")) return "https://images.unsplash.com/photo-1551504734-5ee1c4a1479a?q=80&w=800&auto=format&fit=crop"; if (x.includes("sea")) return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop"; return "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=800&auto=format&fit=crop"; };

export default function App() {
  const [page, setPage] = useState("home");
  const [events, setEvents] = useState(() => g(K.EVENTS, SEED));
  const [users, setUsers] = useState(() => g(K.USERS, {}));
  const [session, setSession] = useState(() => g(K.SESS, { username: null }));
  const [joinedMap, setJoinedMap] = useState(() => g(K.JOINED, {}));
  const [savedMap, setSavedMap] = useState(() => g(K.SAVED, {}));
  const [chats, setChats] = useState(() => g(K.CHATS, {}));
  const [pmap, setPmap] = useState(() => g(K.PMAP, {}));
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState({ cate: "", maxBudget: Infinity, hours: null });
  const [activeEventId, setActiveEventId] = useState(null);
  const [profileTab, setProfileTab] = useState("mine");
  const [modals, setModals] = useState({ filter: false, auth: false, edit: false });
  const [authMode, setAuthMode] = useState("signin");
  const [authErr, setAuthErr] = useState("");
  const [aiBooted, setAiBooted] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMsgs, setAiMsgs] = useState([{ self: false, text: "Hi! I’m your AI buddy. Ask me anything about food, restaurants, or planning a meetup.", time: new Date().toLocaleTimeString() }]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    migrate();
    const gfont = document.createElement("link"); gfont.rel = "stylesheet"; gfont.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap"; document.head.appendChild(gfont);
    const fa = document.createElement("link"); fa.rel = "stylesheet"; fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"; document.head.appendChild(fa);
  }, []);

  useEffect(() => {
    const onDocClick = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // 应用启动时加载最新的事件数据
  useEffect(() => {
    const initializeEvents = async () => {
      try {
        const response = await ApiService.getEvents();
        const eventsData = response.events || response;
        
        // 初始化用户数据和参与者映射
        const newUsers = { ...users };
        const newPmap = {};
        
        // 转换后端数据格式为前端期望的格式
        const transformedEvents = eventsData.map(event => {
          // 添加创建者信息到 users 状态
          if (event.creator) {
            newUsers[event.creator.username] = {
              pass: "",
              nick: event.creator.username,
              username: event.creator.username,
              email: event.creator.email || "",
              avatar: event.creator.avatar || "",
              bio: event.creator.bio || ""
            };
          }
          
          // 重建 pmap - 参与者映射，同时添加参与者信息到 users 状态
          if (event.participants) {
            const participantUsernames = [];
            
            // 处理每个参与者
            event.participants.forEach(participant => {
              const username = participant.username;
              participantUsernames.push(username);
              
              // 添加参与者信息到 users 状态
              newUsers[username] = {
                pass: "",
                nick: participant.username,
                username: participant.username,
                email: participant.email || "",
                avatar: participant.avatar || "",
                bio: participant.bio || ""
              };
            });
            
            // 确保创建者在参与者列表的第一位
            if (event.creator && event.creator.username) {
              const creatorUsername = event.creator.username;
              const filteredParticipants = participantUsernames.filter(username => username !== creatorUsername);
              newPmap[event.id] = [creatorUsername, ...filteredParticipants];
            } else {
              newPmap[event.id] = participantUsernames;
            }
          }
          
          return {
            ...event,
            // 将 creator 转换为 host 结构
            host: event.creator ? {
              user: event.creator.username,
              name: event.creator.username,
              avatar: event.creator.avatar || "",
              rate: 4.9,
              punctual: 99
            } : {
              user: "unknown",
              name: "Unknown",
              avatar: "",
              rate: 4.9,
              punctual: 99
            }
          };
        });
        
        setEvents(transformedEvents);
        setUsers(newUsers);
        setPmap(newPmap);
      } catch (error) {
        console.error('Failed to load events on startup:', error);
      }
    };
    initializeEvents();
  }, []);

  useEffect(() => s(K.EVENTS, events), [events]);
  useEffect(() => s(K.USERS, users), [users]);
  useEffect(() => s(K.SESS, session), [session]);
  useEffect(() => s(K.JOINED, joinedMap), [joinedMap]);
  useEffect(() => s(K.SAVED, savedMap), [savedMap]);
  useEffect(() => s(K.CHATS, chats), [chats]);
  useEffect(() => s(K.PMAP, pmap), [pmap]);

  const currentUser = session.username;
  const ensureUserState = (u) => { if (!u) return; setJoinedMap((m) => ({ ...m, [u]: m[u] || [] })); setSavedMap((m) => ({ ...m, [u]: m[u] || [] })); setChats((m) => ({ ...m, [u]: m[u] || [] })); setPmap((pm) => { const copy = { ...pm }; Object.keys(copy).forEach((id) => { if (!Array.isArray(copy[id])) copy[id] = []; }); return copy; }); };

  const nav = (name) => { setPage(name); if (name === "ai" && !aiBooted) setAiBooted(true); };

  const filteredEvents = useMemo(() => {
    let list = Array.isArray(events) ? [...events] : [...SEED];
    const q = keyword.trim().toLowerCase();
    if (q) list = list.filter((e) => (e.title + e.place + e.cate).toLowerCase().includes(q));
    if (filter.cate) list = list.filter((e) => (e.cate || "").toLowerCase().includes(filter.cate.toLowerCase()));
    if (filter.maxBudget !== Infinity) list = list.filter((e) => e.budget <= filter.maxBudget);
    if (filter.hours) { const now = new Date(); const end = new Date(now.getTime() + filter.hours * 3600000); list = list.filter((e) => { const t = new Date(e.time); return t >= now && t <= end; }); }
    list.sort((a, b) => new Date(a.time) - new Date(b.time));
    return list;
  }, [events, keyword, filter]);

  const activeEvent = useMemo(() => events.find((e) => e.id === activeEventId) || null, [events, activeEventId]);

  const detailParticipants = useMemo(() => {
    if (!activeEvent) return [];
    const pmAll = { ...pmap }; pmAll[activeEvent.id] = pmAll[activeEvent.id] || [activeEvent.host.user];
    let list = pmAll[activeEvent.id].slice(); list = [activeEvent.host.user, ...list.filter((x) => x !== activeEvent.host.user)];
    // 删除自动创建Guest用户的逻辑，只显示实际参与者
    // 过滤掉任何auto_开头的Guest用户
    list = list.filter(uid => !uid.startsWith('auto_'));
    if (JSON.stringify(pmap[activeEvent.id]) !== JSON.stringify(list)) { setPmap((pm) => ({ ...pm, [activeEvent.id]: list })); }
    return list;
  }, [activeEvent, pmap, users]);

  const doLogin = async (u) => { 
    setSession({ username: u }); 
    ensureUserState(u);
    
    // 清理之前用户的状态，确保切换账号时数据正确
    setChats({});
    setSavedMap({});
    setJoinedMap({});
    setPmap({});
    
    // 加载用户的所有聊天室
    try {
      const response = await ApiService.getChatConversations();
      const conversations = response.conversations || [];
      
      const userChats = conversations.map(conv => ({
        eid: conv.event.id,
        title: conv.event.title || conv.event.location,
        msgs: [] // 初始为空，点击时再加载具体消息
      }));
      
      setChats({ [u]: userChats });
      
      // 重新加载事件数据以确保状态同步
      await loadEvents();
      
      // 重建用户状态映射
      const currentUserId = getCurrentUserId();
      if (currentUserId) {
        // 获取最新的事件数据来重建状态（使用原始后端数据来获取完整的用户信息）
        const eventsData = await ApiService.getEvents();
        
        // 重建 joinedMap - 检查用户参与的事件
        const userJoinedEvents = [];
        const newPmap = {};
        
        // 同时更新用户信息
        const newUsers = { ...users };
        
        eventsData.forEach(event => {
          // 检查当前用户是否是参与者
          const isParticipant = event.participants && event.participants.some(p => p.id === currentUserId);
          const isCreator = event.creator_id === currentUserId;
          
          if (isParticipant || isCreator) {
            userJoinedEvents.push(event.id);
          }
          
          // 添加创建者信息到 users 状态
          if (event.creator) {
            newUsers[event.creator.username] = {
              pass: "",
              nick: event.creator.username,
              email: event.creator.email || "",
              avatar: event.creator.avatar || "",
              bio: event.creator.bio || ""
            };
          }
          
          // 重建 pmap - 参与者映射，同时添加参与者信息到 users 状态
          if (event.participants) {
            const participantUsernames = [];
            
            // 处理每个参与者
            event.participants.forEach(participant => {
              const username = participant.username;
              participantUsernames.push(username);
              
              // 添加参与者信息到 users 状态
              newUsers[username] = {
                pass: "",
                nick: participant.username,
                email: participant.email || "",
                avatar: participant.avatar || "",
                bio: participant.bio || ""
              };
            });
            
            // 确保创建者在参与者列表的第一位
            if (event.creator && event.creator.username) {
              const creatorUsername = event.creator.username;
              const filteredParticipants = participantUsernames.filter(username => username !== creatorUsername);
              newPmap[event.id] = [creatorUsername, ...filteredParticipants];
            } else {
              newPmap[event.id] = participantUsernames;
            }
          }
        });
        
        setJoinedMap({ [u]: userJoinedEvents });
        setPmap(newPmap);
        setUsers(newUsers);
      }
      
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };
  
  // 获取当前用户ID
  const getCurrentUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id;
    } catch {
      return null;
    }
  };
  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setSession({ username: null });
    // 清理所有用户相关的本地状态
    setChats({});
    setSavedMap({});
    setJoinedMap({});
    setPmap({});
  };

  const openDetail = (id) => { setActiveEventId(id); nav("detail"); };

  const ensureChat = async (u, ev) => {
    setChats((all) => {
      const arr = all[u] || [];
      if (!arr.find((c) => c.eid === ev.id)) {
        const newArr = [{ eid: ev.id, title: ev.title || ev.place, msgs: [] }, ...arr];
        return { ...all, [u]: newArr };
      }
      return all;
    });
    
    // 加载聊天历史
    try {
      const response = await ApiService.getChatHistory(ev.id);
      const messages = response.messages || [];
      
      setChats((all) => {
        const arr = all[u] || [];
        const chatIndex = arr.findIndex((c) => c.eid === ev.id);
        if (chatIndex !== -1) {
          const updated = [...arr];
          updated[chatIndex] = {
            ...updated[chatIndex],
            msgs: messages.map(msg => ({
              self: msg.sender_id === getCurrentUserId(),
              text: msg.content,
              time: new Date(msg.created_at).toLocaleTimeString(),
              sender: msg.sender?.username || 'Unknown'
            }))
          };
          return { ...all, [u]: updated };
        }
        return all;
      });
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // 如果加载失败，添加欢迎消息
      setChats((all) => {
        const arr = all[u] || [];
        const chatIndex = arr.findIndex((c) => c.eid === ev.id);
        if (chatIndex !== -1 && arr[chatIndex].msgs.length === 0) {
          const updated = [...arr];
          updated[chatIndex] = {
            ...updated[chatIndex],
            msgs: [{ self: false, text: "Welcome to the group chat!", time: new Date().toLocaleTimeString() }]
          };
          return { ...all, [u]: updated };
        }
        return all;
      });
    }
  };

  const tryJoin = async () => {
  const u = currentUser;
  if (!u) { setAuthMode("signin"); setModals((m) => ({ ...m, auth: true })); return; }

  console.log('=== JOIN EVENT DEBUG ===');
  console.log('Current user:', u);
  console.log('Event ID:', activeEventId);
  console.log('Token exists:', !!localStorage.getItem('token'));
  
  // Add frontend pre-checks
  if (activeEvent.host.user === u) {
    alert("You cannot join your own event. You are already the creator.");
    return;
  }
  
  if (detailParticipants.length >= activeEvent.cap) {
    alert("Event is full. Cannot join.");
    return;
  }
  
  if ((joinedMap[u] || []).includes(activeEventId)) {
    alert("You have already joined this event.");
    return;
  }
  
  try {
    console.log('Attempting to join event:', activeEventId);
    
    const response = await ApiService.joinEvent(activeEventId);
    console.log('Join event successful:', response);
    
    // Update local state
    ensureUserState(u);
    setEvents((list) => {
      const idx = list.findIndex((x) => x.id === activeEventId);
      if (idx === -1) return list;
      const copy = [...list];
      copy[idx] = { ...copy[idx], joined: copy[idx].joined + 1 };
      return copy;
    });
    
    setJoinedMap((m) => ({ ...m, [u]: [...(m[u] || []), activeEventId] }));
    setPmap((pm) => { 
      const arr = pm[activeEventId] || [events.find(e => e.id === activeEventId)?.host.user]; 
      return arr.includes(u) ? pm : { ...pm, [activeEventId]: [...arr, u] }; 
    });
    
    const activeEvent = events.find(e => e.id === activeEventId);
    if (activeEvent) await ensureChat(u, activeEvent);
    
    alert("Joined successfully and chat created");
    
  } catch (error) {
    console.error('Join event failed:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response,
      responseData: error.response?.data
    });
    
    // Display specific error messages in English
    let errorMessage = 'Failed to join event. Please try again.';
    
    // Check for backend error message
    if (error.response?.data?.error) {
      const backendError = error.response.data.error;
      
      // Map specific error messages to user-friendly English messages
      if (backendError.includes('cannot join your own event') || backendError.includes('already the creator')) {
        errorMessage = 'You cannot join your own event as you are the creator.';
      } else if (backendError.includes('Event is full')) {
        errorMessage = 'This event is full. No more participants can join.';
      } else if (backendError.includes('already joined')) {
        errorMessage = 'You have already joined this event.';
      } else if (backendError.includes('Authentication required') || backendError.includes('token')) {
        errorMessage = 'Please log in to join events.';
      } else {
        // Use the backend error message directly if it's in English
        errorMessage = backendError;
      }
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      if (error.message.includes('Authentication required')) {
        errorMessage = 'Please log in to join events.';
      } else if (error.message.includes('HTTP 400')) {
        errorMessage = 'Invalid request. Please check your input and try again.';
      } else if (error.message.includes('HTTP 401')) {
        errorMessage = 'Please log in to join events.';
      } else if (error.message.includes('HTTP 404')) {
        errorMessage = 'Event not found. It may have been deleted.';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.message;
      }
    }
    
    alert(errorMessage);
  }
};

  const toggleSave = async () => {
  const u = currentUser;
  if (!u) { setAuthMode("signin"); setModals((m) => ({ ...m, auth: true })); return; }
  
  ensureUserState(u);
  const currentlySaved = (savedMap[u] || []).includes(activeEventId);
  
  try {
    console.log('Attempting to toggle save event:', { eventId: activeEventId, currentlySaved });
    
    // 调用后端API
    if (currentlySaved) {
      await ApiService.unsaveEvent(activeEventId);
    } else {
      await ApiService.saveEvent(activeEventId);
    }
    
    console.log('Toggle save successful');
    
    // 更新本地状态
    setSavedMap((m) => { 
      const set = new Set(m[u] || []); 
      if (set.has(activeEventId)) set.delete(activeEventId); 
      else set.add(activeEventId); 
      return { ...m, [u]: [...set] }; 
    });
    
  } catch (error) {
    console.error('Toggle save failed:', error);
    alert(error.message || 'Failed to save/unsave event. Please try again.');
  }
};

  const publishEvent = async (payload) => {
  const u = currentUser;
  if (!u) { setAuthMode("signin"); setModals((m) => ({ ...m, auth: true })); return; }
  
  const when = new Date(`${payload.date} ${payload.time}`);
  const conflict = events.some((ev) => Math.abs(new Date(ev.time) - when) < 3600000 && ev.host?.user === u);
  if (conflict && !confirm("You have another event around that time. Publish anyway?")) return;
  
  try {
    console.log('Attempting to create event:', payload);
    
    // 准备发送给后端的数据
    const eventData = {
      title: payload.title || `${payload.date} ${payload.time}｜${payload.place}`,
      category: payload.cate?.trim(),
      location: payload.place.trim(),
      datetime: `${payload.date} ${payload.time}`,
      budget: Number(payload.budget),
      max_participants: Number(payload.cap),
      description: payload.desc?.trim(),
      image_url: pickImgByCate(payload.cate)
    };
    
    // 调用后端API
    const response = await ApiService.createEvent(eventData);
    console.log('Create event successful:', response);
    
    // 更新本地状态
    const ev = {
      id: response.id,
      title: response.title,
      cate: response.category,
      place: response.location,
      time: response.datetime,
      budget: response.budget,
      cap: response.max_participants,
      joined: 1,
      desc: response.description,
      host: {
        user: u,
        name: users[u]?.nick || u,
        avatar: users[u]?.avatar || "",
        rate: 4.9,
        punctual: 99,
        tags: "#Split bill #Punctual #Friendly"
      },
      img: response.image_url || pickImgByCate(payload.cate),
      isNew: true,
      tags: payload.cate ? [payload.cate] : []
    };
    
    setEvents((list) => [ev, ...list]);
    setJoinedMap((m) => ({ ...m, [u]: [...(m[u] || []), response.id] }));
    setPmap((pm) => ({ ...pm, [response.id]: [u] }));
    await ensureChat(u, ev);
    
    // 显示成功消息并返回首页
    alert("Event created successfully! You can find it on the home page.");
    setPage("home");
    
  } catch (error) {
    console.error('Create event failed:', error);
    alert(error.message || 'Failed to create event. Please try again.');
  }
};

  const cancelEvent = async (id) => {
  const u = currentUser;
  
  try {
    console.log('Attempting to cancel event:', id);
    
    // 调用后端API
    await ApiService.deleteEvent(id);
    console.log('Cancel event successful');
    
    // 更新本地状态
    setEvents((list) => list.filter((x) => !(x.id === id && x.host.user === u)));
    setJoinedMap((jm) => { 
      const copy = Object.fromEntries(Object.entries(jm).map(([k, v]) => [k, v.filter((x) => x !== id)])); 
      return copy; 
    });
    setSavedMap((sm) => { 
      const copy = Object.fromEntries(Object.entries(sm).map(([k, v]) => [k, v.filter((x) => x !== id)])); 
      return copy; 
    });
    setChats((cm) => { 
      const copy = Object.fromEntries(Object.entries(cm).map(([k, arr]) => [k, arr.filter((c) => c.eid !== id)])); 
      return copy; 
    });
    setPmap((pm) => { const { [id]: _, ...rest } = pm; return rest; });
    
    alert("Cancelled. Participants will be notified.");
    
  } catch (error) {
    console.error('Cancel event failed:', error);
    alert(error.message || 'Failed to cancel event. Please try again.');
  }
};

  const leaveEvent = async (id) => {
  const u = currentUser;
  
  try {
    console.log('Attempting to leave event:', id);
    
    // 调用后端API
    await ApiService.leaveEvent(id);
    console.log('Leave event successful');
    
    // 更新本地状态
    const idx = events.findIndex((x) => x.id === id);
    if (idx !== -1) {
      setEvents((list) => { 
        const copy = [...list]; 
        copy[idx] = { ...copy[idx], joined: Math.max(1, copy[idx].joined - 1) }; 
        return copy; 
      });
    }
    
    setJoinedMap((jm) => ({ ...jm, [u]: (jm[u] || []).filter((x) => x !== id) }));
    setPmap((pm) => ({ ...pm, [id]: (pm[id] || []).filter((x) => x !== u) }));
    setChats((cm) => ({ ...cm, [u]: (cm[u] || []).filter((c) => c.eid !== id) }));
    
    alert("You left the event.");
    
  } catch (error) {
    console.error('Leave event failed:', error);
    alert(error.message || 'Failed to leave event. Please try again.');
  }
};

  const [activeConvIdx, setActiveConvIdx] = useState(0);
  const [chatText, setChatText] = useState("");
  
  // 当切换到messages页面时，自动加载第一个聊天室的历史记录
  useEffect(() => {
    if (page === "messages" && currentUser && chats[currentUser] && chats[currentUser].length > 0) {
      // 如果第一个聊天室还没有加载消息，则自动加载
      const firstChat = chats[currentUser][0];
      if (firstChat && (!firstChat.msgs || firstChat.msgs.length === 0)) {
        loadChatHistory(0);
      }
    }
  }, [page, currentUser, chats]);
  
  const loadChatHistory = async (index) => {
    setActiveConvIdx(index);
    
    const u = currentUser;
    if (!u) return;
    
    const currentChat = chats[u]?.[index];
    if (!currentChat) return;
    
    // 如果已经加载过消息，直接返回
    if (currentChat.msgs && currentChat.msgs.length > 0) return;
    
    try {
      const response = await ApiService.getChatHistory(currentChat.eid);
      const messages = response.messages || [];
      
      setChats((all) => {
        const arr = all[u] || [];
        if (arr[index]) {
          const updated = [...arr];
          updated[index] = {
            ...updated[index],
            msgs: messages.map(msg => ({
              self: msg.sender_id === getCurrentUserId(),
              text: msg.content,
              time: new Date(msg.created_at).toLocaleTimeString(),
              sender: msg.sender?.username || 'Unknown'
            }))
          };
          return { ...all, [u]: updated };
        }
        return all;
      });
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };
  const sendMsg = async () => {
  const u = currentUser;
  if (!u) { setAuthMode("signin"); setModals((m) => ({ ...m, auth: true })); return; }
  
  const text = chatText.trim();
  if (!text) return;
  
  const currentChat = chats[u]?.[activeConvIdx];
  if (!currentChat) return;
  
  try {
    console.log('Attempting to send message:', { eventId: currentChat.eid, message: text });
    
    // 调用后端API
    await ApiService.sendMessage(currentChat.eid, text);
    console.log('Send message successful');
    
    // 更新本地状态
    setChats((all) => {
      const mine = all[u] || [];
      if (!mine[activeConvIdx]) return all;
      const updated = [...mine];
      updated[activeConvIdx] = { 
        ...updated[activeConvIdx], 
        msgs: [...updated[activeConvIdx].msgs, { 
          self: true, 
          text, 
          time: new Date().toLocaleTimeString() 
        }] 
      };
      return { ...all, [u]: updated };
    });
    
    setChatText("");
    
  } catch (error) {
    console.error('Send message failed:', error);
    alert(error.message || 'Failed to send message. Please try again.');
  }
};

  
  const sendAI = async () => {
  const q = aiInput.trim();
  if (!q) return;
  
  // Add user message
  setAiMsgs((msgs) => [...msgs, { self: true, text: q, time: new Date().toLocaleTimeString() }]);
  setAiInput("");
  
  try {
    // Call the real AI API
    const response = await ApiService.sendAIMessage(q);
    
    // Add AI response
    setTimeout(() => {
      setAiMsgs((msgs) => [...msgs, { 
        self: false, 
        text: response.message, 
        time: new Date().toLocaleTimeString() 
      }]);
    }, 250);
  } catch (error) {
    console.error('AI API Error:', error);
    // If API call fails, show error message
    setTimeout(() => {
      setAiMsgs((msgs) => [...msgs, { 
        self: false, 
        text: "Sorry, AI service is temporarily unavailable. Please try again later.", 
        time: new Date().toLocaleTimeString() 
      }]);
    }, 250);
  }
};

  const me = users[currentUser] || { nick: "Guest", avatar: "", bio: "" };
  const myHosted = events.filter((e) => e.host.user === currentUser);
  const myJoined = events.filter((e) => (joinedMap[currentUser] || []).includes(e.id));
  const mySaved = events.filter((e) => (savedMap[currentUser] || []).includes(e.id));

  const Pill = ({ children, active, onClick }) => (<span className={"pill" + (active ? " active" : "")} onClick={onClick}>{children}</span>);

  const openDetailFn = (id) => { setActiveEventId(id); nav("detail"); };
  const HomeCard = ({ e }) => {
    const urgent = soonTag(e.time);
    return (
      <div className="card" data-id={e.id} onClick={(ev) => { if (!(ev.target.closest("button"))) openDetailFn(e.id); }}>
        <div style={{ position: "relative" }}>
          <img className="img" src={e.img} alt="Restaurant" />
          {e.isNew && <span className="new">New</span>}
        </div>
        <div className="body">
          {urgent && <div className="urgency">⏰ {urgent}</div>}
          <div className="row"><h3 style={{ margin: 0, fontSize: 16 }}>{e.title}</h3></div>
          <div className="meta">
            <div>💰 ¥{e.budget} / person</div>
            <div>👤 {e.joined}/{e.cap} ppl</div>
            <div>⏰ {e.time}</div>
            <div>📍 {(e.place || "").split("·")[0]}</div>
          </div>
          <div className="host"><div className="avatar">{(e.host.name || "FB").slice(0, 2).toUpperCase()}</div><span>{e.host.name}</span></div>
          <div className="row">
            <button className="btn ghost" onClick={() => openDetailFn(e.id)}>View</button>
            <button className="btn" onClick={() => { openDetailFn(e.id); tryJoin(); }}>Join</button>
          </div>
        </div>
      </div>
    );
  };

  const Participants = ({ e }) => {
    const pm = pmap[e.id] || [e.host.user];
    const list = [e.host.user, ...(pm.filter((x) => x !== e.host.user))];
    const filled = list.length;
    return (
      <div className="participants">
        {list.map((uid, i) => {
          const name = users[uid]?.nick || users[uid]?.username || uid;
          const initials = (name || "?").slice(0, 2).toUpperCase();
          const isHost = uid === e.host.user;
          return <div className="p" key={uid + i}><div className="avatar" style={{ border: isHost ? "2px solid var(--ok)" : "none" }}>{initials}</div><div className="p-name">{name.split(" ")[0] || name}</div></div>;
        })}
        {Array.from({ length: e.cap - filled }).map((_, i) => <div className="p" key={"open" + i}><div className="avatar">?</div><div className="p-name">Open</div></div>)}
      </div>
    );
  };

  const [authForm, setAuthForm] = useState({ user: "", pass: "", pass2: "", email: "", full: "" });
  const openAuth = (mode) => { setAuthMode(mode); setAuthErr(""); setModals((m) => ({ ...m, auth: true })); };
  const submitAuth = async () => {
  if (authMode === "signup") {
    const { user, pass, pass2, email, full } = authForm;
    if (!user || !pass || !pass2 || !email) { setAuthErr("Please fill all required fields"); return; }
    if (pass !== pass2) { setAuthErr("Passwords do not match"); return; }
    if (users[user]) { setAuthErr("Username already exists"); return; }
    
    try {
      console.log('Attempting registration with:', { username: user, email, password: pass });
      
      // 调用后端注册API
      const response = await ApiService.register({
        username: user,
        email: email,
        password: pass
      });
      
      console.log('Registration successful:', response);
      
      // 注册成功后，后端已经返回了token，直接使用
      // 更新本地用户状态
      const nu = { ...users, [user]: { 
        pass, 
        nick: response.user?.username || full || user, 
        email: response.user?.email || email, 
        avatar: response.user?.avatar || "", 
        bio: response.user?.bio || "" 
      } };
      setUsers(nu);
      await doLogin(user);
      setModals((m) => ({ ...m, auth: false }));
      setAuthForm({ user: "", pass: "", pass2: "", email: "", full: "" });
      setAuthErr("");
      
    } catch (error) {
      console.error('Registration failed:', error);
      setAuthErr(error.message || 'Registration failed. Please try again.');
    }
  } else {
    // 登录逻辑
    const { user, pass } = authForm;
    if (!user || !pass) { setAuthErr("Please enter your credentials"); return; }
    
    try {
      // 如果输入的是邮箱，直接使用；如果是用户名，需要转换为邮箱
      let emailToUse = user;
      let usernameToUse = user;
      
      if (!user.includes("@")) {
        // 如果输入的是用户名，从本地用户数据中找到对应的邮箱
        const userData = users[user];
        if (userData && userData.email) {
          emailToUse = userData.email;
          usernameToUse = user;
        } else {
          // 如果本地没有找到，尝试直接用用户名登录（可能是新用户）
          emailToUse = user;
          usernameToUse = user;
        }
      } else {
        // 如果输入的是邮箱，尝试从本地数据中找到对应的用户名
        const foundUser = Object.keys(users).find(username => users[username]?.email === user);
        if (foundUser) {
          usernameToUse = foundUser;
        } else {
          usernameToUse = user.split('@')[0]; // 使用邮箱前缀作为用户名
        }
      }
      
      const response = await ApiService.login({
        email: emailToUse,
        password: pass
      });
      
      console.log('Login successful:', response);
      
      // 更新本地用户数据
      if (response.user) {
        const nu = { ...users };
        nu[usernameToUse] = {
          pass,
          nick: response.user.username || usernameToUse,
          email: response.user.email || emailToUse,
          avatar: response.user.avatar || "",
          bio: response.user.bio || ""
        };
        setUsers(nu);
      }
      
      await doLogin(usernameToUse);
      setModals((m) => ({ ...m, auth: false }));
      setAuthForm({ user: "", pass: "", pass2: "", email: "", full: "" });
      setAuthErr("");
      
    } catch (error) {
      console.error('Login failed:', error);
      setAuthErr(error.message || 'Login failed. Please try again.');
    }
  }
};

  const [edit, setEdit] = useState({ nick: "", avatar: "", bio: "" });
  const openEdit = () => { if (!currentUser) { openAuth("signin"); return; } const me = users[currentUser] || { nick: currentUser, avatar: "", bio: "" }; setEdit({ nick: me.nick || currentUser, avatar: me.avatar || "", bio: me.bio || "" }); setModals((m) => ({ ...m, edit: true })); };
  const saveEdit = () => { if (!currentUser) { setModals((m) => ({ ...m, edit: false })); return; } const copy = { ...users }; copy[currentUser] = copy[currentUser] || {}; copy[currentUser].nick = edit.nick || currentUser; copy[currentUser].avatar = edit.avatar || ""; copy[currentUser].bio = edit.bio || ""; setUsers(copy); setModals((m) => ({ ...m, edit: false })); };

  useEffect(() => { const style = document.createElement("style"); style.textContent = CSS_TEXT; document.head.appendChild(style); return () => { document.head.removeChild(style); }; }, []);

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand"><i className="fa-solid fa-utensils logo"></i><h1>Food Buddy</h1></div>
        {page === "home" ? (
          <div className="search">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search cuisine or location…" />
            <button className="btn ghost" onClick={() => setModals((m) => ({ ...m, filter: true }))}><i className="fa-solid fa-sliders"></i> Filter</button>
          </div>
        ) : <div style={{ flex: 1 }} />}
        <div className="userbox">
          {!currentUser ? (
            <>
              <button className="pill-outline" onClick={() => openAuth("signin")}>Sign In</button>
              <button className="pill-solid" onClick={() => openAuth("signup")}>Sign Up</button>
            </>
          ) : (
            <div className="menu" ref={menuRef} style={{ position: "relative" }}>
              <button
                className="userchip"
                onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <div className="avatar">{(users[currentUser]?.nick || currentUser).slice(0,2).toUpperCase()}</div>
                <span style={{ fontWeight: 600 }}>{users[currentUser]?.nick || currentUser}</span>
                <i className={`fa-solid fa-chevron-${menuOpen ? "up" : "down"}`}></i>
              </button>

              {menuOpen && (
                <div className="dropdown-menu" role="menu">
                  <a href="#" role="menuitem" onClick={(e) => { e.preventDefault(); setMenuOpen(false); nav("profile"); }}>My Profile</a>
                  <a href="#" role="menuitem" onClick={(e) => { e.preventDefault(); setMenuOpen(false); nav("create"); }}>Create Event</a>
                  <a href="#" role="menuitem" onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    wipe(); s(K.EVENTS, SEED); migrate(); setEvents(SEED); alert("Demo data reset.");
                  }}>Reset demo data</a>
                  <a href="#" role="menuitem" className="danger" onClick={(e) => { e.preventDefault(); setMenuOpen(false); logout(); }}>Log out</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {page === "home" && (
        <section className="page active">
          <div className="filters" id="pillCats">
            {[ ["", "All"], ["Sichuan", "Sichuan"], ["Hotpot", "Hotpot"], ["Japanese", "Japanese"], ["Western", "Western"], ["Korean", "Korean"], ["Chinese", "Chinese"], ["Thai", "Thai"], ["Vietnamese", "Vietnamese"], ["BBQ", "BBQ"], ["Cafe", "Cafe"], ["Seafood", "Seafood"], ["Mexican", "Mexican"], ["Vegetarian", "Vegetarian"], ["Dessert", "Dessert"] ].map(([val, label]) => (<Pill key={val || "all"} active={(filter.cate || "") === (val || "")} onClick={() => setFilter((f) => ({ ...f, cate: val }))}>{label}</Pill>))}
          </div>
          <div className="grid">{filteredEvents.map((e) => <HomeCard key={e.id} e={e} />)}</div>
          {filteredEvents.length === 0 && (<div className="empty">No events yet. <button className="btn" onClick={() => { s(K.EVENTS, SEED); migrate(); setEvents(g(K.EVENTS, SEED)); }}>Reload events</button></div>)}
          <button className="float-btn" onClick={() => nav("create")}>+ Create</button>
        </section>
      )}

      {page === "detail" && activeEvent && (
        <section className="page active">
          <div className="detail">
            <div>
              <img className="hero" src={activeEvent.img} alt="Restaurant" />
              <h2 style={{ margin: "10px 0 0", fontWeight: 800 }}>{activeEvent.title}</h2>
              <div className="meta2">
                <div className="i"><div className="ico"><i className="fa-solid fa-location-dot"></i></div><div><div style={{ fontWeight: 600 }}>Location</div><div>{activeEvent.place}</div></div></div>
                <div className="i"><div className="ico"><i className="fa-solid fa-clock"></i></div><div><div style={{ fontWeight: 600 }}>Date & Time</div><div>{activeEvent.time}</div></div></div>
                <div className="i"><div className="ico"><i className="fa-solid fa-user-group"></i></div><div><div style={{ fontWeight: 600 }}>Participants</div><div>{detailParticipants.length}/{activeEvent.cap} spots filled</div></div></div>
                <div className="i"><div className="ico"><i className="fa-solid fa-dollar-sign"></i></div><div><div style={{ fontWeight: 600 }}>Estimated Cost</div><div>¥{activeEvent.budget} per person</div></div></div>
              </div>
              <div style={{ borderTop: "1px solid var(--line)", margin: "10px 0 0" }} />
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 8px" }}>
                  <h3 style={{ margin: 0 }}>About This Event</h3>
                  <button className="btn dark" onClick={toggleSave}><i className="fa-regular fa-bookmark"></i> {(new Set(savedMap[currentUser] || [])).has(activeEvent.id) ? "Saved" : "Save"}</button>
                </div>
                <p style={{ margin: 0, color: "#333" }}>{activeEvent.desc || ""}</p>
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>{(activeEvent.tags || []).map((t, i) => <span key={i} style={{ background: "#e8f6f4", color: "#16907d", padding: "6px 10px", borderRadius: 999, fontSize: 12 }}>{t}</span>)}</div>
              </div>
              <div className="tip" style={{ marginTop: 14 }}>
                <strong>Safety Tips</strong>
                <ul style={{ margin: "8px 0 0 18px" }}>
                  <li>Meet in public places</li>
                  <li>Inform a friend about your plans</li>
                  <li>Arrange your own transportation</li>
                  <li>Trust your instincts</li>
                </ul>
              </div>
            </div>
            <div className="sidebar">
              <div className="host-card">
                <div className="avatar">{(activeEvent.host.name || "FB").slice(0, 2).toUpperCase()}</div>
                <div>
                  <h4 style={{ margin: 0 }}><span>{activeEvent.host.name}</span> <span className="verified">✅ Verified</span></h4>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>⭐ {activeEvent.host.rate || 4.8} · On-time rate {(activeEvent.host.punctual || 98) + "%"}</p>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>{activeEvent.host.tags || "#Split bill #Punctual #Friendly"}</p>
                </div>
              </div>
              <div>
                <h3 style={{ margin: "0 0 8px" }}>Participants</h3>
                <Participants e={activeEvent} />
              </div>
              <button className="join-primary" onClick={tryJoin} disabled={detailParticipants.length >= activeEvent.cap}>{detailParticipants.length >= activeEvent.cap ? "Event is full" : "Join This Event"}</button>
            </div>
          </div>
        </section>
      )}

      {page === "create" && (<CreatePage onPublish={publishEvent} onCancel={() => nav("home")} />)}

      {page === "profile" && (
        <section className="page active">
          <div className="profile-header">
            <img alt="me" src={me.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop"} />
            <div><div style={{ fontWeight: 800 }}>{me.nick || currentUser || "Guest"}</div><div className="help">⭐ 4.5</div></div>
            <div style={{ marginLeft: "auto" }}><button className="btn ghost" onClick={openEdit}>Edit Profile</button></div>
          </div>
          <div className="stats">
            <div className="stat"><div style={{ fontSize: 12, color: "var(--muted)" }}>Events Hosted</div><div style={{ fontSize: 20, fontWeight: 800 }}>{myHosted.length}</div></div>
            <div className="stat"><div style={{ fontSize: 12, color: "var(--muted)" }}>Events Joined</div><div style={{ fontSize: 20, fontWeight: 800 }}>{myJoined.length}</div></div>
          </div>
          <div className="tabs">
            {["mine", "joined", "saved"].map((k) => (<div className={"tab" + (profileTab === k ? " active" : "")} key={k} data-tab={k} onClick={() => setProfileTab(k)}>{k === "mine" ? "Hosted" : k[0].toUpperCase() + k.slice(1)}</div>))}
          </div>
          <div className="list-simple">
            {((profileTab === "mine" ? myHosted : profileTab === "joined" ? myJoined : mySaved)).map((e) => (
              <div className="list-item" key={e.id}>
                <div><div style={{ fontWeight: 600 }}>{e.title}</div><div className="help">{e.time} · {e.place}</div></div>
                <div style={{ display: "flex", gap: 8 }}>
                  {profileTab === "mine" && <button className="btn ghost" onClick={() => cancelEvent(e.id)}>Cancel</button>}
                  {profileTab === "joined" && <button className="btn ghost" onClick={() => leaveEvent(e.id)}>Leave</button>}
                  <button className="btn ghost" onClick={() => openDetail(e.id)}>View</button>
                </div>
              </div>
            ))}
            {((profileTab === "mine" ? myHosted : profileTab === "joined" ? myJoined : mySaved)).length === 0 && (<div className="help">No items yet</div>)}
          </div>
        </section>
      )}

      {page === "messages" && (
        <section className="page active">
          <div className="msg-layout">
            <div className="conv-list">
              {(chats[currentUser] || []).length === 0 ? (<div className="conv">No conversations</div>) : (
                (chats[currentUser] || []).map((c, i) => (
                  <div className={"conv " + (i === activeConvIdx ? "active" : "")} key={c.eid} onClick={() => loadChatHistory(i)}>
                    <div className="avatar">{(c.title || "FB").slice(0, 2).toUpperCase()}</div>
                    <div><div style={{ fontWeight: 600 }}>{c.title}</div><div className="help">{c.msgs.at(-1)?.text || ""}</div></div>
                  </div>
                ))
              )}
            </div>
            <div className="chat">
              <div className="body">
                {(chats[currentUser]?.[activeConvIdx]?.msgs || []).map((m, idx) => (
                  <div key={idx}>
                    {!m.self && <div className="sender-name" style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', marginLeft: '8px' }}>{m.sender || 'Unknown'}</div>}
                    <div className={"bubble " + (m.self ? "self" : "")}>
                      {m.text}
                      <div className="help">{m.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="foot">
                <input value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendMsg(); } }} placeholder="Say something…" />
                <button className="btn" onClick={sendMsg}>Send</button>
              </div>
            </div>
          </div>
          <div className="help" style={{ marginTop: 10 }}>Private chat opens only if you both joined the same event; group chat closes 48h after the event.</div>
        </section>
      )}

      {page === "ai" && (
        <section className="page active">
          <div className="ai-wrap">
            <div className="ai-card">
              <div className="ai-head"><i className="fa-solid fa-robot" style={{ color: "var(--primary)" }}></i><div style={{ fontWeight: 800, fontSize: 18 }}>MealBuddy AI Assistant</div><span className="badge">Beta</span></div>
              <div className="ai-chat">
                <div className="body">{aiMsgs.map((m, i) => <div className={"bubble " + (m.self ? "self" : "")} key={i}>{m.text}<div className="help">{m.time}</div></div>)}</div>
                <div className="foot">
                  <input value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendAI(); } }} placeholder="Ask a question…" />
                  <button className="btn" onClick={sendAI}>Send</button>
                </div>
              </div>
            </div>
            <div className="ai-side">
              <div className="ai-card">
                <div className="ai-head"><i className="fa-regular fa-circle-question" style={{ color: "var(--primary)" }}></i><div style={{ fontWeight: 800 }}>Common Questions</div></div>
                <div>
                  {["What is Japanese cuisine?","Which cuisines are most popular in the U.S.?","Recommend a few restaurants near me","What should I pay attention to when dining with new people?","How do I choose a good time for dinner?"].map((q) => (<span key={q} className="chip" onClick={() => { setAiInput(q); setTimeout(sendAI, 0); }}><i className="fa-regular fa-message"></i>{q}</span>))}
                </div>
              </div>
              <div className="ai-card" style={{ marginTop: 16 }}>
                <div className="ai-head"><i className="fa-solid fa-hand-holding-heart" style={{ color: "var(--primary)" }}></i><div style={{ fontWeight: 800 }}>How we can help</div></div>
                <div className="list-help">
                  {[["fa-solid fa-location-dot","Restaurant recommendations","Tell us your location and cuisine preference."],["fa-solid fa-people-group","Plan a meetup","We can draft the event title and description."],["fa-solid fa-scale-balanced","Dining etiquette tips","Cultural notes for group meals."],["fa-solid fa-wallet","Budget-friendly options","Great food that won’t break the bank."],["fa-solid fa-shield-heart","Safety tips","Stay safe when meeting new people."]].map(([ico,t,d]) => (
                    <div className="item" key={t} onClick={() => { setAiInput(t); setTimeout(sendAI,0); }}><i className={ico} style={{ color: "var(--primary)" }}></i><div><div style={{ fontWeight: 600 }}>{t}</div><div className="help">{d}</div></div></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <nav className="tabbar">
        {["home","create","profile","messages","ai"].map((k) => (
          <button key={k} className={page===k?"active":""} onClick={() => nav(k)}>
            <i className={k==="home"?"fa-solid fa-house":k==="create"?"fa-solid fa-plus":k==="profile"?"fa-solid fa-user":k==="messages"?"fa-solid fa-message":"fa-solid fa-robot"}></i><br/>{k[0].toUpperCase()+k.slice(1)}
          </button>
        ))}
      </nav>

      {modals.filter && (
        <div className="modal show" onClick={(e) => { if (e.target.classList.contains("modal")) setModals((m)=>({...m,filter:false})); }}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h3>Filter</h3>
            <div className="inline">
              <div className="field"><label>Budget cap (¥)</label><input type="number" placeholder="e.g. 100" onChange={(e) => setFilter((f) => ({ ...f, maxBudget: e.target.value ? Number(e.target.value) : Infinity }))} /></div>
              <div className="field"><label>Cuisine</label><input placeholder="Sichuan/Hotpot/Japanese/Korean/Thai…" onChange={(e) => setFilter((f) => ({ ...f, cate: e.target.value.trim() || f.cate }))} /></div>
            </div>
            <div className="field">
              <label>Time Range</label>
              <select onChange={(e) => setFilter((f) => ({ ...f, hours: e.target.value ? Number(e.target.value) : null }))}>
                <option value="">Any time</option>
                <option value="1">Next 1 hour</option>
                <option value="3">Next 3 hours</option>
                <option value="6">Next 6 hours</option>
                <option value="12">Next 12 hours</option>
                <option value="24">Next 24 hours</option>
              </select>
              <div className="help">Show events happening within the next X hours from now.</div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
              <button className="btn ghost" onClick={() => setModals((m) => ({ ...m, filter: false }))}>Cancel</button>
              <button className="btn" onClick={() => setModals((m) => ({ ...m, filter: false }))}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {modals.auth && (
        <div className="modal show" onClick={(e) => { if (e.target.classList.contains("modal")) setModals((m)=>({...m,auth:false})); }}>
          <div className="sheet-auth" onClick={(e)=>e.stopPropagation()}>
            <h2>{authMode === "signup" ? "Create Account" : "Welcome Back"}</h2>
            <p className="sub">{authMode === "signup" ? "Join our foodie community" : "Sign in to find your next meal companion"}</p>
            <div className="auth-row">
              {authMode === "signup" ? (
                <>
                  <div className="field"><label>Full Name</label><input value={authForm.full} onChange={(e)=>setAuthForm((f)=>({...f,full:e.target.value}))} placeholder="Your name" /></div>
                  <div className="field"><label>Email Address</label><input value={authForm.email} onChange={(e)=>setAuthForm((f)=>({...f,email:e.target.value}))} placeholder="you@example.com" /></div>
                  <div className="field"><label>Password</label><input type="password" value={authForm.pass} onChange={(e)=>setAuthForm((f)=>({...f,pass:e.target.value}))} placeholder="Enter password" /></div>
                  <div className="field"><label>Confirm Password</label><input type="password" value={authForm.pass2} onChange={(e)=>setAuthForm((f)=>({...f,pass2:e.target.value}))} placeholder="Re-enter password" /></div>
                  <div className="field"><label>Username</label><input value={authForm.user} onChange={(e)=>setAuthForm((f)=>({...f,user:e.target.value}))} placeholder="username" /></div>
                </>
              ) : (
                <>
                  <div className="field"><label>Email or Username</label><input value={authForm.user} onChange={(e)=>setAuthForm((f)=>({...f,user:e.target.value}))} placeholder="Enter email or username" /></div>
                  <div className="field"><label>Password</label><input type="password" value={authForm.pass} onChange={(e)=>setAuthForm((f)=>({...f,pass:e.target.value}))} placeholder="Enter your password" /></div>
                  <div className="help"><label><input type="checkbox" /> Remember me</label> <a href="#" style={{ float: "right", color: "var(--primary)" }}>Forgot password?</a></div>
                </>
              )}
            </div>
            <div className="auth-actions">
              <div />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn ghost" onClick={() => setModals((m) => ({ ...m, auth: false }))}>Cancel</button>
                <button className="btn" onClick={submitAuth}>{authMode === "signup" ? "Create Account" : "Sign In"}</button>
              </div>
            </div>
            <div className="auth-alt">
              {authMode === "signup" ? <>Already have an account? <a href="#" onClick={(e)=>{ e.preventDefault(); setAuthMode("signin"); }}>Sign In</a></>
                : <>Don't have an account? <a href="#" onClick={(e)=>{ e.preventDefault(); setAuthMode("signup"); }}>Sign Up</a></>}
            </div>
            <div className="help danger">{authErr}</div>
          </div>
        </div>
      )}

      {modals.edit && (
        <div className="modal show" onClick={(e) => { if (e.target.classList.contains("modal")) setModals((m)=>({...m,edit:false})); }}>
          <div className="sheet" onClick={(e)=>e.stopPropagation()}>
            <h3>Edit Profile</h3>
            <div className="field"><label>Display name</label><input value={edit.nick} onChange={(e)=>setEdit((x)=>({...x,nick:e.target.value}))} /></div>
            <div className="field"><label>Avatar URL</label><input value={edit.avatar} onChange={(e)=>setEdit((x)=>({...x,avatar:e.target.value}))} /></div>
            <div className="field"><label>Bio</label><textarea rows={3} value={edit.bio} onChange={(e)=>setEdit((x)=>({...x,bio:e.target.value}))}></textarea></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn ghost" onClick={() => setModals((m) => ({ ...m, edit: false }))}>Cancel</button>
              <button className="btn" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      <footer>
        <div className="foot-wrap">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="fa-solid fa-utensils" style={{ color: "var(--primary)" }}></i><strong>Food Buddy</strong></div>
          <div className="foot-links"><a href="#">About</a><a href="#">Safety</a><a href="#">Help Center</a><a href="#">Terms</a><a href="#">Privacy</a></div>
          <div>© {new Date().getFullYear()} Food Buddy. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

function CreatePage({ onPublish, onCancel }) {
  const [place, setPlace] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("19:00");
  const [cap, setCap] = useState(4);
  const [budget, setBudget] = useState("");
  const [cate, setCate] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const canPublish = place && date && time && budget;
  const submit = (e) => { e.preventDefault(); if (!canPublish) return; onPublish({ place, date, time, cap, budget, cate, title, desc }); };

  return (
    <section className="page active">
      <h2 style={{ margin: "0 0 6px", fontWeight: 800 }}>Create a New Event</h2>
      <form onSubmit={submit}>
        <div className="field"><label>Restaurant / Address</label><input value={place} onChange={(e)=>setPlace(e.target.value)} placeholder="Enter restaurant name or address…" required /></div>
        <div className="inline">
          <div className="field"><label>Date</label><input type="date" value={date} onChange={(e)=>setDate(e.target.value)} required /></div>
          <div className="field"><label>Time</label><input type="time" value={time} onChange={(e)=>setTime(e.target.value)} required /></div>
        </div>
        <div className="inline">
          <div className="field"><label>Capacity (including you)</label><select value={cap} onChange={(e)=>setCap(Number(e.target.value))}>{[2,4,6,8].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
          <div className="field"><label>Budget per person (¥)</label><input type="number" value={budget} onChange={(e)=>setBudget(e.target.value)} min={1} placeholder="e.g. 80" required /></div>
        </div>
        <div className="field"><label>Cuisine (optional)</label><input value={cate} onChange={(e)=>setCate(e.target.value)} placeholder="Sichuan / Hotpot / Japanese / Western / Korean / Chinese / Thai / Vietnamese / BBQ / Cafe / Seafood / Mexican / Vegetarian / Dessert" /></div>
        <div className="field"><label>Title</label><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Tonight 7 PM｜×× Restaurant Dinner" /></div>
        <div className="field"><label>Description</label><textarea rows={3} value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="This place is awesome! Looking for spicy lovers~"></textarea></div>
        <div className="help">Budget and time are required; conflicts with your other events will be flagged.</div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button className="btn" type="submit" disabled={!canPublish}>Publish</button>
          <button className="btn ghost" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}

const CSS_TEXT = `:root{--primary:#FF6B6B;--primary-weak:#ffe1e1;--bg:#FFF9F7;--text:#222;--muted:#667085;--line:#eee;--ok:#22c55e;--warn:#ef4444;--new:#10b981;--pad:24px;--radius:16px;--shadow:0 10px 30px rgba(255,107,107,.18);--maxw:1200px;}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;line-height:1.6;display:flex;justify-content:center}.app{width:100%;max-width:var(--maxw);background:#fff;min-height:100dvh;position:relative}.topbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px var(--pad);border-bottom:1px solid var(--line);background:#fff}.brand{display:flex;align-items:center;gap:10px}.brand .logo{color:var(--primary);font-size:22px}.brand h1{font-size:22px;font-weight:800;color:var(--primary);margin:0}.search{flex:1;display:flex;gap:8px;max-width:520px}.search input{flex:1;padding:10px 12px;border:1px solid var(--line);border-radius:999px}.btn{border:none;background:var(--primary);color:#fff;padding:10px 16px;border-radius:12px;font-weight:700;cursor:pointer}.btn.ghost{background:#fff;color:var(--text);border:1px solid var(--line)}.pill-outline{background:transparent;color:var(--primary);border:2px solid var(--primary);padding:8px 18px;border-radius:999px;font-weight:700}.pill-solid{background:var(--primary);color:#fff;border:2px solid var(--primary);padding:8px 18px;border-radius:999px;font-weight:700}.userbox{display:flex;gap:12px;align-items:center}.avatar{width:28px;height:28px;border-radius:50%;background:var(--primary-weak);color:var(--primary);display:grid;place-items:center;font-weight:800}.page{padding:16px var(--pad) 110px}.filters{display:flex;gap:8px;margin:8px 0 12px;flex-wrap:wrap}.pill{padding:6px 12px;border:1px solid var(--line);border-radius:999px;font-size:12px;color:var(--muted);cursor:pointer}.pill.active{color:var(--primary);border-color:#ffc7c7;background:#fff3f3}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}.card{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.05);display:flex;flex-direction:column}.card .img{width:100%;aspect-ratio:4/3;object-fit:cover}.card .body{padding:12px;display:flex;flex-direction:column;min-height:220px}.urgency{font-size:12px;color:var(--warn);background:#fff1f1;border:1px solid #ffdede;width:max-content;padding:2px 8px;border-radius:999px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;color:var(--muted)}.host{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted)}.host .avatar{border:2px solid var(--ok)}.row{display:flex;justify-content:space-between;align-items:center}.new{position:absolute;top:10px;right:10px;background:var(--new);color:#fff;padding:2px 6px;font-size:11px;border-radius:6px}.float-btn{position:fixed;right:calc((100vw - var(--maxw))/2 + 20px);bottom:92px;background:var(--primary);color:#fff;font-weight:800;padding:14px 18px;border-radius:999px;border:none;box-shadow:var(--shadow);cursor:pointer;z-index:6}.empty{border:1px dashed var(--line);background:#fffdfc;padding:20px;border-radius:12px;text-align:center;color:var(--muted)}.detail{display:grid;grid-template-columns:1.4fr .8fr;gap:16px}@media (max-width:860px){.detail{grid-template-columns:1fr}}.hero{width:100%;height:260px;object-fit:cover;border-radius:18px}.meta2{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin:10px 0}@media (max-width:860px){.meta2{grid-template-columns:1fr 1fr}}.i{background:#fffdf8;padding:12px;border:1px solid #f4e9dd;border-radius:12px;font-size:14px;display:flex;align-items:center;gap:8px}.i .ico{width:28px;height:28px;display:grid;place-items:center;background:#fff2ef;color:var(--primary);border-radius:50%}.host-card{background:#fffdf8;border:1px solid #f4e9dd;border-radius:14px;padding:12px;display:flex;gap:12px;align-items:center}.verified{font-size:12px;background:#e8fff0;color:var(--ok);padding:2px 6px;border-radius:6px;margin-left:6px}.sidebar{display:flex;flex-direction:column;gap:14px;justify-content:space-between}.participants{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.p{display:flex;flex-direction:column;align-items:center;gap:6px}.p .avatar{width:40px;height:40px;font-weight:800}.p-name{font-size:12px;color:var(--muted)}.join-primary{background:var(--primary);border-radius:6px;color:#fff;font-weight:800;padding:6px 14px;border:none;cursor:pointer;box-shadow:var(--shadow);font-size:14px;width:auto;align-self:start}.tip{font-size:14px;color:#353d49;background:#fffdf8;border:1px solid #f4e9dd;padding:12px;border-radius:12px}form .field{margin:12px 0}.field label{display:block;font-weight:600;margin-bottom:6px}.field input,.field textarea,.field select{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;font-size:14px}.inline{display:grid;grid-template-columns:1fr 1fr;gap:12px}.help{font-size:12px;color:var(--muted)}.profile-header{display:flex;align-items:center;gap:8px}.profile-header img{width:56px;height:56px;border-radius:50%;border:2px solid var(--ok);object-fit:cover}.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:10px 0}.stat{border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center}.tabs{display:flex;gap:10px;border-bottom:1px solid var(--line);margin:12px 0}.tab{padding:8px 12px;border-radius:999px;cursor:pointer;font-size:14px}.tab.active{background:#111;color:#fff}.list-simple{display:grid;gap:10px}.list-item{padding:10px;border:1px solid var(--line);border-radius:10px;background:#fff;display:flex;justify-content:space-between;align-items:center}.msg-layout{display:grid;grid-template-columns:280px 1fr;gap:12px}@media (max-width:860px){.msg-layout{grid-template-columns:1fr}}.conv-list{border:1px solid var(--line);border-radius:12px;overflow:hidden}.conv{padding:10px 12px;border-bottom:1px solid var(--line);cursor:pointer;display:flex;gap:10px;align-items:center}.conv.active{background:#fff3f3}.conv .avatar{width:36px;height:36px}.chat{border:1px solid var(--line);border-radius:12px;display:flex;flex-direction:column;height:420px}.chat .body{flex:1;padding:12px;overflow-y:auto;display:grid;gap:8px}.bubble{max-width:80%;padding:8px 12px;border-radius:12px;background:#f3f4f6}.bubble.self{background:#ffe9e2;margin-left:auto}.chat .foot{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line)}.chat .foot input{flex:1;padding:10px 12px;border:1px solid var(--line);border-radius:10px}.tabbar{position:fixed;left:50%;transform:translateX(-50%);bottom:10px;width:calc(100% - 20px);max-width:var(--maxw);background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);display:grid;grid-template-columns:repeat(5,1fr);z-index:10}.tabbar button{background:transparent;border:none;padding:10px 4px;font-size:12px;color:var(--muted);cursor:pointer}.tabbar button.active{color:var(--primary);font-weight:800}.modal{position:fixed;inset:0;display:grid;place-items:center;background:rgba(255,107,107,.06);z-index:30}.sheet-auth{width:min(92vw,560px);background:#fff;border-radius:24px;padding:28px;box-shadow:0 30px 80px rgba(255,107,107,.25);border:1px solid #ffe3e3}.sheet-auth h2{font-size:32px;margin:0;font-weight:800}.sheet-auth p.sub{margin:6px 0 16px;color:var(--muted)}.auth-row{display:grid;gap:12px;margin-top:12px}.auth-actions{display:flex;align-items:center;justify-content:space-between;margin-top:10px}.auth-alt{text-align:center;color:var(--muted);margin-top:12px}.sheet{width:min(92vw,560px);background:#fff;border-radius:16px;padding:16px;box-shadow:0 30px 80px rgba(0,0,0,.06)}.danger{color:#b91c1c}footer{border-top:1px solid var(--line);padding:16px var(--pad);color:var(--muted);background:#fff}.foot-wrap{max-width:var(--maxw);margin:0 auto;display:flex;align-items:center;gap:16px;justify-content:space-between;flex-wrap:wrap}.foot-links{display:flex;gap:14px}.ai-wrap{display:grid;grid-template-columns:1fr 300px;gap:16px}@media (max-width:900px){.ai-wrap{grid-template-columns:1fr}}.ai-card{border:1px solid var(--line);border-radius:16px;padding:12px;background:#fff}.ai-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}.ai-head .badge{background:#fff3f3;color:var(--primary);font-weight:700;border-radius:999px;padding:4px 10px}.ai-chat{border:1px solid var(--line);border-radius:12px;display:flex;flex-direction:column;height:520px}.ai-chat .body{flex:1;padding:12px;overflow-y:auto;display:grid;gap:10px}.ai-chat .foot{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line)}.chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:6px 10px;font-size:12px;margin:4px 6px 0 0;cursor:pointer}.list-help{display:grid;gap:8px}.list-help .item{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--line);border-radius:12px}
.menu .userchip{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 10px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.04)}
.menu .userchip i{font-size:12px;color:var(--muted)}
.dropdown-menu{position:absolute;top:calc(100% + 8px);right:0;width:220px;background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.08);overflow:hidden;z-index:20}
.dropdown-menu a{display:block;padding:12px 16px;text-decoration:none;color:var(--text)}
.dropdown-menu a:hover{background:#f6f6f6}
.dropdown-menu a.danger{color:#b91c1c;font-weight:700}`;