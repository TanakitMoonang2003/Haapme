/**
 * Composable: owner card-draw experience.
 * Maintains the seen-card set client-side for shuffle logic.
 */
import type { DrawCardResponse } from '../../shared/types'

export function useOwnerDraw(pageId: Ref<string>, ownerToken: Ref<string | null>) {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const drawResult = ref<DrawCardResponse | null>(null)
  const seenIds = ref<string[]>([])

  async function draw() {
    if (!ownerToken.value) {
      error.value = 'ไม่พบ owner token'
      return
    }

    loading.value = true
    error.value = null

    try {
      const seenParam = seenIds.value.join(',')
      const url = seenParam
        ? `/api/pages/${pageId.value}/cards/draw?seen=${seenParam}`
        : `/api/pages/${pageId.value}/cards/draw`

      const res = await $fetch<DrawCardResponse>(url, {
        headers: { Authorization: `Bearer ${ownerToken.value}` },
      })

      drawResult.value = res

      if (res.card) {
        const cardId = res.card.id
        if (!seenIds.value.includes(cardId)) {
          seenIds.value = [...seenIds.value, cardId]
        }
        // If we've now seen all eligible cards, reset for next cycle
        if (seenIds.value.length >= res.totalEligible) {
          seenIds.value = [cardId] // keep only the latest so next draw is different
        }
      }
    } catch (e: unknown) {
      error.value = (e as { data?: { message?: string } })?.data?.message ?? 'เกิดข้อผิดพลาด'
    } finally {
      loading.value = false
    }
  }

  function reset() {
    seenIds.value = []
    drawResult.value = null
    error.value = null
  }

  return { loading, error, drawResult, seenIds, draw, reset }
}
