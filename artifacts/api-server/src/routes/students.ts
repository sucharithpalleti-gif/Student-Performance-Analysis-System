import { and, eq, ilike, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateStudentBody,
  CreateStudentResponse,
  DeleteStudentParams,
  GetStudentParams,
  GetStudentResponse,
  ListStudentsQueryParams,
  ListStudentsResponse,
  UpdateStudentBody,
  UpdateStudentParams,
  UpdateStudentResponse,
} from "@workspace/api-zod";
import { db, studentsTable } from "@workspace/db";

const router: IRouter = Router();

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

router.get("/students", async (req, res): Promise<void> => {
  const query = ListStudentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search, grade } = query.data;
  const filters = [];
  if (grade) filters.push(eq(studentsTable.grade, grade));
  if (search) {
    filters.push(
      or(
        ilike(studentsTable.fullName, `%${search}%`),
        ilike(studentsTable.rollNumber, `%${search}%`),
      ),
    );
  }
  const students = await db
    .select()
    .from(studentsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(studentsTable.fullName);
  res.json(ListStudentsResponse.parse(students));
});

router.post("/students", async (req, res): Promise<void> => {
  const input = CreateStudentBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  try {
    const [student] = await db
      .insert(studentsTable)
      .values(input.data)
      .returning();
    res.status(201).json(CreateStudentResponse.parse(student));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "Roll number already exists" });
      return;
    }
    throw error;
  }
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, params.data.id));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json(GetStudentResponse.parse(student));
});

router.patch("/students/:id", async (req, res): Promise<void> => {
  const params = UpdateStudentParams.safeParse(req.params);
  const input = UpdateStudentBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  try {
    const [student] = await db
      .update(studentsTable)
      .set(input.data)
      .where(eq(studentsTable.id, params.data.id))
      .returning();
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    res.json(UpdateStudentResponse.parse(student));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "Roll number already exists" });
      return;
    }
    throw error;
  }
});

router.delete("/students/:id", async (req, res): Promise<void> => {
  const params = DeleteStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [student] = await db
    .delete(studentsTable)
    .where(eq(studentsTable.id, params.data.id))
    .returning({ id: studentsTable.id });
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
