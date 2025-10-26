import { defineStore } from 'pinia'
import { authAPI } from '../api/services'

interface User {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
}

interface UserState {
  user: User | null
  isLoggedIn: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    isLoggedIn: false
  }),
  
  getters: {
    userInfo: (state) => state.user,
    isAdmin: (state) => state.user?.role === 'admin'
  },
  
  actions: {
    // 登录
    async login(credentials: { username: string; password: string }) {
      console.log('=== Store登录方法开始 ===');
      console.log('接收到的登录凭据:', credentials);
      
      try {
        console.log('开始调用authAPI.login');
        const response = await authAPI.login(credentials);
        console.log('authAPI.login响应:', response);
        console.log('响应状态:', response.status);
        console.log('响应数据:', response.data);
        
        const { user } = response;
        console.log('解析出的user:', user);
        
        this.user = user;
        this.isLoggedIn = true;
        
        console.log('=== Store登录成功 ===');
        return { success: true };
      } catch (error: any) {
        console.error('=== Store登录失败 ===');
        console.error('错误对象:', error);
        console.error('错误响应:', error.response);
        console.error('错误状态码:', error.response?.status);
        console.error('错误数据:', error.response?.data);
        
        return { 
          success: false, 
          message: error.response?.data?.message || '登录失败' 
        };
      }
    },
    
    // 登出
    async logout() {
      try {
        await authAPI.logout()
      } catch (error) {
        console.error('登出请求失败:', error)
      } finally {
        this.user = null
        this.isLoggedIn = false
      }
    },
    
    // 获取用户信息
    async fetchUserInfo() {
      try {
        const response = await authAPI.getUserInfo()
        this.user = response.user
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.logout()
      }
    },
    
    // 初始化用户状态（简化版，不使用localStorage）
    initializeAuth() {
      // 用户状态仅在内存中管理，页面刷新后需要重新登录
      this.user = null
      this.isLoggedIn = false
    }
  }
})