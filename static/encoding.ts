const encoder = new TextEncoder();

export function encodeByteString(buf: Uint8Array): string {
  const length = buf.length;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
}

export function encodeUtf8ByteString(str: string): string {
  return encodeByteString(encoder.encode(str));
}

export function getUtf16Indices(str: string): number[] {
  const result: number[] = [];
  let index = 0;
  for (const c of str) {
    const cp = c.codePointAt(0)!;
    result.push(index);
    if (cp > 0x7f) {
      result.push(index);
    }
    if (cp > 0x7ff) {
      result.push(index);
    }
    if (cp > 0xffff) {
      result.push(index);
    }
    index += cp > 0xffff ? 2 : 1;
  }
  result.push(index);
  return result;
}
