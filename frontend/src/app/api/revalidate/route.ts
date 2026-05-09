import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const paths: string[] = Array.isArray(body.paths) ? body.paths : []

  for (const path of paths) {
    revalidatePath(path)
  }

  return new NextResponse(null, { status: 204 })
}
