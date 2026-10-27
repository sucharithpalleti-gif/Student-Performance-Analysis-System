import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  useCreateMark, useCreateStudent, useCreateSubject, useDeleteMark, useDeleteStudent,
  useDeleteSubject, useGetAnalyticsSummary, useListMarks, useListStudents, useListSubjects,
  useUpdateMark, useUpdateStudent, useUpdateSubject, getListMarksQueryKey,
  getListStudentsQueryKey, getListSubjectsQueryKey, getGetAnalyticsSummaryQueryKey,
} from '@workspace/api-client-react';
import type { AnalyticsSummary, Mark, MarkInput, Student, StudentInput, Subject, SubjectInput } from '@workspace/api-client-react';
import {
  Activity, ArrowUpRight, BookOpen, Check, ChevronDown, CircleAlert, ClipboardList,
  GraduationCap, LayoutDashboard, LoaderCircle, Plus, Search, SlidersHorizontal,
  Trash2, Users, X, Pencil, ChartNoAxesCombined,
} from 'lucide-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type PageName = 'Overview' | 'Students' | 'Subjects' | 'Marks';
const pageCopy: Record<PageName, { title: string; eyebrow: string; description: string }> = {
  Overview: { title: 'Class overview', eyebrow: 'YOUR CLASSROOM, AT A GLANCE', description: 'A clear picture of learning, progress, and the work ahead.' },
  Students: { title: 'Students', eyebrow: 'CLASS DIRECTORY', description: 'Keep your roster accurate and find a student in seconds.' },
  Subjects: { title: 'Subjects', eyebrow: 'CURRICULUM', description: 'Set the subjects and score thresholds used across your class.' },
  Marks: { title: 'Marks', eyebrow: 'ASSESSMENT RECORDS', description: 'Record scores and review outcomes across every assessment.' },
};

function AppShell({ page, children }: { page: PageName; children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const links: { name: PageName; href: string; icon: typeof LayoutDashboard }[] = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Marks', href: '/marks', icon: ClipboardList },
  ];
  const copy = pageCopy[page];
  return <div className="app-shell flex bg-background text-foreground">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
      <button onClick={() => navigate('/')} data-testid="link-home" className="flex items-center gap-3 px-2 text-left">
        <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-primary text-primary-foreground"><GraduationCap size={21}/></span>
        <span><span className="block font-display text-[16px] font-extrabold tracking-[-.04em]">Classroom</span><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Performance</span></span>
      </button>
      <div className="mb-3 mt-12 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Workspace</div>
      <nav className="space-y-1" aria-label="Main navigation">
        {links.map(({ name, href, icon: Icon }) => <Link key={href} href={href} data-testid={`link-${name.toLowerCase()}`} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${page === name ? 'bg-white text-primary shadow-sm' : 'text-sidebar-foreground/75 hover:bg-white/70 hover:text-foreground'}`}>
          <Icon size={17} strokeWidth={1.8}/><span>{name}</span>{page === name && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"/>}
        </Link>)}
      </nav>
      <div className="mt-auto rounded-2xl border border-sidebar-border bg-white/70 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold"><span className="h-2 w-2 rounded-full bg-[#658b79]"/>Your class space</div>
        <p className="text-[11px] leading-[1.6] text-muted-foreground">A dependable place for the details that help every student move forward.</p>
      </div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col md:ml-[244px]">
      <header className="sticky top-0 z-20 flex h-[66px] items-center justify-between border-b border-border/80 bg-background/95 px-5 backdrop-blur md:px-9">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>Classroom</span><span className="text-border">/</span><span className="font-semibold text-foreground">{page}</span></div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">Academic workspace</span>
          <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-[#e9e3d7] text-[11px] font-bold text-[#59615c]" data-testid="avatar-teacher">T</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 pb-12 pt-8 md:px-9 md:pt-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-[10px] font-bold tracking-[.18em] text-primary">{copy.eyebrow}</p><h1 className="font-display text-[32px] font-bold leading-tight tracking-[-.045em] md:text-[37px]">{copy.title}</h1><p className="mt-2 max-w-xl text-[13px] text-muted-foreground">{copy.description}</p></div>
          {page === 'Overview' && <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[11px] font-semibold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary"/><span>Live class data</span></div>}
        </div>
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-background/95 px-2 py-2 backdrop-blur md:hidden">
        {links.map(({ name, href, icon: Icon }) => <Link key={href} href={href} data-testid={`mobile-link-${name.toLowerCase()}`} className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold ${page === name ? 'text-primary' : 'text-muted-foreground'}`}><Icon size={18}/>{name}</Link>)}
      </nav>
    </div>
  </div>;
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[18px] border border-card-border bg-card ${className}`}>{children}</section>;
}

function LoadingRows() {
  return <div className="space-y-3 p-5" aria-label="Loading records">{[1, 2, 3, 4].map((item) => <div key={item} className="flex animate-pulse gap-3 py-2"><div className="h-9 w-9 rounded-full bg-muted"/><div className="flex-1 space-y-2 pt-1"><div className="h-3 w-1/3 rounded bg-muted"/><div className="h-2.5 w-1/2 rounded bg-muted"/></div></div>)}</div>;
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="flex min-h-[210px] flex-col items-center justify-center px-6 text-center" data-testid="empty-state"><span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary"><BookOpen size={19}/></span><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{detail}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

function ErrorNotice({ retry }: { retry: () => void }) {
  return <div className="flex items-center justify-between gap-4 rounded-xl border border-[#e9c5be] bg-[#fbf0ed] px-4 py-3 text-sm text-[#8f5148]" data-testid="status-load-error"><span className="flex items-center gap-2"><CircleAlert size={16}/>Records could not be loaded.</span><button onClick={retry} className="font-semibold underline underline-offset-2" data-testid="button-retry">Try again</button></div>;
}

function StatCard({ label, value, suffix, icon: Icon, note, tone = 'sage' }: { label: string; value: string | number; suffix?: string; icon: typeof Users; note: string; tone?: 'sage' | 'sand' | 'blue' | 'rose' }) {
  const colors = { sage: 'bg-[#edf3ef] text-[#547b69]', sand: 'bg-[#f5f0e6] text-[#9a8051]', blue: 'bg-[#edf1f3] text-[#5a7582]', rose: 'bg-[#f7eeeb] text-[#a46c5f]' };
  return <Panel className="p-4 md:p-5"><div className="flex items-start justify-between"><div className="text-[11px] font-semibold text-muted-foreground">{label}</div><span className={`grid h-8 w-8 place-items-center rounded-xl ${colors[tone]}`}><Icon size={16}/></span></div><div className="mt-4 flex items-baseline gap-1"><span className="font-display text-[29px] font-bold tracking-[-.05em]" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>{suffix && <span className="text-sm font-semibold text-muted-foreground">{suffix}</span>}</div><p className="mt-1.5 text-[10px] text-muted-foreground">{note}</p></Panel>;
}

function OverviewPage() {
  const analytics = useGetAnalyticsSummary();
  const students = useListStudents();
  const subjects = useListSubjects();
  const marks = useListMarks();
  const { data: summary, isLoading, isError, refetch } = analytics;
  const averages = summary?.subjectAverages ?? [];
  const topSubject = [...averages].sort((a, b) => b.averagePercentage - a.averagePercentage)[0];
  const latestMarks = [...(marks.data ?? [])].sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()).slice(0, 5);
  const maxBar = Math.max(100, ...averages.map((subject) => subject.averagePercentage));
  return <div className="fade-in space-y-5">
    {isError && <ErrorNotice retry={() => void refetch()}/>}
    {isLoading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((x)=><div key={x} className="h-32 animate-pulse rounded-[18px] bg-muted"/> )}</div> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={summary?.studentCount ?? students.data?.length ?? '—'} icon={Users} note="In your class roster" tone="sage"/>
        <StatCard label="Subjects" value={summary?.subjectCount ?? subjects.data?.length ?? '—'} icon={BookOpen} note="Active curriculum" tone="sand"/>
        <StatCard label="Assessments" value={summary?.assessmentCount ?? marks.data?.length ?? '—'} icon={ClipboardList} note="Scores recorded" tone="blue"/>
        <StatCard label="Class average" value={Number(summary?.overallAverage ?? 0).toFixed(1)} suffix="%" icon={Activity} note="Across recorded assessments" tone="rose"/>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-start justify-between border-b border-border px-5 py-4 md:px-6"><div><h2 className="text-[14px] font-bold">Subject performance</h2><p className="mt-1 text-[11px] text-muted-foreground">Average score as a share of maximum marks</p></div><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">By subject</span></div>
          {averages.length ? <div className="space-y-5 px-5 py-6 md:px-6">{averages.map((subject, index) => <div key={subject.subjectId} data-testid={`subject-performance-${subject.subjectId}`}>
            <div className="mb-2 flex items-center justify-between gap-4"><div><span className="text-[12px] font-semibold">{subject.subjectName}</span><span className="ml-2 text-[10px] text-muted-foreground">{subject.assessmentCount} assessments</span></div><span className="font-mono-data text-[11px] font-semibold">{Number(subject.averagePercentage).toFixed(1)}%</span></div>
            <div className="h-[7px] overflow-hidden rounded-full bg-[#eeeae2]"><div className={`h-full rounded-full transition-all duration-500 ${['bg-primary','bg-[#c3a975]','bg-[#7e9aa6]','bg-[#bd8f7e]'][index % 4]}`} style={{ width: `${Math.min(100, Math.max(0, subject.averagePercentage / maxBar * 100))}%` }}/></div>
          </div>)}</div> : <EmptyState title="No subject results yet" detail="Once marks are recorded, performance by subject will appear here."/>}
          <div className="border-t border-border bg-[#fbfaf7] px-5 py-4 md:px-6"><div className="flex items-center gap-2 text-[11px]"><ChartNoAxesCombined size={15} className="text-primary"/><span className="text-muted-foreground">Strongest subject</span><strong className="ml-auto">{topSubject?.subjectName ?? 'Awaiting results'}</strong><span className="font-mono-data font-semibold text-primary">{topSubject ? `${Number(topSubject.averagePercentage).toFixed(1)}%` : '—'}</span></div></div>
        </Panel>
        <div className="space-y-5">
          <Panel className="p-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold text-muted-foreground">PASS RATE</p><div className="mt-2 flex items-baseline gap-1"><span className="font-display text-[34px] font-bold tracking-[-.05em]" data-testid="metric-pass-rate">{Number(summary?.passRate ?? 0).toFixed(1)}</span><span className="text-sm font-semibold text-muted-foreground">%</span></div></div><div className="relative grid h-[66px] w-[66px] place-items-center rounded-full" style={{ background: `conic-gradient(#507d6b ${Math.min(100, Math.max(0, summary?.passRate ?? 0))}%, #eeeae2 0)` }}><div className="grid h-[52px] w-[52px] place-items-center rounded-full bg-card"><Check size={19} className="text-primary"/></div></div></div><div className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">Based on recorded assessment outcomes</div></Panel>
          <Panel className="p-5"><div className="flex items-start justify-between"><div><p className="text-[11px] font-semibold text-muted-foreground">NEEDS A CLOSER LOOK</p><div className="mt-2 font-display text-[34px] font-bold tracking-[-.05em]" data-testid="metric-at-risk">{summary?.atRiskCount ?? '—'}</div><p className="mt-1 text-[11px] text-muted-foreground">Students currently at risk</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f7eeeb] text-[#a46c5f]"><CircleAlert size={17}/></span></div></Panel>
        </div>
      </div>
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6"><div><h2 className="text-[14px] font-bold">Recent assessments</h2><p className="mt-1 text-[11px] text-muted-foreground">The latest marks added to your class</p></div><Link href="/marks" data-testid="link-view-all-marks" className="flex items-center gap-1 text-[11px] font-bold text-primary">All marks <ArrowUpRight size={14}/></Link></div>
        {marks.isLoading ? <LoadingRows/> : latestMarks.length ? <div className="divide-y divide-border">{latestMarks.map((mark) => <div key={mark.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 md:grid-cols-[1.5fr_1fr_1fr_auto] md:px-6" data-testid={`recent-mark-${mark.id}`}><div><div className="text-[12px] font-semibold">{mark.studentName}</div><div className="mt-0.5 text-[10px] text-muted-foreground">{mark.rollNumber}</div></div><div className="hidden text-[11px] text-muted-foreground md:block">{mark.subjectName}</div><div className="hidden text-[11px] text-muted-foreground md:block">{mark.examName} <span className="mx-1">·</span>{mark.term}</div><div className={`rounded-full px-2.5 py-1 text-center font-mono-data text-[10px] font-semibold ${mark.score >= mark.passingMarks ? 'bg-[#edf3ef] text-[#547b69]' : 'bg-[#f7eeeb] text-[#a46c5f]'}`}>{mark.score}<span className="text-muted-foreground">/{mark.maxMarks}</span></div></div>)}</div> : <EmptyState title="No assessments recorded" detail="Add marks to see a quick view of recent classroom outcomes." action={<Link href="/marks" className="text-xs font-bold text-primary" data-testid="link-add-first-mark">Enter marks</Link>}/>}
      </Panel>
    </>}</div>;
}

type ModalProps = { title: string; hint: string; onClose: () => void; children: React.ReactNode; };
function Modal({ title, hint, onClose, children }: ModalProps) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#252a27]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="fade-in max-h-[92dvh] w-full overflow-y-auto rounded-t-[22px] border border-border bg-card p-5 shadow-xl sm:max-w-[510px] sm:rounded-[22px] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="mb-5 flex items-start justify-between"><div><h2 id="modal-title" className="font-display text-[21px] font-bold tracking-[-.03em]">{title}</h2><p className="mt-1 text-[11px] text-muted-foreground">{hint}</p></div><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Close dialog" data-testid="button-close-modal"><X size={17}/></button></div>{children}</div></div>;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-foreground">{label}</span>{children}{hint && <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span>}</label>;
}
const inputClass = 'h-10 w-full rounded-xl border border-input bg-background px-3 text-[12px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/70';
function FormActions({ onCancel, pending, label }: { onCancel: () => void; pending: boolean; label: string }) {
  return <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4"><button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted" data-testid="button-cancel-form">Cancel</button><button type="submit" disabled={pending} className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground disabled:opacity-60" data-testid="button-submit-form">{pending && <LoaderCircle size={14} className="animate-spin"/>}{label}</button></div>;
}

function useInvalidate() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: getListStudentsQueryKey() });
    void client.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
    void client.invalidateQueries({ queryKey: getListMarksQueryKey() });
    void client.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() });
  };
}

function StudentForm({ student, onClose }: { student?: Student; onClose: () => void }) {
  const create = useCreateStudent(); const update = useUpdateStudent(); const refresh = useInvalidate();
  const form = useForm<StudentInput>({ defaultValues: { rollNumber: student?.rollNumber ?? '', fullName: student?.fullName ?? '', grade: student?.grade ?? '', section: student?.section ?? '', email: student?.email ?? '' } });
  const submit = form.handleSubmit((data) => {
    const payload = { ...data, email: data.email?.trim() || null };
    const done = () => { refresh(); onClose(); };
    if (student) update.mutate({ id: student.id, data: payload }, { onSuccess: done });
    else create.mutate({ data: payload }, { onSuccess: done });
  });
  const pending = create.isPending || update.isPending;
  return <Modal title={student ? 'Edit student' : 'Add a student'} hint="Keep roster details accurate and easy to find." onClose={onClose}><Form {...form}><form onSubmit={submit} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><input className={inputClass} placeholder="e.g. Aisha Rahman" {...form.register('fullName', { required: 'Enter a student name' })} data-testid="input-student-name"/></Field><Field label="Roll number"><input className={inputClass} placeholder="e.g. 08-214" {...form.register('rollNumber', { required: 'Enter a roll number' })} data-testid="input-student-roll"/></Field><Field label="Grade"><input className={inputClass} placeholder="e.g. Grade 8" {...form.register('grade', { required: 'Enter a grade' })} data-testid="input-student-grade"/></Field><Field label="Section"><input className={inputClass} placeholder="e.g. Cedar" {...form.register('section', { required: 'Enter a section' })} data-testid="input-student-section"/></Field></div>
    <Field label="Email address" hint="Optional"><input type="email" className={inputClass} placeholder="student@school.edu" {...form.register('email')} data-testid="input-student-email"/></Field>
    {(create.isError || update.isError) && <p className="text-xs text-destructive" data-testid="status-form-error">Could not save the student. Please try again.</p>}
    <FormActions onCancel={onClose} pending={pending} label={student ? 'Save changes' : 'Add student'}/>
  </form></Form></Modal>;
}

function SubjectForm({ subject, onClose }: { subject?: Subject; onClose: () => void }) {
  const create = useCreateSubject(); const update = useUpdateSubject(); const refresh = useInvalidate();
  const form = useForm<SubjectInput>({ defaultValues: { code: subject?.code ?? '', name: subject?.name ?? '', maxMarks: subject?.maxMarks ?? 100, passingMarks: subject?.passingMarks ?? 40 } });
  const submit = form.handleSubmit((data) => {
    const payload = { ...data, maxMarks: Number(data.maxMarks), passingMarks: Number(data.passingMarks) };
    const done = () => { refresh(); onClose(); };
    if (subject) update.mutate({ id: subject.id, data: payload }, { onSuccess: done }); else create.mutate({ data: payload }, { onSuccess: done });
  });
  const pending = create.isPending || update.isPending;
  return <Modal title={subject ? 'Edit subject' : 'Add a subject'} hint="Set the subject details and its passing threshold." onClose={onClose}><Form {...form}><form onSubmit={submit} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-[.7fr_1.3fr]"><Field label="Subject code"><input className={inputClass} placeholder="e.g. SCI-08" {...form.register('code', { required: true })} data-testid="input-subject-code"/></Field><Field label="Subject name"><input className={inputClass} placeholder="e.g. General science" {...form.register('name', { required: true })} data-testid="input-subject-name"/></Field></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Maximum marks"><input type="number" min="1" className={inputClass} {...form.register('maxMarks', { required: true, min: 1, valueAsNumber: true })} data-testid="input-subject-max"/></Field><Field label="Passing marks"><input type="number" min="0" className={inputClass} {...form.register('passingMarks', { required: true, min: 0, valueAsNumber: true })} data-testid="input-subject-passing"/></Field></div>
    {(create.isError || update.isError) && <p className="text-xs text-destructive" data-testid="status-form-error">Could not save the subject. Please try again.</p>}
    <FormActions onCancel={onClose} pending={pending} label={subject ? 'Save changes' : 'Add subject'}/>
  </form></Form></Modal>;
}

function MarkForm({ mark, onClose, students, subjects }: { mark?: Mark; onClose: () => void; students: Student[]; subjects: Subject[] }) {
  const create = useCreateMark(); const update = useUpdateMark(); const refresh = useInvalidate();
  const form = useForm<MarkInput>({ defaultValues: { studentId: mark?.studentId ?? 0, subjectId: mark?.subjectId ?? 0, score: mark?.score ?? 0, examName: mark?.examName ?? '', term: mark?.term ?? '', assessmentDate: mark?.assessmentDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10) } });
  const submit = form.handleSubmit((data) => {
    const payload = { ...data, studentId: Number(data.studentId), subjectId: Number(data.subjectId), score: Number(data.score) };
    const done = () => { refresh(); onClose(); };
    if (mark) update.mutate({ id: mark.id, data: payload }, { onSuccess: done }); else create.mutate({ data: payload }, { onSuccess: done });
  });
  const pending = create.isPending || update.isPending;
  return <Modal title={mark ? 'Edit assessment mark' : 'Enter an assessment mark'} hint="Choose the student, subject, and assessment result." onClose={onClose}><Form {...form}><form onSubmit={submit} className="space-y-4">
    <Field label="Student"><select className={inputClass} {...form.register('studentId', { required: true, valueAsNumber: true, min: 1 })} data-testid="select-mark-student"><option value={0}>Select a student</option>{students.map((s)=><option key={s.id} value={s.id}>{s.fullName} · {s.rollNumber}</option>)}</select></Field>
    <Field label="Subject"><select className={inputClass} {...form.register('subjectId', { required: true, valueAsNumber: true, min: 1 })} data-testid="select-mark-subject"><option value={0}>Select a subject</option>{subjects.map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Score"><input type="number" min="0" className={inputClass} {...form.register('score', { required: true, min: 0, valueAsNumber: true })} data-testid="input-mark-score"/></Field><Field label="Assessment date"><input type="date" className={inputClass} {...form.register('assessmentDate', { required: true })} data-testid="input-mark-date"/></Field><Field label="Exam name"><input className={inputClass} placeholder="e.g. Unit 3 quiz" {...form.register('examName', { required: true })} data-testid="input-mark-exam"/></Field><Field label="Term"><input className={inputClass} placeholder="e.g. Spring term" {...form.register('term', { required: true })} data-testid="input-mark-term"/></Field></div>
    {(create.isError || update.isError) && <p className="text-xs text-destructive" data-testid="status-form-error">Could not save the mark. Please check the details and try again.</p>}
    <FormActions onCancel={onClose} pending={pending} label={mark ? 'Save changes' : 'Save mark'}/>
  </form></Form></Modal>;
}

function PageHeading({ total, action, actionLabel }: { total: number; action: () => void; actionLabel: string }) {
  return <div className="mb-4 flex items-center justify-between"><div className="text-[11px] text-muted-foreground"><span className="font-mono-data font-semibold text-foreground" data-testid="text-record-count">{total}</span> records</div><button onClick={action} className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-[11px] font-bold text-primary-foreground transition hover:brightness-95" data-testid="button-add-record"><Plus size={15}/>{actionLabel}</button></div>;
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${inputClass} pl-9`} data-testid="input-search-records"/></label>;
}

function StudentsPage() {
  const query = useListStudents(); const students = query.data ?? [];
  const remove = useDeleteStudent(); const refresh = useInvalidate();
  const [search, setSearch] = useState(''); const [formStudent, setFormStudent] = useState<Student | null | undefined>(undefined);
  const filtered = useMemo(() => students.filter((s) => `${s.fullName} ${s.rollNumber} ${s.grade} ${s.section} ${s.email ?? ''}`.toLowerCase().includes(search.toLowerCase())), [students, search]);
  const onDelete = (student: Student) => { if (window.confirm(`Remove ${student.fullName} from the student records?`)) remove.mutate({ id: student.id }, { onSuccess: refresh }); };
  return <div className="fade-in">
    <PageHeading total={students.length} action={() => setFormStudent(null)} actionLabel="Add student"/>
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="w-full sm:max-w-[310px]"><SearchInput value={search} onChange={setSearch} placeholder="Search name, roll, grade…"/></div><div className="flex items-center gap-2 text-[10px] text-muted-foreground"><SlidersHorizontal size={14}/>Sorted by name</div></div>
      {query.isLoading ? <LoadingRows/> : query.isError ? <div className="p-5"><ErrorNotice retry={() => void query.refetch()}/></div> : filtered.length ? <>
        <div className="hidden grid-cols-[1.6fr_.7fr_.8fr_1.2fr_90px] gap-4 bg-[#faf9f6] px-5 py-3 text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground md:grid"><span>Student</span><span>Roll no.</span><span>Grade / section</span><span>Email</span><span className="text-right">Actions</span></div>
        <div className="divide-y divide-border">{filtered.map((student) => <div key={student.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.6fr_.7fr_.8fr_1.2fr_90px] md:items-center md:gap-4 md:px-5" data-testid={`row-student-${student.id}`}>
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edf2ee] text-[11px] font-bold text-[#557766]">{student.fullName.split(/\s+/).map((n)=>n[0]).slice(0,2).join('').toUpperCase()}</span><div><div className="text-[12px] font-bold" data-testid={`text-student-name-${student.id}`}>{student.fullName}</div><div className="mt-0.5 text-[10px] text-muted-foreground">Added {new Date(student.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div></div></div>
          <div className="font-mono-data text-[11px] md:block"><span className="mr-1 text-[9px] text-muted-foreground md:hidden">ROLL</span>{student.rollNumber}</div><div className="text-[11px] text-muted-foreground">{student.grade} <span className="mx-1 text-border">/</span>{student.section}</div><div className="truncate text-[11px] text-muted-foreground">{student.email || '—'}</div>
          <div className="flex justify-end gap-1"><button onClick={() => setFormStudent(student)} aria-label={`Edit ${student.fullName}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" data-testid={`button-edit-student-${student.id}`}><Pencil size={14}/></button><button onClick={() => onDelete(student)} aria-label={`Delete ${student.fullName}`} disabled={remove.isPending} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-[#fbefed] hover:text-destructive" data-testid={`button-delete-student-${student.id}`}><Trash2 size={14}/></button></div>
        </div>)}</div>
      </> : <EmptyState title={search ? 'No matching students' : 'Your roster starts here'} detail={search ? 'Try another name, roll number, or grade.' : 'Add your first student to begin building a clear class record.'} action={!search && <button onClick={() => setFormStudent(null)} className="text-xs font-bold text-primary" data-testid="button-add-first-student">Add student</button>}/>}
    </Panel>
    {formStudent !== undefined && <StudentForm student={formStudent ?? undefined} onClose={() => setFormStudent(undefined)}/>}
  </div>;
}

function SubjectsPage() {
  const query = useListSubjects(); const subjects = query.data ?? [];
  const remove = useDeleteSubject(); const refresh = useInvalidate();
  const [search, setSearch] = useState(''); const [formSubject, setFormSubject] = useState<Subject | null | undefined>(undefined);
  const filtered = useMemo(() => subjects.filter((s) => `${s.code} ${s.name}`.toLowerCase().includes(search.toLowerCase())), [subjects, search]);
  const onDelete = (subject: Subject) => { if (window.confirm(`Remove ${subject.name} from the subject catalog?`)) remove.mutate({ id: subject.id }, { onSuccess: refresh }); };
  return <div className="fade-in"><PageHeading total={subjects.length} action={() => setFormSubject(null)} actionLabel="Add subject"/>
    {query.isLoading ? <Panel><LoadingRows/></Panel> : query.isError ? <ErrorNotice retry={() => void query.refetch()}/> : filtered.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div className="sm:col-span-2 xl:col-span-3"><SearchInput value={search} onChange={setSearch} placeholder="Search subject name or code…"/></div>
      {filtered.map((subject,index) => <Panel className="overflow-hidden p-5" key={subject.id} ><div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-[13px] ${['bg-[#edf3ef] text-[#547b69]','bg-[#f5f0e6] text-[#9a8051]','bg-[#edf1f3] text-[#5a7582]'][index%3]}`}><BookOpen size={18}/></span><div><p className="font-mono-data text-[10px] font-semibold text-muted-foreground" data-testid={`text-subject-code-${subject.id}`}>{subject.code}</p><h2 className="mt-0.5 text-[14px] font-bold" data-testid={`text-subject-name-${subject.id}`}>{subject.name}</h2></div></div><div className="flex gap-1"><button onClick={() => setFormSubject(subject)} aria-label={`Edit ${subject.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" data-testid={`button-edit-subject-${subject.id}`}><Pencil size={14}/></button><button onClick={() => onDelete(subject)} aria-label={`Delete ${subject.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-[#fbefed] hover:text-destructive" data-testid={`button-delete-subject-${subject.id}`}><Trash2 size={14}/></button></div></div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-4"><div><div className="text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">Maximum</div><div className="mt-1 font-mono-data text-[14px] font-semibold">{subject.maxMarks}<span className="ml-1 text-[10px] font-normal text-muted-foreground">pts</span></div></div><div><div className="text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">Passing score</div><div className="mt-1 font-mono-data text-[14px] font-semibold">{subject.passingMarks}<span className="ml-1 text-[10px] font-normal text-muted-foreground">pts</span></div></div></div>
      </Panel>)}
    </div> : <Panel><EmptyState title={search ? 'No matching subjects' : 'No subjects added'} detail={search ? 'Try another subject name or code.' : 'Add subjects to define score limits and organize your class results.'} action={!search && <button onClick={() => setFormSubject(null)} className="text-xs font-bold text-primary" data-testid="button-add-first-subject">Add subject</button>}/></Panel>}
    {formSubject !== undefined && <SubjectForm subject={formSubject ?? undefined} onClose={() => setFormSubject(undefined)}/>}
  </div>;
}

function MarksPage() {
  const markQuery = useListMarks(); const studentQuery = useListStudents(); const subjectQuery = useListSubjects();
  const marks = markQuery.data ?? []; const students = studentQuery.data ?? []; const subjects = subjectQuery.data ?? [];
  const remove = useDeleteMark(); const refresh = useInvalidate();
  const [search, setSearch] = useState(''); const [studentFilter, setStudentFilter] = useState('all'); const [subjectFilter, setSubjectFilter] = useState('all'); const [markForm, setMarkForm] = useState<Mark | null | undefined>(undefined);
  const filtered = useMemo(() => marks.filter((m) => {
    const textMatch = `${m.studentName} ${m.rollNumber} ${m.subjectName} ${m.examName} ${m.term}`.toLowerCase().includes(search.toLowerCase());
    return textMatch && (studentFilter === 'all' || String(m.studentId) === studentFilter) && (subjectFilter === 'all' || String(m.subjectId) === subjectFilter);
  }), [marks, search, studentFilter, subjectFilter]);
  const onDelete = (mark: Mark) => { if (window.confirm(`Delete the ${mark.examName} mark for ${mark.studentName}?`)) remove.mutate({ id: mark.id }, { onSuccess: refresh }); };
  return <div className="fade-in"><PageHeading total={marks.length} action={() => setMarkForm(null)} actionLabel="Enter marks"/>
    <Panel className="overflow-hidden">
      <div className="grid gap-2 border-b border-border p-4 sm:grid-cols-[minmax(180px,1fr)_180px_180px]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search student, subject, exam…"/>
        <label className="relative"><select value={studentFilter} onChange={(e)=>setStudentFilter(e.target.value)} className={`${inputClass} appearance-none pr-8`} data-testid="select-filter-student"><option value="all">All students</option>{students.map((s)=><option key={s.id} value={s.id}>{s.fullName}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"/></label>
        <label className="relative"><select value={subjectFilter} onChange={(e)=>setSubjectFilter(e.target.value)} className={`${inputClass} appearance-none pr-8`} data-testid="select-filter-subject"><option value="all">All subjects</option>{subjects.map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"/></label>
      </div>
      {markQuery.isLoading || studentQuery.isLoading || subjectQuery.isLoading ? <LoadingRows/> : markQuery.isError ? <div className="p-5"><ErrorNotice retry={() => void markQuery.refetch()}/></div> : filtered.length ? <>
        <div className="hidden grid-cols-[1.3fr_1fr_1fr_.85fr_.8fr_86px] gap-3 bg-[#faf9f6] px-5 py-3 text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground lg:grid"><span>Student</span><span>Subject</span><span>Assessment</span><span>Date</span><span>Score</span><span className="text-right">Actions</span></div>
        <div className="divide-y divide-border">{filtered.map((mark) => <div key={mark.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-4 sm:grid-cols-[1.3fr_1fr_auto] lg:grid-cols-[1.3fr_1fr_1fr_.85fr_.8fr_86px] lg:gap-3 lg:px-5" data-testid={`row-mark-${mark.id}`}>
          <div><div className="text-[12px] font-bold" data-testid={`text-mark-student-${mark.id}`}>{mark.studentName}</div><div className="mt-0.5 font-mono-data text-[9px] text-muted-foreground">{mark.rollNumber}</div></div>
          <div className="text-[11px] text-muted-foreground">{mark.subjectName}</div><div className="hidden sm:block"><div className="text-[11px] font-medium">{mark.examName}</div><div className="mt-0.5 text-[9px] text-muted-foreground">{mark.term}</div></div><div className="hidden font-mono-data text-[10px] text-muted-foreground lg:block">{new Date(mark.assessmentDate).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</div>
          <div className="text-right sm:text-left"><span className={`inline-flex rounded-full px-2.5 py-1 font-mono-data text-[10px] font-semibold ${mark.score >= mark.passingMarks ? 'bg-[#edf3ef] text-[#547b69]' : 'bg-[#f7eeeb] text-[#a46c5f]'}`} data-testid={`text-mark-score-${mark.id}`}>{mark.score}<span className="mx-1 opacity-50">/</span>{mark.maxMarks}</span></div>
          <div className="col-span-2 flex justify-end gap-1 sm:col-span-1"><button onClick={() => setMarkForm(mark)} aria-label={`Edit mark for ${mark.studentName}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" data-testid={`button-edit-mark-${mark.id}`}><Pencil size={14}/></button><button onClick={() => onDelete(mark)} aria-label={`Delete mark for ${mark.studentName}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-[#fbefed] hover:text-destructive" data-testid={`button-delete-mark-${mark.id}`}><Trash2 size={14}/></button></div>
        </div>)}</div>
      </> : <EmptyState title={search || studentFilter !== 'all' || subjectFilter !== 'all' ? 'No matching marks' : 'No marks recorded yet'} detail={search || studentFilter !== 'all' || subjectFilter !== 'all' ? 'Adjust your search or filters to see more records.' : 'Enter an assessment result to begin tracking academic outcomes.'} action={!search && studentFilter === 'all' && subjectFilter === 'all' && <button onClick={() => setMarkForm(null)} className="text-xs font-bold text-primary" data-testid="button-add-first-mark">Enter marks</button>}/>}
    </Panel>
    {markForm !== undefined && <MarkForm mark={markForm ?? undefined} students={students} subjects={subjects} onClose={() => setMarkForm(undefined)}/>}
  </div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch>
    <Route path="/">{() => <AppShell page="Overview"><OverviewPage/></AppShell>}</Route>
    <Route path="/students">{() => <AppShell page="Students"><StudentsPage/></AppShell>}</Route>
    <Route path="/subjects">{() => <AppShell page="Subjects"><SubjectsPage/></AppShell>}</Route>
    <Route path="/marks">{() => <AppShell page="Marks"><MarksPage/></AppShell>}</Route>
    <Route component={NotFound}/>
  </Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>;
}
export default App;
