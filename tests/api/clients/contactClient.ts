export class ContactClient {
  readonly requestContext;
  readonly token;

  constructor(requestContext, token) {
    this.requestContext = requestContext;
    this.token = token;
  }

  async add(contact) {
    return await this.requestContext.post('/contacts', { headers: { Authorization: `Bearer ${this.token}` }, data: contact });
  }

  async list() {
    return await this.requestContext.get('/contacts', { headers: { Authorization: `Bearer ${this.token}` } });
  }

  async get(contactId) {
    return await this.requestContext.get(`/contacts/${contactId}`, { headers: { Authorization: `Bearer ${this.token}` } });
  }

  async update(contactId, contactData) {
    return await this.requestContext.put(`/contacts/${contactId}`, { headers: { Authorization: `Bearer ${this.token}` }, data: contactData });
  }

  async patch(contactId, patchData) {
    return await this.requestContext.patch(`/contacts/${contactId}`, { headers: { Authorization: `Bearer ${this.token}` }, data: patchData });
  }

  async delete(contactId) {
    return await this.requestContext.delete(`/contacts/${contactId}`, { headers: { Authorization: `Bearer ${this.token}` } });
  }
}