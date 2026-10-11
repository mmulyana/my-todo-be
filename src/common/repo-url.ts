import { BadRequestException } from '@nestjs/common';

const REPO_URL = /^https:\/\/[^/\s]+\/[^/\s]+\/[^/\s]+$/;

// note: satu bentuk kanonik biar perbandingan todo.repo vs project.repos nggak gagal cuma karena `.git` atau slash di akhir
export function normalizeRepoUrl(raw: string) {
  const url = raw
    .trim()
    .replace(/\/+$/, '')
    .replace(/\.git$/, '');
  if (!REPO_URL.test(url)) {
    throw new BadRequestException(
      `URL repo tidak valid: "${raw}" (contoh: https://github.com/owner/repo)`,
    );
  }
  return url;
}

export function normalizeRepoList(raw: string[]) {
  return [...new Set(raw.filter((url) => url.trim()).map(normalizeRepoUrl))];
}

export function repoName(url: string) {
  return url.split('/').pop()!;
}
