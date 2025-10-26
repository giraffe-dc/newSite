import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return new NextResponse('File ID is required', { status: 400 })
    }

    // Google Drive direct download URL
    const url = `https://drive.google.com/uc?export=view&id=${fileId}`

    const response = await fetch(url)
    
    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status })
    }

    // Forward the content type and body
    const headers = new Headers()
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=86400') // Cache for 24 hours

    return new NextResponse(response.body, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error proxying Google Drive image:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}