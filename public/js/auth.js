// public/js/auth.js
// 前端认证模块 — Token 管理 + 飞书登录流程

const Auth = {
  /** 获取存储的 token */
  getToken() {
    return localStorage.getItem('lcd_token');
  },

  /** 保存 token */
  setToken(token) {
    localStorage.setItem('lcd_token', token);
  },

  /** 清除 token */
  clearToken() {
    localStorage.removeItem('lcd_token');
    localStorage.removeItem('lcd_user');
  },

  /** 获取缓存用户信息 */
  getUser() {
    try {
      const raw = localStorage.getItem('lcd_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  /** 保存用户信息 */
  setUser(user) {
    localStorage.setItem('lcd_user', JSON.stringify(user));
  },

  /** 检查是否已登录 */
  isLoggedIn() {
    return !!this.getToken();
  },

  /** 发起飞书登录 */
  login() {
    window.location.href = APP_CONFIG.API_BASE + '/auth/feishu';
  },

  /** 退出登录 */
  logout() {
    this.clearToken();
    window.location.href = '/login';
  },

  /** 校验 token 有效性，返回用户信息 */
  async checkAuth() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(APP_CONFIG.API_BASE + '/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        this.clearToken();
        return null;
      }
      const json = await res.json();
      if (json.code !== 0) {
        this.clearToken();
        return null;
      }
      this.setUser(json.data);
      return json.data;
    } catch {
      // 网络错误时使用缓存
      return this.getUser();
    }
  },

  /** 创建带认证头的 fetch */
  async fetch(url, options = {}) {
    const token = this.getToken();
    if (!token) throw new Error('未登录');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('登录已过期');
    }

    return res;
  },

  /** 从 URL 参数中提取 token（飞书回调后） */
  handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      this.setToken(token);
      // 清除 URL 参数
      window.history.replaceState({}, '', '/login');
      return true;
    }
    return false;
  },
};

window.Auth = Auth;
