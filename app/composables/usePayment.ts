/**
 * Composable: poll payment status and trigger mock-confirm in dev.
 */
import type { ContributionPublic, PaymentStatus } from '../../shared/types'

export function usePayment() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const status = ref<PaymentStatus | null>(null)

  let pollInterval: ReturnType<typeof setInterval> | null = null

  async function checkStatus(contributionId: string) {
    try {
      const res = await $fetch<{ id: string; status: PaymentStatus }>(
        `/api/payments/${contributionId}/status`
      )
      status.value = res.status
      return res.status
    } catch {
      return null
    }
  }

  function startPolling(contributionId: string, onPaid?: () => void) {
    stopPolling()
    pollInterval = setInterval(async () => {
      const s = await checkStatus(contributionId)
      if (s === 'paid' || s === 'failed' || s === 'expired') {
        stopPolling()
        if (s === 'paid') onPaid?.()
      }
    }, 3000)
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  /** DEV ONLY — simulate a successful payment callback */
  async function mockConfirm(contributionId: string) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ status: PaymentStatus }>(
        `/api/payments/${contributionId}/mock-confirm`,
        { method: 'POST' }
      )
      status.value = res.status
      return res
    } catch (e: unknown) {
      error.value = (e as { data?: { message?: string } })?.data?.message ?? 'เกิดข้อผิดพลาด'
      return null
    } finally {
      loading.value = false
    }
  }

  onUnmounted(() => stopPolling())

  return { loading, error, status, checkStatus, startPolling, stopPolling, mockConfirm }
}
