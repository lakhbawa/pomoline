import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    include: { steps: { orderBy: { order: "asc" } }, pomoBlocks: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const body = await request.json();
  const task = await prisma.task.update({
    where: { id: params.taskId },
    data: body,
    include: { steps: { orderBy: { order: "asc" } }, pomoBlocks: true },
  });

  return NextResponse.json(task);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  await prisma.task.delete({ where: { id: params.taskId } });
  return NextResponse.json({ ok: true });
}
