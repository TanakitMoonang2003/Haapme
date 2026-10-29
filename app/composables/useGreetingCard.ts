/**
 * Composable: submit and retrieve greeting cards.
 *
 * Visitor token is stored in localStorage under:
 *   hbdtome:visitor:<cardId>
 *
 * TEMPORARY mechanism — replace with real session auth later.
 */
import type {
  CreateGreetingCardInput,
  CreateGreetingCardResponse,
  GreetingCardPublic,
} from '../../shared/types'

const VISITOR_TOKEN_KEY = (id: string) => `hbdtome:visitor:${id}`
const MY_CARDS_KEY = 'hbdtome:my-cards' // JSON array of card IDs

export function useGreetingCard() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const submittedCard = ref<CreateGreetingCardResponse | null>(null)

  async function submitCard(input: CreateGreetingCardInput) {
    loading.value = true
    error.value = null
    submittedCard.value = null
    try {
      const res = await $fetch<CreateGreetingCardResponse>('/api/cards', {
        method: 'POST',
        body: input,
      })
      submittedCard.value = res

      if (typeof window !== 'undefined') {
        // Store visitor token
        localStorage.setItem(VISITOR_TOKEN_KEY(res.card.id), res.visitorToken)
        // Track card IDs for "my cards" list
        const ids: string[] = JSON.parse(localStorage.getItem(MY_CARDS_KEY) ?? '[]')
        if (!ids.includes(res.card.id)) {
          ids.push(res.card.id)
          localStorage.setItem(MY_CARDS_KEY, JSON.stringify(ids))
        }
      }

      return res
    } catch (e: unknown) {
      error.value = (e as { data?: { message?: string } })?.data?.message ?? 'เกิดข้อผิดพลาด'
      return null
    } finally {
      loading.value = false
    }
  }

  /** Load a single card using the stored visitor token */
  async function loadMyCard(cardId: string) {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem(VISITOR_TOKEN_KEY(cardId))
      : null

    if (!token) return null

    try {
      const res = await $fetch<{ card: GreetingCardPublic }>(`/api/cards/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res
    } catch {
      return null
    }
  }

  /** Returns all card IDs stored for this visitor */
  function getMyCardIds(): string[] {
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem(MY_CARDS_KEY) ?? '[]')
  }

  function getVisitorToken(cardId: string): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(VISITOR_TOKEN_KEY(cardId))
  }

  return {
    loading,
    error,
    submittedCard,
    submitCard,
    loadMyCard,
    getMyCardIds,
    getVisitorToken,
  }
}
