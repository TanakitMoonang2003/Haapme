/**
 * POST /api/payments/:id/mock-confirm
 * DEV ONLY — simulate a payment callback for the mock provider.
 *
 * In production this endpoint would be replaced by a real provider webhook
 * (e.g. PromptPay callback).  The real webhook must validate a signature
 * from the provider before updating the payment status.
 *
 * This endpoint is disabled when PAYMENT_PROVIDER != 'mock'.
 */
import { connectDB } from '../../../utils/db'
import { Contribution } from '../../../models/Contribution'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (config.paymentProvider !== 'mock') {
    throw createError({
      statusCode: 403,
      message: 'endpoint นี้ใช้ได้เฉพาะ mock provider เท่านั้น',
    })
  }

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

  if (contribution.status === 'paid') {
    return { status: 'paid', message: 'ชำระเงินแล้ว' }
  }

  contribution.status = 'paid'
  contribution.providerRef = `MOCK-CONFIRMED-${Date.now()}`
  contribution.statusUpdatedAt = new Date()
  await contribution.save()

  return {
    id: contribution._id.toString(),
    status: 'paid',
    providerRef: contribution.providerRef,
    statusUpdatedAt: contribution.statusUpdatedAt.toISOString(),
  }
})
