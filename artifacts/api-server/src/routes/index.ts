import { Router, type IRouter } from "express";
import analyticsRouter from "./analytics";
import healthRouter from "./health";
import marksRouter from "./marks";
import studentsRouter from "./students";
import subjectsRouter from "./subjects";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studentsRouter);
router.use(subjectsRouter);
router.use(marksRouter);
router.use(analyticsRouter);

export default router;
