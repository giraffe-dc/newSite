import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceData = await request.json();
    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    const result = await db.collection("services").insertOne(serviceData);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Service creation error:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
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

    const { id, ...serviceData } = await request.json();
    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    delete (serviceData as { _id?: unknown })._id;

    await db
      .collection("services")
      .updateOne({ _id: new ObjectId(id) }, { $set: serviceData });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Service update error:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
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
      .collection("services")
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Service patch error:", error);
    return NextResponse.json(
      { error: "Failed to patch service" },
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

    await db.collection("services").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Service delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 },
    );
  }
}
