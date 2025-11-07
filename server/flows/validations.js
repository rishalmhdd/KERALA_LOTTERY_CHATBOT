export const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateTicket = (ticket) =>
  /^[A-Z]{2}\d{6}$/.test(ticket);
