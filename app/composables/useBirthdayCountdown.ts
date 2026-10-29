export const useBirthdayCountdown = (birthday: string) => {
  const getDaysLeft = (): number => {
    const parts = birthday.split("-").map(Number);

    if (
      parts.length !== 3 ||
      !Number.isFinite(parts[0]) ||
      !Number.isFinite(parts[1]) ||
      !Number.isFinite(parts[2])
    ) {
      console.error("[useBirthdayCountdown] Invalid birthday:", birthday);
      return 0;
    }

    const year = parts[0]!;
    const month = parts[1]!;
    const day = parts[2]!;

    // ตรวจสอบช่วงของเดือนและวัน
    if (year <= 0 || month < 1 || month > 12 || day < 1 || day > 31) {
      console.error("[useBirthdayCountdown] Birthday out of range:", {
        year,
        month,
        day,
      });
      return 0;
    }

    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let target = new Date(now.getFullYear(), month - 1, day);

    // ตรวจสอบวันที่ไม่มีอยู่จริง เช่น 30 กุมภาพันธ์
    if (target.getMonth() !== month - 1 || target.getDate() !== day) {
      console.error("[useBirthdayCountdown] Invalid calendar date:", birthday);
      return 0;
    }

    if (target < today) {
      target = new Date(now.getFullYear() + 1, month - 1, day);
    }

    return Math.round((target.getTime() - today.getTime()) / 86400000);
  };

  return { getDaysLeft };
};
