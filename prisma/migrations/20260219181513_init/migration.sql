-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'RAW',
    "priority" TEXT NOT NULL DEFAULT 'UNSET',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "doneCondition" TEXT,
    "estimateMins" INTEGER,
    "order" INTEGER NOT NULL,
    CONSTRAINT "Step_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PomoBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "steps" TEXT NOT NULL DEFAULT '[]',
    "totalMins" INTEGER NOT NULL DEFAULT 0,
    "window" TEXT,
    "assignedAt" DATETIME,
    "date" DATETIME,
    CONSTRAINT "PomoBlock_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
