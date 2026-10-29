/**
 * GreetingCard model.
 * One record per wish submitted by a visitor.
 */
import mongoose, { Schema, type Document, type Model } from 'mongoose'

export interface IGreetingCard extends Document {
  _id: mongoose.Types.ObjectId
  /** References BirthdayPage */
  birthdayPageId: mongoose.Types.ObjectId
  senderName: string
  /** Stored message (profanity already masked server-side before storage) */
  message: string
  /**
   * The birthday year this card is intended for.
   * Cards whose targetYear is in the future are advance wishes and must
   * not be readable by the owner until that birthday year arrives.
   */
  targetYear: number
  /**
   * Opaque visitor token stored hashed.
   * Used so the visitor can retrieve their own card without authentication.
   * TEMPORARY: replace with real auth session in production.
   */
  visitorTokenHash: string
  /**
   * Server-assigned random sort key for shuffle-read.
   * Re-rolled each time the card is "dealt" to give a fair random order.
   */
  shuffleKey: number
  createdAt: Date
  updatedAt: Date
}

const GreetingCardSchema = new Schema<IGreetingCard>(
  {
    birthdayPageId: {
      type: Schema.Types.ObjectId,
      ref: 'BirthdayPage',
      required: true,
      index: true,
    },
    senderName: { type: String, required: true, maxlength: 60, trim: true },
    message: { type: String, required: true, maxlength: 600, trim: true },
    targetYear: { type: Number, required: true },
    visitorTokenHash: { type: String, required: true, select: false },
    shuffleKey: { type: Number, default: () => Math.random(), index: true },
  },
  { timestamps: true }
)

// Compound index: all cards for a page ordered by shuffle
GreetingCardSchema.index({ birthdayPageId: 1, shuffleKey: 1 })
// Compound index: filter by page + year (for advance-wish gating)
GreetingCardSchema.index({ birthdayPageId: 1, targetYear: 1 })

export const GreetingCard: Model<IGreetingCard> =
  mongoose.models.GreetingCard ||
  mongoose.model<IGreetingCard>('GreetingCard', GreetingCardSchema)
