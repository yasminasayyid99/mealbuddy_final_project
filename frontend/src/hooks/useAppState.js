import { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/api';

export const useAppState = () => {
  // 基础状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState('home');
  
  // 用户状态
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return {
      isAuthenticated: !!token,
      user: user ? JSON.parse(user) : null,
      token
    };
  });
  
  // 数据状态
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [chats, setChats] = useState([]);
  const [aiMessages, setAiMessages] = useState([
    { 
      self: false, 
      text: "Hi! I'm your AI buddy. Ask me anything about food, restaurants, or planning a meetup.", 
      time: new Date().toLocaleTimeString() 
    }
  ]);
  
  // 过滤和搜索状态
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState({ 
    cate: '', 
    maxBudget: Infinity, 
    hours: null 
  });
  
  // 模态框状态
  const [modals, setModals] = useState({ 
    filter: false, 
    auth: false, 
    edit: false 
  });
  const [authMode, setAuthMode] = useState('signin');
  const [authError, setAuthError] = useState('');
  
  // 错误处理
  const handleError = useCallback((error, context = '') => {
    console.error(`Error in ${context}:`, error);
    setError(error.message || 'An unexpected error occurred');
    setLoading(false);
  }, []);
  
  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // 认证相关操作
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setAuthError('');
    try {
      const response = await ApiService.login(credentials);
      setSession({
        isAuthenticated: true,
        user: response.user,
        token: response.token
      });
      setModals(prev => ({ ...prev, auth: false }));
      return response;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const register = useCallback(async (userData) => {
    setLoading(true);
    setAuthError('');
    try {
      const response = await ApiService.register(userData);
      setSession({
        isAuthenticated: true,
        user: response.user,
        token: response.token
      });
      setModals(prev => ({ ...prev, auth: false }));
      return response;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setSession({
        isAuthenticated: false,
        user: null,
        token: null
      });
      setEvents([]);
      setJoinedEvents([]);
      setSavedEvents([]);
      setChats([]);
      setLoading(false);
    }
  }, []);
  
  // 活动相关操作
  const loadEvents = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const response = await ApiService.getEvents(filters);
      const eventsData = response.events || response; // 处理可能的分页响应
      
      // 转换后端数据格式为前端期望的格式
      const transformedEvents = eventsData.map(event => ({
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
      }));
      
      setEvents(transformedEvents);
    } catch (error) {
      handleError(error, 'loadEvents');
    } finally {
      setLoading(false);
    }
  }, [handleError]);
  
  const createEvent = useCallback(async (eventData) => {
    setLoading(true);
    try {
      const newEvent = await ApiService.createEvent(eventData);
      setEvents(prev => [newEvent, ...prev]);
      setActiveEvent(newEvent);
      setPage('detail');
      return newEvent;
    } catch (error) {
      handleError(error, 'createEvent');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);
  
  const joinEvent = useCallback(async (eventId) => {
    if (!session.isAuthenticated) {
      setAuthMode('signin');
      setModals(prev => ({ ...prev, auth: true }));
      return;
    }
    
    setLoading(true);
    try {
      await ApiService.joinEvent(eventId);
      // 重新加载活动数据
      await loadEvents();
      setJoinedEvents(prev => [...prev, eventId]);
    } catch (error) {
      handleError(error, 'joinEvent');
    } finally {
      setLoading(false);
    }
  }, [session.isAuthenticated, loadEvents, handleError]);
  
  const leaveEvent = useCallback(async (eventId) => {
    setLoading(true);
    try {
      await ApiService.leaveEvent(eventId);
      await loadEvents();
      setJoinedEvents(prev => prev.filter(id => id !== eventId));
    } catch (error) {
      handleError(error, 'leaveEvent');
    } finally {
      setLoading(false);
    }
  }, [loadEvents, handleError]);
  
  // AI聊天操作
  const sendAIMessage = useCallback(async (message) => {
    const userMessage = {
      self: true,
      text: message,
      time: new Date().toLocaleTimeString()
    };
    
    setAiMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await ApiService.sendAIMessage(message);
      const aiMessage = {
        self: false,
        text: response.message,
        time: new Date().toLocaleTimeString()
      };
      setAiMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        self: false,
        text: 'Sorry, I encountered an error. Please try again.',
        time: new Date().toLocaleTimeString()
      };
      setAiMessages(prev => [...prev, errorMessage]);
      handleError(error, 'sendAIMessage');
    }
  }, [handleError]);
  
  // 初始化数据加载
  useEffect(() => {
    if (session.isAuthenticated) {
      loadEvents();
    }
  }, [session.isAuthenticated, loadEvents]);
  
  return {
    // 状态
    loading,
    error,
    page,
    session,
    events,
    activeEvent,
    joinedEvents,
    savedEvents,
    chats,
    aiMessages,
    keyword,
    filter,
    modals,
    authMode,
    authError,
    
    // 操作
    setPage,
    setActiveEvent,
    setKeyword,
    setFilter,
    setModals,
    setAuthMode,
    clearError,
    
    // 认证操作
    login,
    register,
    logout,
    
    // 活动操作
    loadEvents,
    createEvent,
    joinEvent,
    leaveEvent,
    
    // AI操作
    sendAIMessage
  };
};