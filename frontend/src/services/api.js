const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      
      if (response.status === 401) {
        this.clearAuth();
        throw new Error('Authentication required');
      }
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}` };
        }
        
        // Create error with response data attached
        const error = new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        error.response = {
          data: errorData,
          status: response.status
        };
        throw error;
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // 认证相关API
  async login(credentials) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearAuth();
    }
  }

  // 用户相关API
  async getUserProfile() {
    return this.request('/api/users/profile');
  }

  async updateUserProfile(profileData) {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // 活动相关API
  async getEvents(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    return this.request(`/api/events${queryString ? `?${queryString}` : ''}`);
  }

  async getEvent(eventId) {
    return this.request(`/api/events/${eventId}`);
  }

  async createEvent(eventData) {
    return this.request('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(eventId, eventData) {
    return this.request(`/api/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(eventId) {
    return this.request(`/api/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async joinEvent(eventId) {
    return this.request(`/api/events/${eventId}/join`, {
      method: 'POST',
    });
  }

  async leaveEvent(eventId) {
    return this.request(`/api/events/${eventId}/leave`, {
      method: 'DELETE',
    });
  }

  async saveEvent(eventId) {
    return this.request(`/api/events/${eventId}/save`, {
      method: 'POST',
    });
  }

  async unsaveEvent(eventId) {
    return this.request(`/api/events/${eventId}/unsave`, {
      method: 'DELETE',
    });
  }

  async getSavedEvents() {
    return this.request('/api/events/saved');
  }

  // 聊天相关API
  async getChatConversations() {
    return this.request('/api/chat/conversations');
  }

  async getChatHistory(eventId) {
    return this.request(`/api/chat/${eventId}`);
  }

  async sendMessage(eventId, message) {
    return this.request(`/api/chat/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({ 
        message: message
      }),
    });
  }

  // AI相关API
  async sendAIMessage(message) {
    return this.request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // 文件上传API
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.request('/api/upload/avatar', {
      method: 'POST',
      body: formData,
      headers: {}, // 让浏览器自动设置Content-Type
    });
  }

  async uploadEventImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    return this.request('/api/upload/event', {
      method: 'POST',
      body: formData,
      headers: {}, // 让浏览器自动设置Content-Type
    });
  }
}

export default new ApiService();