export const COLORS = {
  PRIMARY: 0x5865f2,
  SUCCESS: 0x57f287,
  WARNING: 0xfee75c,
  DANGER: 0xed4245,
  BLURPLE: 0x5865f2,
  Z2U: 0x00b4d8,
  DARK: 0x2b2d31,
  WHITE: 0xffffff,
};

export function parseColor(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}
