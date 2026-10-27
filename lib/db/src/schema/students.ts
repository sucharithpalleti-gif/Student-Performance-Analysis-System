import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const studentsTable = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    rollNumber: text("roll_number").notNull(),
    fullName: text("full_name").notNull(),
    grade: text("grade").notNull(),
    section: text("section").notNull(),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("students_roll_number_unique").on(table.rollNumber)],
);

export const insertStudentSchema = createInsertSchema(studentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
