export function maskDisplayValue(value: string) {
  if (!/\d/.test(value)) return value;
  return value.replace(/[^.,\s]/g, "*");
}

export function maskValue(value: string, isVisible: boolean): string {
  return isVisible ? value : maskDisplayValue(value);
}
