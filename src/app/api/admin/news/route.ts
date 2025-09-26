import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const newsData = await request.json()
    const client = await clientPromise
    const db = client.db('zhyrafyk')

    const result = await db.collection('news').insertOne({
      ...newsData,
      date: new Date(newsData.date).toISOString()
    })

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error('News creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create news' },
      { status: 500 }
    )
  }
}


export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    

    const { id, ...newsData } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    // Явно видаляємо _id, щоб уникнути помилки
    delete (newsData as { _id?: any })._id;

    const client = await clientPromise
    const db = client.db('zhyrafyk')

    const result = await db.collection('news').updateOne(
      { _id: new ObjectId(id) },
      { $set: newsData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('News update error:', error)
    return NextResponse.json(
      { error: 'Failed to update news' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
    try {
        const token = request.cookies.get('admin_token')?.value;
        if (!token || !verifyToken(token)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('zhyrafyk');

        const result = await db.collection('news').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'News item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('News deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
    }
}
