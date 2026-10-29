/**
 * Composable: manage a birthday page and the owner's token.
 *
 * Owner token is stored in localStorage under the key:
 *   hbdtome:owner:<pageId>
 *
 * TEMPORARY mechanism — replace with real session auth later.
 */
import type {
  BirthdayPagePublic,
  CreateBirthdayPageInput,
  CreateBirthdayPageResponse,
} from '../../shared/types'

const OWNER_TOKEN_KEY = (id: string) => `hbdtome:owner:${id}`

export function useBirthdayPage() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const page = ref<BirthdayPagePublic | null>(null)

  async function createPage(input: CreateBirthdayPageInput) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<CreateBirthdayPageResponse>('/api/pages', {
        method: 'POST',
        body: input,
      })
      page.value = res.page
      // Persist owner token in browser
      if (typeof window !== 'undefined') {
        localStorage.setItem(OWNER_TOKEN_KEY(res.page.id), res.ownerToken)
      }
      return res
    } catch (e: unknown) {
      error.value = (e as { data?: { message?: string }; message?: string })?.data?.message
        ?? (e as Error)?.message
        ?? 'เกิดข้อผิดพลาด'
      return null
    } finally {
      loading.value = false
    }
  }

  async function loadPage(id: string) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<BirthdayPagePublic>(`/api/pages/${id}`)
      page.value = res
      return res
    } catch (e: unknown) {
      error.value = (e as { data?: { message?: string } })?.data?.message ?? 'ไม่พบหน้าวันเกิด'
      return null
    } finally {
      loading.value = false
    }
  }

  function getOwnerToken(id: string): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(OWNER_TOKEN_KEY(id))
  }

  function clearOwnerToken(id: string) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(OWNER_TOKEN_KEY(id))
    }
  }

  return { loading, error, page, createPage, loadPage, getOwnerToken, clearOwnerToken }
}
