// note: agar semua tool mengembalikan format yang sama: ringkasan untuk user dan data terstruktur untuk client.
export function textResult(
  text: string,
  structuredContent?: Record<string, unknown>,
) {
  return {
    content: [{ type: 'text' as const, text }],
    ...(structuredContent ? { structuredContent } : {}),
  };
}

// note: Error dari tool ditangani di sini supaya client menerima pesan yang rapi, bukan stack trace
export function errorResult(message: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}
