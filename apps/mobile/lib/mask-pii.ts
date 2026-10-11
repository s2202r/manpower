const PHONE_RE = /(?:\+?91[\s-]?)?[6-9]\d{9}/g
const UPI_RE = /[a-zA-Z0-9._-]+@[a-zA-Z]{3,}/g

export function maskPII(text: string): string {
  return text.replace(PHONE_RE, '██████████').replace(UPI_RE, '[UPI masked]')
}
