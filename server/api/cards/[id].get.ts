/**
 * GET /api/cards/:id
 * Visitor retrieves their own card.
 *
 * Authorization: Bearer <visitorToken>
 *
 * A visitor can only read their own card.  We do NOT return the visitorToken
 * or its hash in the response.  The card ID alone is not sufficient — the
 * raw visitor token must also be provided.
 *
 * SECURITY NOTE: This is a TEMPORARY mechanism.  Replace with real session
 * auth before going to production.
 */
import { connectDB } from '../../utils/db'
import { GreetingCard } from '../../models/GreetingCard'
import { Contribution } from '../../models/Contribution'
import { verifyToken } from '../../utils/token'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    throw createError({ statusCode: 400, message: 'รหัสการ์ดไม่ถูกต้อง' })
  }

  const authHeader = getHeader(event, 'authorization') ?? ''
  const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!rawToken) {
    throw createError({ statusCode: 401, message: 'ต้องการ visitor token' })
  }

  try {
    await connectDB()
  } catch {
    throw createError({ statusCode: 503, message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' })
  }

  const card = await GreetingCard.findById(id).select('+visitorTokenHash')
  if (!card) {
    throw createError({ statusCode: 404, message: 'ไม่พบการ์ดนี้' })
  }

  if (!verifyToken(rawToken, card.visitorTokenHash)) {
    throw createError({ statusCode: 403, message: 'ไม่มีสิทธิ์ดูการ์ดนี้' })
  }

  // Fetch contribution if any
  const contribution = await Contribution.findOne({ greetingCardId: card._id })

  return {
    card: {
      id: card._id.toString(),
      birthdayPageId: card.birthdayPageId.toString(),
      senderName: card.senderName,
      message: card.message,
      targetYear: card.targetYear,
      createdAt: card.createdAt.toISOString(),
    },
    contribution: contribution
      ? {
          id: contribution._id.toString(),
          amount: contribution.amount,
          currency: contribution.currency,
          status: contribution.status,
          providerRef: contribution.providerRef,
          provider: contribution.provider,
          statusUpdatedAt: contribution.statusUpdatedAt.toISOString(),
        }
      : null,
  }
})
