import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get("stage");
  const priority = searchParams.get("priority");

  const where: Record<string, string> = {};
  if (stage) where.stage = stage;
  if (priority) where.priority = priority;

  const tasks = await prisma.task.findMany({
    where,
    include: { steps: { orderBy: { order: "asc" } }, pomoBlocks: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const task = await prisma.task.create({
    data: {
      text: body.text,
      stage: body.stage || "RAW",
      priority: body.priority || "UNSET",
    },
    include: { steps: true, pomoBlocks: true },
  });

  return NextResponse.json(task, { status: 201 });
}
