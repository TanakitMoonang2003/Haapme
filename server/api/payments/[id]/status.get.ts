/**
 * GET /api/payments/:id/status
 * Poll the current status of a contribution.
 * The visitor can call this to check if their payment went through.
 */
import { connectDB } from '../../../utils/db'
import { Contribution } from '../../../models/Contribution'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    throw createError({ statusCode: 400, message: 'รหัสการชำระเงินไม่ถูกต้อง' })
  }

  try {
    await connectDB()
  } catch {
    throw createError({ statusCode: 503, message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' })
  }

  const contribution = await Contribution.findById(id)
  if (!contribution) {
    throw createError({ statusCode: 404, message: 'ไม่พบรายการชำระเงิน' })
  }

  return {
    id: contribution._id.toString(),
    status: contribution.status,
    amount: contribution.amount,
    currency: contribution.currency,
    providerRef: contribution.providerRef,
    statusUpdatedAt: contribution.statusUpdatedAt.toISOString(),
  }
})
