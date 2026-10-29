/**
 * AES-256-GCM encryption utility
 * ใช้เข้ารหัสเบอร์พร้อมเพย์ก่อนเก็บลง DB
 *
 * กฎเหล็ก:
 * - ห้าม log ค่าที่ถอดรหัสแล้ว
 * - ห้ามส่ง plaintext ออก API ใดๆ (เอาไว้สร้าง QR ฝั่ง server เท่านั้น)
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import type { EncryptedField } from '../models/BirthdayPage'

const ALGORITHM = 'aes-256-gcm'

/**
 * ดึง encryption key จาก runtime config
 * ต้องเป็น hex string 64 ตัวอักษร (= 32 bytes)
 * สร้างด้วย: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
function getKey(): Buffer {
  const config = useRuntimeConfig()
  const keyHex = config.promptpayEncryptionKey

  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      'PROMPTPAY_ENCRYPTION_KEY ต้องเป็น hex 64 ตัวอักษร (32 bytes)\n' +
      'สร้างด้วย: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }

  return Buffer.from(keyHex, 'hex')
}

/** เข้ารหัส plaintext → EncryptedField */
export function encrypt(plaintext: string): EncryptedField {
  const key = getKey()
  const iv = randomBytes(12) // 96-bit IV สำหรับ GCM
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const ciphertextBuf = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: ciphertextBuf.toString('hex'),
  }
}

/** ถอดรหัส EncryptedField → plaintext */
export function decrypt(field: EncryptedField): string {
  const key = getKey()
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(field.iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(field.tag, 'hex'))

  const plaintext =
    decipher.update(Buffer.from(field.ciphertext, 'hex')).toString('utf8') +
    decipher.final('utf8')

  return plaintext
}

/** validate: เบอร์โทร 10 หลัก ขึ้นต้นด้วย 0 หรือเลขบัตรประชาชน 13 หลัก */
export function validatePromptpayId(id: string): { ok: boolean; type: 'phone' | 'nationalId' | null } {
  const cleaned = id.replace(/[-\s]/g, '')
  if (/^0\d{9}$/.test(cleaned)) return { ok: true, type: 'phone' }
  if (/^\d{13}$/.test(cleaned)) return { ok: true, type: 'nationalId' }
  return { ok: false, type: null }
}

/** normalize (ลบ - และ space) */
export function normalizePromptpayId(id: string): string {
  return id.replace(/[-\s]/g, '')
}
