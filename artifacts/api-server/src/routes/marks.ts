import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateMarkBody,
  CreateMarkResponse,
  DeleteMarkParams,
  ListMarksQueryParams,
  ListMarksResponse,
  UpdateMarkBody,
  UpdateMarkParams,
  UpdateMarkResponse,
} from "@workspace/api-zod";
import { db, marksTable, studentsTable, subjectsTable } from "@workspace/db";

const router: IRouter = Router();

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

async function findMark(id: number) {
  const [mark] = await db
    .select({
      id: marksTable.id,
      studentId: marksTable.studentId,
      subjectId: marksTable.subjectId,
      score: marksTable.score,
      examName: marksTable.examName,
      term: marksTable.term,
      assessmentDate: marksTable.assessmentDate,
      studentName: studentsTable.fullName,
      rollNumber: studentsTable.rollNumber,
      subjectName: subjectsTable.name,
      maxMarks: subjectsTable.maxMarks,
      passingMarks: subjectsTable.passingMarks,
      createdAt: marksTable.createdAt,
    })
    .from(marksTable)
    .innerJoin(studentsTable, eq(marksTable.studentId, studentsTable.id))
    .innerJoin(subjectsTable, eq(marksTable.subjectId, subjectsTable.id))
    .where(eq(marksTable.id, id));
  return mark;
}

router.get("/marks", async (req, res): Promise<void> => {
  const query = ListMarksQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const filters = [];
  if (query.data.studentId) {
    filters.push(eq(marksTable.studentId, query.data.studentId));
  }
  if (query.data.subjectId) {
    filters.push(eq(marksTable.subjectId, query.data.subjectId));
  }
  const marks = await db
    .select({
      id: marksTable.id,
      studentId: marksTable.studentId,
      subjectId: marksTable.subjectId,
      score: marksTable.score,
      examName: marksTable.examName,
      term: marksTable.term,
      assessmentDate: marksTable.assessmentDate,
      studentName: studentsTable.fullName,
      rollNumber: studentsTable.rollNumber,
      subjectName: subjectsTable.name,
      maxMarks: subjectsTable.maxMarks,
      passingMarks: subjectsTable.passingMarks,
      createdAt: marksTable.createdAt,
    })
    .from(marksTable)
    .innerJoin(studentsTable, eq(marksTable.studentId, studentsTable.id))
    .innerJoin(subjectsTable, eq(marksTable.subjectId, subjectsTable.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(marksTable.assessmentDate);
  res.json(ListMarksResponse.parse(marks));
});

router.post("/marks", async (req, res): Promise<void> => {
  const input = CreateMarkBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  const [student] = await db
    .select({ id: studentsTable.id })
    .from(studentsTable)
    .where(eq(studentsTable.id, input.data.studentId));
  const [subject] = await db
    .select({
      id: subjectsTable.id,
      maxMarks: subjectsTable.maxMarks,
    })
    .from(subjectsTable)
    .where(eq(subjectsTable.id, input.data.subjectId));
  if (!student || !subject) {
    res.status(404).json({ error: "Student or subject not found" });
    return;
  }
  if (input.data.score > subject.maxMarks) {
    res.status(400).json({ error: "Score cannot exceed maximum marks" });
    return;
  }
  try {
    const [created] = await db
      .insert(marksTable)
      .values({
        ...input.data,
        assessmentDate: input.data.assessmentDate.toISOString().slice(0, 10),
      })
      .returning({ id: marksTable.id });
    const mark = await findMark(created.id);
    res.status(201).json(CreateMarkResponse.parse(mark));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({
        error: "An assessment with this name and term already exists for this student and subject",
      });
      return;
    }
    throw error;
  }
});

router.patch("/marks/:id", async (req, res): Promise<void> => {
  const params = UpdateMarkParams.safeParse(req.params);
  const input = UpdateMarkBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  if (Object.keys(input.data).length === 0) {
    res.status(400).json({ error: "Provide at least one field to update" });
    return;
  }
  const [current] = await db
    .select()
    .from(marksTable)
    .where(eq(marksTable.id, params.data.id));
  if (!current) {
    res.status(404).json({ error: "Mark not found" });
    return;
  }
  const studentId = input.data.studentId ?? current.studentId;
  const subjectId = input.data.subjectId ?? current.subjectId;
  const [student] = await db
    .select({ id: studentsTable.id })
    .from(studentsTable)
    .where(eq(studentsTable.id, studentId));
  const [subject] = await db
    .select({ id: subjectsTable.id, maxMarks: subjectsTable.maxMarks })
    .from(subjectsTable)
    .where(eq(subjectsTable.id, subjectId));
  if (!student || !subject) {
    res.status(404).json({ error: "Student or subject not found" });
    return;
  }
  const score = input.data.score ?? current.score;
  if (score > subject.maxMarks) {
    res.status(400).json({ error: "Score cannot exceed maximum marks" });
    return;
  }

  const update = {
    ...input.data,
    assessmentDate: input.data.assessmentDate?.toISOString().slice(0, 10),
  };
  try {
    await db
      .update(marksTable)
      .set(update)
      .where(eq(marksTable.id, params.data.id));
    const mark = await findMark(params.data.id);
    if (!mark) {
      res.status(404).json({ error: "Mark not found" });
      return;
    }
    res.json(UpdateMarkResponse.parse(mark));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({
        error: "An assessment with this name and term already exists for this student and subject",
      });
      return;
    }
    throw error;
  }
});

router.delete("/marks/:id", async (req, res): Promise<void> => {
  const params = DeleteMarkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [mark] = await db
    .delete(marksTable)
    .where(eq(marksTable.id, params.data.id))
    .returning({ id: marksTable.id });
  if (!mark) {
    res.status(404).json({ error: "Mark not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
