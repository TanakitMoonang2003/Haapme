/**
 * สร้าง PromptPay QR จากเบอร์พร้อมเพย์ของเจ้าของหน้า
 *
 * กฎเหล็ก:
 * - ดึงเบอร์จาก DB แล้วถอดรหัส — ไม่รับเบอร์จาก client เด็ดขาด
 * - ไม่ส่งเบอร์ดิบกลับ browser (ฝังอยู่ใน QR PNG เท่านั้น)
 * - QR มีอายุ 15 นาที (MAX_AMOUNT ตรวจก่อนสร้าง)
 */
import generatePayload from 'promptpay-qr'
import QRCode from 'qrcode'
import { decrypt } from './crypto'
import type { EncryptedField } from '../models/BirthdayPage'

/** จำนวนเงินสูงสุด (บาท) — ป้องกัน input บ้าๆ */
export const MAX_CONTRIBUTION_AMOUNT = 10_000
/** QR หมดอายุกี่นาที */
export const QR_TTL_MINUTES = 15

export interface QrResult {
  qrDataUrl: string   // PNG data URL ส่งให้ browser
  qrExpiresAt: Date   // เวลาหมดอายุ
}

/**
 * สร้าง QR จาก encrypted promptpay field + amount ที่ได้รับ validate แล้ว
 * เรียกได้เฉพาะ server-side เท่านั้น
 */
export async function buildPromptpayQr(
  encryptedField: EncryptedField,
  amount: number
): Promise<QrResult> {
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_CONTRIBUTION_AMOUNT) {
    throw new Error(`จำนวนเงินต้องเป็นจำนวนเต็ม 1–${MAX_CONTRIBUTION_AMOUNT} บาท`)
  }

  // ถอดรหัสเบอร์ — ห้าม log
  const phone = decrypt(encryptedField)

  // สร้าง EMVCo payload
  const payload = generatePayload(phone, { amount })

  // แปลงเป็น PNG Data URL (280×280)
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 280,
    margin: 2,
    color: { dark: '#49382f', light: '#fdf9f4' },
  })

  const qrExpiresAt = new Date(Date.now() + QR_TTL_MINUTES * 60 * 1000)

  return { qrDataUrl, qrExpiresAt }
}

/** label ภาษาไทยของสถานะการจ่าย */
export function paymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'รอชำระเงิน',
    paid_unverified: 'ผู้ส่งแจ้งว่าโอนแล้ว (ยังไม่ตรวจสอบ)',
    paid: 'ได้รับเงินแล้ว ✅',
    failed: 'ยกเลิก',
    expired: 'QR หมดอายุ',
  }
  return map[status] ?? status
}
