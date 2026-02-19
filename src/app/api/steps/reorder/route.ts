import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { steps } = body as { steps: { id: string; order: number }[] };

  await prisma.$transaction(
    steps.map((s) =>
      prisma.step.update({ where: { id: s.id }, data: { order: s.order } })
    )
  );

  return NextResponse.json({ ok: true });
}
