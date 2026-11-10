export class ApiClientError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors || null;
  }
}
