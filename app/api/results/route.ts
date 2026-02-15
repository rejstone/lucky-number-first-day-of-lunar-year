import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { EMPTY_RESULTS, LotteryResults } from '@/lib/types';

const dataDir = path.join(process.cwd(), 'data');
const filePath = path.join(dataDir, 'results.json');

async function ensureFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(filePath, 'utf8');
  } catch {
    await writeFile(filePath, JSON.stringify(EMPTY_RESULTS, null, 2), 'utf8');
  }
}

export async function GET() {
  await ensureFile();
  const content = await readFile(filePath, 'utf8');
  return NextResponse.json(JSON.parse(content) as LotteryResults);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LotteryResults;

  await ensureFile();
  await writeFile(filePath, JSON.stringify(body, null, 2), 'utf8');

  return NextResponse.json({ ok: true });
}
