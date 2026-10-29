/**
 * Contribution model — การจ่ายเงินแนบกับการ์ด
 *
 * สถานะ:
 *   pending        → QR สร้างแล้ว รอผู้อวยพรสแกน
 *   paid_unverified → ผู้อวยพรกดแจ้งโอนแล้ว (ยังไม่มีการตรวจสอบสลิป)
 *   paid           → เจ้าของยืนยันได้รับเงินแล้ว
 *   failed         → ยกเลิก / ล้มเหลว
 *   expired        → QR หมดอายุ (เกิน 15 นาที)
 */
import mongoose, { Schema, type Document, type Model } from 'mongoose'

export type PaymentStatus =
  | 'pending'
  | 'paid_unverified'
  | 'paid'
  | 'failed'
  | 'expired'

export interface IContribution extends Document {
  _id: mongoose.Types.ObjectId
  greetingCardId: mongoose.Types.ObjectId
  birthdayPageId: mongoose.Types.ObjectId
  amount: number
  currency: string
  status: PaymentStatus
  /**
   * อ้างอิง transaction จากสลิป (transRef จาก QR สลิป)
   * เก็บเมื่อมีค่าเท่านั้น เพื่อให้ sparse unique index ไม่ index รายการที่ยังไม่มี slipRef
   */
  slipRef: string | null
  /** ผล parse สลิป (เก็บ log ไว้ ไม่เก็บรูปสลิป) */
  slipVerifyResult: string | null
  /** QR หมดอายุเมื่อ (15 นาทีหลังสร้าง) */
  qrExpiresAt: Date
  statusUpdatedAt: Date
  createdAt: Date
  updatedAt: Date
}

const ContributionSchema = new Schema<IContribution>(
  {
    greetingCardId: { type: Schema.Types.ObjectId, ref: 'GreetingCard', required: true },
    birthdayPageId: { type: Schema.Types.ObjectId, ref: 'BirthdayPage', required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'THB' },
    status: {
      type: String,
      enum: ['pending', 'paid_unverified', 'paid', 'failed', 'expired'],
      default: 'pending',
    },
    // Omit empty slipRef values; sparse indexes still index explicit null values.
    slipRef: { type: String, default: undefined },
    slipVerifyResult: { type: String, default: null },
    qrExpiresAt: { type: Date, required: true },
    statusUpdatedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
)

ContributionSchema.index({ greetingCardId: 1 })
ContributionSchema.index({ birthdayPageId: 1 })
// sparse unique: slipRef ที่มีค่าต้องไม่ซ้ำ; เอกสารที่ไม่มี field จะไม่ถูก index
ContributionSchema.index(
  { slipRef: 1 },
  { unique: true, sparse: true, name: 'slipRef_unique_sparse' }
)

export const Contribution: Model<IContribution> =
  mongoose.models.Contribution ||
  mongoose.model<IContribution>('Contribution', ContributionSchema)
