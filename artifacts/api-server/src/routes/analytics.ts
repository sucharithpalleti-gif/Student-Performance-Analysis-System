import { count, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { GetAnalyticsSummaryResponse } from "@workspace/api-zod";
import { db, marksTable, studentsTable, subjectsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const [{ studentCount }] = await db
    .select({ studentCount: count() })
    .from(studentsTable);
  const [{ subjectCount }] = await db
    .select({ subjectCount: count() })
    .from(subjectsTable);
  const allSubjects = await db.select().from(subjectsTable).orderBy(subjectsTable.name);
  const markRows = await db
    .select({
      studentId: marksTable.studentId,
      subjectId: marksTable.subjectId,
      score: marksTable.score,
      maxMarks: subjectsTable.maxMarks,
      passingMarks: subjectsTable.passingMarks,
    })
    .from(marksTable)
    .innerJoin(subjectsTable, eq(marksTable.subjectId, subjectsTable.id));

  const subjectStats = new Map<
    number,
    { total: number; percentageTotal: number; assessmentCount: number }
  >();
  const studentStats = new Map<number, { total: number; assessmentCount: number }>();
  let passCount = 0;
  let normalizedTotal = 0;

  for (const mark of markRows) {
    const percentage = (mark.score / mark.maxMarks) * 100;
    normalizedTotal += percentage;
    if (mark.score >= mark.passingMarks) passCount += 1;

    const subject = subjectStats.get(mark.subjectId) ?? {
      total: 0,
      percentageTotal: 0,
      assessmentCount: 0,
    };
    subject.total += mark.score;
    subject.percentageTotal += percentage;
    subject.assessmentCount += 1;
    subjectStats.set(mark.subjectId, subject);

    const student = studentStats.get(mark.studentId) ?? {
      total: 0,
      assessmentCount: 0,
    };
    student.total += percentage;
    student.assessmentCount += 1;
    studentStats.set(mark.studentId, student);
  }

  const subjectAverages = allSubjects.map((subject) => {
    const stats = subjectStats.get(subject.id);
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      average: stats ? stats.total / stats.assessmentCount : 0,
      averagePercentage: stats
        ? stats.percentageTotal / stats.assessmentCount
        : 0,
      assessmentCount: stats?.assessmentCount ?? 0,
    };
  });
  const atRiskCount = [...studentStats.values()].filter(
    (student) => student.total / student.assessmentCount < 60,
  ).length;
  const summary = {
    studentCount,
    subjectCount,
    assessmentCount: markRows.length,
    overallAverage: markRows.length ? normalizedTotal / markRows.length : 0,
    passRate: markRows.length ? (passCount / markRows.length) * 100 : 0,
    atRiskCount,
    subjectAverages,
  };

  res.json(GetAnalyticsSummaryResponse.parse(summary));
});

export default router;
