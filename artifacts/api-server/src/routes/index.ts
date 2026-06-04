import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import studentsRouter from "./students";
import teachersRouter from "./teachers";
import classesRouter from "./classes";
import marksRouter from "./marks";
import attendanceRouter from "./attendance";
import feesRouter from "./fees";
import disciplineRouter from "./discipline";
import announcementsRouter from "./announcements";
import suggestionsRouter from "./suggestions";
import analyticsRouter from "./analytics";
import rankingsRouter from "./rankings";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(studentsRouter);
router.use(teachersRouter);
router.use(classesRouter);
router.use(marksRouter);
router.use(attendanceRouter);
router.use(feesRouter);
router.use(disciplineRouter);
router.use(announcementsRouter);
router.use(suggestionsRouter);
router.use(analyticsRouter);
router.use(rankingsRouter);
router.use(notificationsRouter);

export default router;
