import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const taskId = searchParams.get("taskId");

  const where: Record<string, unknown> = {};
  if (date) where.date = new Date(date);
  if (taskId) where.taskId = taskId;

  const blocks = await prisma.pomoBlock.findMany({
    where,
    include: { task: true },
    orderBy: { assignedAt: "asc" },
  });

  return NextResponse.json(blocks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const block = await prisma.pomoBlock.create({
    data: {
      taskId: body.taskId,
      steps: JSON.stringify(body.steps || []),
      totalMins: body.totalMins || 0,
      window: body.window || null,
      date: body.date ? new Date(body.date) : null,
      assignedAt: body.window ? new Date() : null,
    },
    include: { task: true },
  });

  return NextResponse.json(block, { status: 201 });
}
