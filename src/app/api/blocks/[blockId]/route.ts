import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { blockId: string } }
) {
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.steps !== undefined) data.steps = JSON.stringify(body.steps);
  if (body.totalMins !== undefined) data.totalMins = body.totalMins;
  if (body.window !== undefined) {
    data.window = body.window;
    data.assignedAt = body.window ? new Date() : null;
  }
  if (body.date !== undefined) data.date = body.date ? new Date(body.date) : null;

  const block = await prisma.pomoBlock.update({
    where: { id: params.blockId },
    data,
    include: { task: true },
  });

  return NextResponse.json(block);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { blockId: string } }
) {
  await prisma.pomoBlock.delete({ where: { id: params.blockId } });
  return NextResponse.json({ ok: true });
}
