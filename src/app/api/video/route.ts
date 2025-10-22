import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const driveUrl = `https://drive.google.com/uc?export=download&id=${id}`

    const res = await fetch(driveUrl)
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch drive file' }, { status: 502 })
    }

    // Stream response back to client preserving Content-Type and Accept-Ranges
    const headers: Record<string, string> = {}
    const contentType = res.headers.get('content-type')
    const contentLength = res.headers.get('content-length')
    const acceptRanges = res.headers.get('accept-ranges')
    if (contentType) headers['Content-Type'] = contentType
    if (contentLength) headers['Content-Length'] = contentLength
    if (acceptRanges) headers['Accept-Ranges'] = acceptRanges

    return new NextResponse(res.body, { status: 200, headers })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
