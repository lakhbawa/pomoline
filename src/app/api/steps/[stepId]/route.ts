import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { stepId: string } }
) {
  const body = await request.json();
  const step = await prisma.step.update({
    where: { id: params.stepId },
    data: body,
  });

  return NextResponse.json(step);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { stepId: string } }
) {
  await prisma.step.delete({ where: { id: params.stepId } });
  return NextResponse.json({ ok: true });
}
