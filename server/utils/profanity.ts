/**
 * Profanity filter utility.
 *
 * Strategy:
 * 1. Unicode-normalise the input to NFKC to collapse lookalike characters.
 * 2. Collapse common leet-speak substitutions (0→o, 1→i, 3→e, 4→a, 5→s, @→a).
 * 3. Test each word in the configurable block-list against the normalised text.
 * 4. Replace matches in the ORIGINAL text with ### (preserving surrounding context).
 *
 * The word list is configurable via PROFANITY_LIST_PATH or falls back to the
 * built-in minimal list below.  Add more words as needed.
 */

// Built-in minimal list — extend via environment config
const BUILTIN_BLOCKED: string[] = [
  "fuck",
  "fucking",
  "fucked",
  "motherfucker",
  "shit",
  "bullshit",
  "ass",
  "asshole",
  "bitch",
  "bastard",
  "cunt",
  "dick",
  "cock",
  "pussy",
  "dumbass",
  "jackass",
  "slut",
  "whore",
  "retard",

  "เหี้ย",
  "ไอ้เหี้ย",
  "อีเหี้ย",
  "สัตว์",
  "ไอ้สัตว์",
  "อีสัตว์",
  "ควาย",
  "ไอ้ควาย",
  "อีควาย",
  "สัส",
  "ไอสัส",
  "อีสัส",
  "เย็ด",
  "ควย",
  "หี",
  "แตด",
  "มึง",
  "แม่ง",
  "ระยำ",
  "ชิบหาย",
  "ส้นตีน",
  "ตีน",
  "ไอ้เวร",
  "อีเวร",
  "ไอ้บ้า",
  "อีบ้า",
  "หน้าหี",
  "หน้าควย",
  "ปากหมา",
  "เสือก",
  "สถุล",
  "ถ่อย",
];

function normalise(input: string): string {
  // NFKC collapses many lookalike Unicode chars
  let s = input.normalize("NFKC").toLowerCase();
  // Common leet-speak substitutions
  s = s
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");
  return s;
}

/** Build a regex that matches a word with optional non-word separators between chars */
function wordRegex(word: string): RegExp {
  const escaped = Array.from(word)
    .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^a-zA-Z\\u0E00-\\u0E7F]*"); // allow non-letter chars between
  return new RegExp(escaped, "gi");
}

let _blockedWords: string[] | null = null;

function getBlockedWords(): string[] {
  if (_blockedWords) return _blockedWords;
  _blockedWords = BUILTIN_BLOCKED.map((w) => w.toLowerCase());
  return _blockedWords;
}

/**
 * Returns the message with any blocked words replaced by ###.
 * The replacement operates on the original (un-normalised) text so surrounding
 * context (punctuation, Thai characters, etc.) is preserved.
 */
export function maskProfanity(text: string): {
  masked: string;
  found: boolean;
} {
  const blocked = getBlockedWords();
  const normalised = normalise(text);
  let masked = text;
  let found = false;

  for (const word of blocked) {
    const re = wordRegex(word);
    if (re.test(normalise(masked))) {
      // Replace in original text using a best-effort character-span approach
      // Re-run the regex on normalised but replace spans in original
      const normResult = normalise(masked);
      let result = "";
      let origIdx = 0;
      const re2 = new RegExp(wordRegex(word).source, "gi");
      let m: RegExpExecArray | null;
      re2.lastIndex = 0;
      while ((m = re2.exec(normResult)) !== null) {
        const start = m.index;
        const end = start + m[0].length;
        result += masked.slice(origIdx, start) + "###";
        origIdx = end;
        found = true;
      }
      result += masked.slice(origIdx);
      masked = result;
    }
  }

  return { masked, found };
}

/** Validate message: non-empty, within length limit, returns masked version */
export function validateAndMaskMessage(
  message: string,
  maxLength: number,
): { ok: boolean; error?: string; masked: string } {
  const trimmed = message.trim();
  if (!trimmed) {
    return { ok: false, error: "กรุณาเขียนข้อความ", masked: "" };
  }
  if (trimmed.length > maxLength) {
    return {
      ok: false,
      error: `ข้อความยาวเกินไป (สูงสุด ${maxLength} ตัวอักษร)`,
      masked: "",
    };
  }
  const { masked } = maskProfanity(trimmed);
  return { ok: true, masked };
}
