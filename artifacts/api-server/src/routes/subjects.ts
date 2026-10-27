import { eq, ilike, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateSubjectBody,
  CreateSubjectResponse,
  DeleteSubjectParams,
  GetSubjectParams,
  GetSubjectResponse,
  ListSubjectsQueryParams,
  ListSubjectsResponse,
  UpdateSubjectBody,
  UpdateSubjectParams,
  UpdateSubjectResponse,
} from "@workspace/api-zod";
import { db, subjectsTable } from "@workspace/db";

const router: IRouter = Router();

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function validateMarks(maxMarks: number, passingMarks: number): string | null {
  if (passingMarks > maxMarks) {
    return "Passing marks cannot exceed maximum marks";
  }
  return null;
}

router.get("/subjects", async (req, res): Promise<void> => {
  const query = ListSubjectsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const search = query.data.search;
  const subjects = await db
    .select()
    .from(subjectsTable)
    .where(
      search
        ? or(
            ilike(subjectsTable.name, `%${search}%`),
            ilike(subjectsTable.code, `%${search}%`),
          )
        : undefined,
    )
    .orderBy(subjectsTable.name);
  res.json(ListSubjectsResponse.parse(subjects));
});

router.post("/subjects", async (req, res): Promise<void> => {
  const input = CreateSubjectBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  const validation = validateMarks(
    input.data.maxMarks,
    input.data.passingMarks,
  );
  if (validation) {
    res.status(400).json({ error: validation });
    return;
  }
  try {
    const [subject] = await db
      .insert(subjectsTable)
      .values(input.data)
      .returning();
    res.status(201).json(CreateSubjectResponse.parse(subject));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "Subject code already exists" });
      return;
    }
    throw error;
  }
});

router.get("/subjects/:id", async (req, res): Promise<void> => {
  const params = GetSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [subject] = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.id, params.data.id));
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json(GetSubjectResponse.parse(subject));
});

router.patch("/subjects/:id", async (req, res): Promise<void> => {
  const params = UpdateSubjectParams.safeParse(req.params);
  const input = UpdateSubjectBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  const [current] = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.id, params.data.id));
  if (!current) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  const validation = validateMarks(
    input.data.maxMarks ?? current.maxMarks,
    input.data.passingMarks ?? current.passingMarks,
  );
  if (validation) {
    res.status(400).json({ error: validation });
    return;
  }
  try {
    const [subject] = await db
      .update(subjectsTable)
      .set(input.data)
      .where(eq(subjectsTable.id, params.data.id))
      .returning();
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    res.json(UpdateSubjectResponse.parse(subject));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "Subject code already exists" });
      return;
    }
    throw error;
  }
});

router.delete("/subjects/:id", async (req, res): Promise<void> => {
  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [subject] = await db
    .delete(subjectsTable)
    .where(eq(subjectsTable.id, params.data.id))
    .returning({ id: subjectsTable.id });
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
