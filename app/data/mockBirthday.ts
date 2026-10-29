export const mockBirthday = {
  owner: {
    id: 'birthday-001',
    name: 'เจ้าของวันเกิด',
    birthday: '2026-10-30',
  },

  wishes: [
    {
      id: 'wish-001',
      senderName: 'เพื่อน A',
      message: 'ขอให้มีความสุขมาก ๆ',
      amount: 0,
      paid: false,
      createdAt: '2026-10-28T09:00:00Z',
      targetYear: 2026,
    },
    {
      id: 'wish-002',
      senderName: 'เพื่อน B',
      message: 'ขอให้สมหวังทุกอย่าง 🎉',
      amount: 100,
      paid: true,
      createdAt: '2026-10-28T10:00:00Z',
      targetYear: 2026,
    },
    {
      id: 'wish-003',
      senderName: 'เพื่อน C',
      message: 'ขอให้ปีหน้าเป็นปีที่ดี',
      amount: 0,
      paid: false,
      createdAt: '2026-10-28T11:00:00Z',
      targetYear: 2027,
    },
  ],
}