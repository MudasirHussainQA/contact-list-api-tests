export class UserClient {
  readonly requestContext;
  token = '';

  constructor(requestContext) {
    this.requestContext = requestContext;
  }

  async register(user) {
    return await this.requestContext.post('/users', {
      data: user,
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Pragma': 'no-cache'
      }
    });
  }

  async login(credentials) {
    const res = await this.requestContext.post('/users/login', { data: credentials });
    if (res.ok()) {
      const body = await res.json();
      this.token = body.token;
    }
    return res;
  }

  async profile() {
    return await this.requestContext.get('/users/me', { headers: { Authorization: `Bearer ${this.token}` } });
  }

  async updateProfile(updateData) {
    return await this.requestContext.patch('/users/me', {
      headers: { Authorization: `Bearer ${this.token}` },
      data: updateData,
    });
  }

  async logout() {
    return await this.requestContext.post('/users/logout', { headers: { Authorization: `Bearer ${this.token}` } });
  }

  async delete() {
    return await this.requestContext.delete('/users/me', { headers: { Authorization: `Bearer ${this.token}` } });
  }
}