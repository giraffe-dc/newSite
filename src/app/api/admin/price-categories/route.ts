import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET all categories
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('zhyrafyk')
    const categories = await db.collection('price_categories').find({}).sort({ order: 1 }).toArray()

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Category fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST a new category
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categoryData = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')

    const result = await db.collection('price_categories').insertOne(categoryData)

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error('Category creation error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PUT to update a category
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, ...categoryData } = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')

    await db.collection('price_categories').updateOne(
      { _id: new ObjectId(id) },
      { $set: categoryData }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Category update error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE a category
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')

    await db.collection('price_categories').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Category deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
