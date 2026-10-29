/**
 * Shared types used by both client and server.
 * Do NOT import server-only modules (mongoose, crypto) here.
 */

// ---------------------------------------------------------------------------
// Birthday Page
// ---------------------------------------------------------------------------

export interface BirthdayPagePublic {
  id: string
  displayName: string
  /** YYYY-MM-DD */
  dateOfBirth: string
  /** Days until the next birthday from today */
  daysUntilBirthday: number
  createdAt: string
}

export interface CreateBirthdayPageInput {
  displayName?: string
  /** YYYY-MM-DD */
  dateOfBirth: string
}

export interface CreateBirthdayPageResponse {
  page: BirthdayPagePublic
  /**
   * Raw owner token — shown ONCE.  Owner must save it.
   * Used as a temporary ownership proof until real auth is added.
   */
  ownerToken: string
}

// ---------------------------------------------------------------------------
// Greeting Card
// ---------------------------------------------------------------------------

export interface GreetingCardPublic {
  id: string
  birthdayPageId: string
  senderName: string
  message: string
  targetYear: number
  createdAt: string
}

export interface CreateGreetingCardInput {
  birthdayPageId: string
  senderName: string
  message: string
  targetYear: number
  /** Optional contribution amount in THB (must be positive integer if provided) */
  contributionAmount?: number
}

export interface CreateGreetingCardResponse {
  card: GreetingCardPublic
  /**
   * Raw visitor token — stored in browser to allow the visitor to view
   * their own card later.  TEMPORARY until real auth is implemented.
   */
  visitorToken: string
  contribution?: ContributionPublic
}

// ---------------------------------------------------------------------------
// Contribution
// ---------------------------------------------------------------------------

export type PaymentStatus = 'pending' | 'paid_unverified' | 'paid' | 'failed' | 'expired'

export interface ContributionPublic {
  id: string
  greetingCardId: string
  amount: number
  currency: string
  status: PaymentStatus
  /** label ภาษาไทยสำหรับแสดงผล */
  statusLabel: string
  qrCodeData: string | null
  qrExpiresAt: string
  statusUpdatedAt: string
}

// ---------------------------------------------------------------------------
// API error response shape
// ---------------------------------------------------------------------------

export interface ApiError {
  error: string
  details?: string[]
}

// ---------------------------------------------------------------------------
// Card draw (owner view)
// ---------------------------------------------------------------------------

/** ข้อมูล contribution ที่เจ้าของเห็น — ไม่มี QR, ไม่มีข้อมูลผู้โอน */
export interface ContributionSummary {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  statusLabel: string
  statusUpdatedAt: string
}

export interface DrawCardResponse {
  card: GreetingCardPublic | null
  /** contribution ของการ์ดที่สุ่มออกมา (ถ้ามี) */
  contribution: ContributionSummary | null
  totalEligible: number
  advanceWishCount: number
}
