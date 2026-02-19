import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const maxOrder = await prisma.step.findFirst({
    where: { taskId: body.taskId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const step = await prisma.step.create({
    data: {
      taskId: body.taskId,
      text: body.text || "",
      doneCondition: body.doneCondition || null,
      estimateMins: body.estimateMins || null,
      order: (maxOrder?.order ?? -1) + 1,
    },
  });

  return NextResponse.json(step, { status: 201 });
}
