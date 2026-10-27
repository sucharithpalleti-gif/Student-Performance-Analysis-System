import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { subjectsTable } from "./subjects";

export const marksTable = pgTable(
  "marks",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjectsTable.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
    examName: text("exam_name").notNull(),
    term: text("term").notNull(),
    assessmentDate: date("assessment_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("marks_assessment_unique").on(
      table.studentId,
      table.subjectId,
      table.examName,
      table.term,
    ),
  ],
);

export const insertMarkSchema = createInsertSchema(marksTable).omit({
  id: true,
  createdAt: true,
});
export type InsertMark = z.infer<typeof insertMarkSchema>;
export type Mark = typeof marksTable.$inferSelect;
