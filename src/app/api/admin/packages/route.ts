import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const packageData = await request.json();
    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    const result = await db.collection("packages").insertOne(packageData);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Package creation error:", error);
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...packageData } = await request.json();
    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    delete (packageData as { _id?: any })._id;

    await db
      .collection("packages")
      .updateOne({ _id: new ObjectId(id) }, { $set: packageData });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Package update error:", error);
    return NextResponse.json(
      { error: "Failed to update package" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...updates } = await request.json();
    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    await db
      .collection("packages")
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Package patch error:", error);
    return NextResponse.json(
      { error: "Failed to patch package" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    await db.collection("packages").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Package delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 },
    );
  }
}
