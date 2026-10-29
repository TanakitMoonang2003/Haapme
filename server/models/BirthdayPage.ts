/**
 * BirthdayPage model.
 */
import mongoose, { Schema, type Document, type Model } from 'mongoose'

// โครงสร้างของเบอร์พร้อมเพย์ที่เข้ารหัสแล้ว (AES-256-GCM)
export interface EncryptedField {
  iv: string          // hex — 12 bytes
  tag: string         // hex — 16 bytes (auth tag)
  ciphertext: string  // hex — ตัวเลขที่เข้ารหัสแล้ว
}

export interface IBirthdayPage extends Document {
  _id: mongoose.Types.ObjectId
  displayName: string
  /** YYYY-MM-DD */
  dateOfBirth: string
  ownerTokenHash: string
  /**
   * เบอร์พร้อมเพย์เข้ารหัส AES-256-GCM
   * - ไม่เก็บ plain text
   * - ไม่ส่งออก API สาธารณะ (select: false)
   * - null = เจ้าของยังไม่ได้กรอก
   */
  promptpayEncrypted: EncryptedField | null
  createdAt: Date
  updatedAt: Date
}

const EncryptedFieldSchema = new Schema<EncryptedField>(
  {
    iv: { type: String, required: true },
    tag: { type: String, required: true },
    ciphertext: { type: String, required: true },
  },
  { _id: false }
)

const BirthdayPageSchema = new Schema<IBirthdayPage>(
  {
    displayName: { type: String, default: 'Birthday Person', maxlength: 60 },
    dateOfBirth: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    ownerTokenHash: { type: String, required: true, select: false },
    // select: false → ไม่ถูกดึงมาโดยค่า default ต้อง .select('+promptpayEncrypted') เสมอ
    promptpayEncrypted: { type: EncryptedFieldSchema, default: null, select: false },
  },
  { timestamps: true }
)

BirthdayPageSchema.index({ dateOfBirth: 1 })

export const BirthdayPage: Model<IBirthdayPage> =
  mongoose.models.BirthdayPage ||
  mongoose.model<IBirthdayPage>('BirthdayPage', BirthdayPageSchema)
