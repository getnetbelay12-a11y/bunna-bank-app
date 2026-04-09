import { useEffect, useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  FeePlanRecord,
  SchoolCollectionItem,
  SchoolInvoiceItem,
  SchoolPortfolioItem,
  StudentImportRowInput,
  StudentRegistryItem,
} from '../../core/api/contracts';
import type { SchoolSession } from '../../core/session';
import {
  DashboardAlertCard,
  DashboardCard,
  DashboardDataTable,
  DashboardGrid,
  DashboardKpiCard,
  DashboardMiniBars,
  DashboardPage,
} from '../../shared/components/BankingDashboard';

export type SchoolSisSection =
  | 'schoolDashboard'
  | 'schoolStudents'
  | 'schoolBilling'
  | 'schoolPayments'
  | 'schoolReports'
  | 'schoolCommunication'
  | 'schoolSettings';

type SchoolSisConsolePageProps = {
  session: SchoolSession;
  section: SchoolSisSection;
  onNavigate?: (section: SchoolSisSection) => void;
};

const DEFAULT_STUDENT_FORM = {
  studentId: 'ST-9001',
  fullName: 'Demo Student',
  grade: 'Grade 7',
  section: 'A',
  guardianName: 'Abebe Kebede',
  guardianPhone: '0911000001',
};

export function SchoolSisConsolePage({
  session,
  section,
  onNavigate,
}: SchoolSisConsolePageProps) {
  const { authApi, schoolConsoleApi } = useAppClient();
  const [school, setSchool] = useState<SchoolPortfolioItem | null>(null);
  const [registry, setRegistry] = useState<StudentRegistryItem[]>([]);
  const [invoices, setInvoices] = useState<SchoolInvoiceItem[]>([]);
  const [collections, setCollections] = useState<SchoolCollectionItem[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlanRecord[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [studentForm, setStudentForm] = useState(DEFAULT_STUDENT_FORM);
  const [billingForm, setBillingForm] = useState({
    grade: '',
    monthlyFee: '',
    dueDate: '5',
    penaltyPercent: '0',
  });
  const [studentMessage, setStudentMessage] = useState('');
  const [billingMessage, setBillingMessage] = useState('');
  const [communicationMessage, setCommunicationMessage] = useState('');
  const [announcementText, setAnnouncementText] = useState(
    'School fee reminder: please review upcoming balances in the Bunna Bank app.',
  );

  useEffect(() => {
    if (!schoolConsoleApi) {
      return;
    }

    let cancelled = false;
    let intervalId: number | undefined;

    const loadWorkspace = async () => {
      const [overview, registryResult, feePlanResult] = await Promise.all([
        schoolConsoleApi.getOverview(),
        schoolConsoleApi.getRegistry({ schoolId: session.schoolId }),
        schoolConsoleApi.getFeePlans(session.schoolId),
      ]);

      if (cancelled) {
        return;
      }

      setSchool(overview.schools.find((item) => item.id === session.schoolId) ?? null);
      setInvoices(overview.invoices.filter((item) => item.schoolId === session.schoolId));
      setCollections(overview.collections.filter((item) => item.schoolId === session.schoolId));
      setRegistry(registryResult);
      setFeePlans(feePlanResult);
    };

    void loadWorkspace();
    intervalId = window.setInterval(() => {
      void loadWorkspace();
    }, 10000);

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [schoolConsoleApi, session.schoolId]);

  const gradeOptions = useMemo(
    () => Array.from(new Set(registry.map((item) => item.grade))).sort(),
    [registry],
  );
  const sectionOptions = useMemo(
    () => Array.from(new Set(registry.map((item) => item.section))).sort(),
    [registry],
  );

  const filteredStudents = registry.filter((item) => {
    if (gradeFilter && item.grade !== gradeFilter) {
      return false;
    }
    if (sectionFilter && item.section !== sectionFilter) {
      return false;
    }
    const query = studentSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return [item.fullName, item.studentId, item.guardianName, item.guardianPhone]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  const studentsOverdue = new Set(
    invoices
      .filter((item) => item.status === 'open' || item.status === 'partially_paid')
      .map((item) => item.studentId),
  );
  const missingDataCount = registry.filter((item) => !item.guardianPhone.trim().length).length;
  const totalCollected = collections.reduce((sum, item) => sum + item.amount, 0);
  const collectionBars = buildCollectionBars(collections);

  async function handleAddStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolConsoleApi) {
      return;
    }

    const studentId = studentForm.studentId.trim();
    const fullName = studentForm.fullName.trim();
    const grade = studentForm.grade.trim();
    const section = studentForm.section.trim();
    const guardianName = studentForm.guardianName.trim();
    const guardianPhone = studentForm.guardianPhone.trim();

    const payload: StudentImportRowInput = {
      studentId,
      fullName,
      grade,
      section,
      guardianName,
      guardianPhone,
    };

    try {
      const importResult = await schoolConsoleApi.importStudents({
        schoolId: session.schoolId,
        students: [payload],
      });
      const assignedStudentId = importResult.items[0]?.studentId ?? studentId;

      const guardian = await schoolConsoleApi.createGuardian({
        studentId: assignedStudentId,
        fullName: guardianName,
        phone: guardianPhone,
        relationship: 'parent',
        status: guardianPhone ? 'linked' : 'pending_verification',
      });

      let linkedCustomerId = '';
      if (guardianPhone && authApi.checkExistingAccount) {
        const existingAccount = await authApi.checkExistingAccount({
          phoneNumber: guardianPhone,
        });

        if (existingAccount.exists && existingAccount.customerId) {
          linkedCustomerId = existingAccount.customerId;
          await schoolConsoleApi.createGuardianStudentLink({
            studentId: assignedStudentId,
            guardianId: guardian.guardianId,
            memberCustomerId: existingAccount.customerId,
            relationship: 'parent',
            status: 'active',
          });
        }
      }

      setRegistry(
        await schoolConsoleApi.getRegistry({ schoolId: session.schoolId }),
      );
      setStudentForm(DEFAULT_STUDENT_FORM);
      setStudentMessage(
        linkedCustomerId
            ? `Student ${assignedStudentId} added and linked to ${linkedCustomerId} for mobile app access.`
            : `Student ${assignedStudentId} added to the registry.`,
      );
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unable to add student.';
      setStudentMessage(text);
    }
  }

  async function handleCreateBilling(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolConsoleApi || !school) {
      return;
    }

    const total = Number(billingForm.monthlyFee || 0);
    await schoolConsoleApi.createFeePlan({
      schoolId: session.schoolId,
      schoolName: school.name,
      academicYear: '2026',
      term: 'Term 1',
      grade: billingForm.grade,
      name: `${billingForm.grade} Monthly Fee`,
      status: 'active',
      items: [
        {
          label: 'Monthly tuition',
          amount: total,
        },
      ],
    });
    await schoolConsoleApi.generateInvoiceBatch({
      schoolId: session.schoolId,
      academicYear: '2026',
      term: 'Term 1',
      grade: billingForm.grade,
    });

    const [overview, feePlanResult] = await Promise.all([
      schoolConsoleApi.getOverview(),
      schoolConsoleApi.getFeePlans(session.schoolId),
    ]);
    setInvoices(overview.invoices.filter((item) => item.schoolId === session.schoolId));
    setCollections(overview.collections.filter((item) => item.schoolId === session.schoolId));
    setFeePlans(feePlanResult);
    setBillingMessage(
      `Billing configured for ${billingForm.grade} with ETB ${total.toLocaleString()} monthly fee, due day ${billingForm.dueDate}, and ${billingForm.penaltyPercent}% penalty.`,
    );
  }

  async function handleSendReminders() {
    if (!schoolConsoleApi) {
      return;
    }

    const invoiceNos = invoices
      .filter((item) => item.status === 'open' || item.status === 'partially_paid')
      .map((item) => item.invoiceNo);
    if (invoiceNos.length === 0) {
      setCommunicationMessage('No overdue or partial invoices are queued for reminders.');
      return;
    }

    const result = await schoolConsoleApi.sendInvoiceReminders(invoiceNos);
    setCommunicationMessage(result.message);
  }

  function handleAnnouncement() {
    setCommunicationMessage(`Announcement drafted for parents: "${announcementText}"`);
  }

  async function handleQuickReminder() {
    await handleSendReminders();
    onNavigate?.('schoolCommunication');
  }

  function handleExportReport() {
    const rows = [
      ['studentId', 'studentName', 'grade', 'invoiceNo', 'status', 'balance', 'dueDate'],
      ...invoices.map((item) => [
        item.studentId,
        item.studentName,
        registry.find((student) => student.studentId === item.studentId)?.grade ?? '',
        item.invoiceNo,
        item.status,
        String(item.balance),
        item.dueDate,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${session.schoolId}-school-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardPage>
      {section === 'schoolDashboard' ? (
        <>
          <div className="console-kpi-strip">
            <DashboardKpiCard icon="ST" label="Students" value={registry.length.toLocaleString()} />
            <DashboardKpiCard icon="IV" label="Invoices" value={invoices.length.toLocaleString()} />
            <DashboardKpiCard icon="CL" label="Collected" value={formatMoney(totalCollected)} />
            <DashboardKpiCard
              icon="OD"
              label="Overdue"
              value={studentsOverdue.size.toLocaleString()}
            />
          </div>
          <div className="critical-alert-strip">
            <DashboardAlertCard
              label="Overdue invoices"
              value={studentsOverdue.size.toLocaleString()}
              tone="red"
            />
            <DashboardAlertCard
              label="Missing parent data"
              value={missingDataCount.toLocaleString()}
              tone="orange"
            />
          </div>
          <DashboardGrid>
            <DashboardCard
              title="Collection trend"
              description="Daily collection activity across the current school billing cycle."
            >
              <DashboardMiniBars items={collectionBars} />
            </DashboardCard>
            <DashboardCard
              title="Quick actions"
              description="Jump into the most common school-side operational tasks."
            >
              <div className="loan-filter-row">
                <button
                  type="button"
                  className="channel-chip active"
                  onClick={() => onNavigate?.('schoolStudents')}
                >
                  Add student
                </button>
                <button
                  type="button"
                  className="channel-chip"
                  onClick={() => onNavigate?.('schoolBilling')}
                >
                  Create invoice
                </button>
                <button
                  type="button"
                  className="channel-chip"
                  onClick={() => void handleQuickReminder()}
                >
                  Send reminder
                </button>
                <button
                  type="button"
                  className="channel-chip"
                  onClick={handleExportReport}
                >
                  Export report
                </button>
              </div>
              {communicationMessage ? <p className="muted">{communicationMessage}</p> : null}
            </DashboardCard>
          </DashboardGrid>
        </>
      ) : null}

      {section === 'schoolStudents' ? (
        <DashboardGrid cols={1}>
          <DashboardCard title="Student registry" description="Search and manage student and parent records.">
            <div className="dashboard-toolbar">
              <label className="field-stack" style={{ minWidth: 260 }}>
                <span>Search</span>
                <input
                  type="search"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Student, parent, phone, ID"
                />
              </label>
              <label className="field-stack">
                <span>Grade</span>
                <select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)}>
                  <option value="">All grades</option>
                  {gradeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-stack">
                <span>Section</span>
                <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
                  <option value="">All sections</option>
                  {sectionOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onNavigate?.('schoolStudents')}
              >
                Add student
              </button>
            </div>
            <DashboardDataTable
              headers={['Student', 'Parent', 'Grade', 'Fee status', 'Parent update', 'Status']}
              rows={filteredStudents.map((item) => [
                `${item.fullName} (${item.studentId})`,
                `${item.guardianName} · ${item.guardianPhone || 'No phone'}`,
                item.grade,
                item.paymentSummary
                  ? `${titleCase(item.paymentSummary.paymentStatus)} · ${formatMoney(item.paymentSummary.outstandingBalance)} outstanding`
                  : 'Pending billing',
                item.parentUpdateSummary ??
                  `${item.grade} · No report update published yet.`,
                item.status,
              ])}
            />
          </DashboardCard>
          <DashboardCard title="New student" description="Add a student to the school registry.">
            <form className="form-stack" onSubmit={(event) => void handleAddStudent(event)}>
              <div className="form-grid">
                <label className="field-stack">
                  <span>Student ID</span>
                  <input
                    value={studentForm.studentId}
                    onChange={(event) =>
                      setStudentForm((current) => ({ ...current, studentId: event.target.value }))
                    }
                  />
                </label>
                <label className="field-stack">
                  <span>Student full name</span>
                  <input
                    value={studentForm.fullName}
                    onChange={(event) =>
                      setStudentForm((current) => ({ ...current, fullName: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="form-grid">
                <label className="field-stack">
                  <span>Grade</span>
                  <input
                    value={studentForm.grade}
                    onChange={(event) =>
                      setStudentForm((current) => ({ ...current, grade: event.target.value }))
                    }
                  />
                </label>
                <label className="field-stack">
                  <span>Section</span>
                  <input
                    value={studentForm.section}
                    onChange={(event) =>
                      setStudentForm((current) => ({ ...current, section: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="form-grid">
                <label className="field-stack">
                  <span>Parent name</span>
                  <input
                    value={studentForm.guardianName}
                    onChange={(event) =>
                      setStudentForm((current) => ({ ...current, guardianName: event.target.value }))
                    }
                  />
                </label>
                <label className="field-stack">
                  <span>Parent phone</span>
                  <input
                    value={studentForm.guardianPhone}
                    onChange={(event) =>
                      setStudentForm((current) => ({ ...current, guardianPhone: event.target.value }))
                    }
                  />
                </label>
              </div>
              <button type="submit" className="btn btn-primary">
                Add Student
              </button>
              {studentMessage ? <p className="muted">{studentMessage}</p> : null}
            </form>
          </DashboardCard>
        </DashboardGrid>
      ) : null}

      {section === 'schoolBilling' ? (
        <DashboardGrid>
          <DashboardCard title="Create invoice" description="Configure monthly fee, due day, and penalties.">
            <form className="form-stack" onSubmit={(event) => void handleCreateBilling(event)}>
              <label className="field-stack">
                <span>Grade</span>
                <select
                  value={billingForm.grade}
                  onChange={(event) => setBillingForm((current) => ({ ...current, grade: event.target.value }))}
                >
                  <option value="">Select grade</option>
                  {gradeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label className="field-stack">
                  <span>Monthly fee setup</span>
                  <input
                    type="number"
                    value={billingForm.monthlyFee}
                    onChange={(event) =>
                      setBillingForm((current) => ({ ...current, monthlyFee: event.target.value }))
                    }
                  />
                </label>
                <label className="field-stack">
                  <span>Due date</span>
                  <input
                    value={billingForm.dueDate}
                    onChange={(event) =>
                      setBillingForm((current) => ({ ...current, dueDate: event.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="field-stack">
                <span>Penalties (%)</span>
                <input
                  type="number"
                  value={billingForm.penaltyPercent}
                  onChange={(event) =>
                    setBillingForm((current) => ({
                      ...current,
                      penaltyPercent: event.target.value,
                    }))
                  }
                />
              </label>
              <button type="submit" className="btn btn-primary">
                Create Billing Setup
              </button>
              {billingMessage ? <p className="muted">{billingMessage}</p> : null}
            </form>
          </DashboardCard>
          <DashboardCard title="Status summary" description="Current fee plans and invoice posture for this school.">
            <DashboardDataTable
              headers={['Plan', 'Grade', 'Total', 'Status']}
              rows={feePlans.map((item) => [item.name, item.grade, formatMoney(item.total), item.status])}
            />
          </DashboardCard>
        </DashboardGrid>
      ) : null}

      {section === 'schoolPayments' ? (
        <DashboardGrid cols={1}>
          <div className="console-kpi-strip">
            <DashboardKpiCard icon="TC" label="Total collected" value={formatMoney(totalCollected)} />
            <DashboardKpiCard
              icon="DY"
              label="Daily summary"
              value={formatMoney(collections.reduce((sum, item) => sum + item.amount, 0))}
            />
          </div>
          <DashboardCard title="Payment transactions" description="Daily payment entries from the parent payment channel.">
            <DashboardDataTable
              headers={['Receipt', 'Student', 'Channel', 'Amount', 'Recorded']}
              rows={collections.map((item) => [
                item.receiptNo,
                item.studentId,
                item.channel,
                formatMoney(item.amount),
                formatDate(item.recordedAt),
              ])}
            />
          </DashboardCard>
        </DashboardGrid>
      ) : null}

      {section === 'schoolReports' ? (
        <DashboardGrid>
          <DashboardCard title="Collection report" description="Recent collection totals by day.">
            <DashboardMiniBars items={collectionBars} />
          </DashboardCard>
          <DashboardCard title="Overdue report" description="Students with open or partially paid balances.">
            <DashboardDataTable
              headers={['Student', 'Balance', 'Status']}
              rows={invoices
                .filter((item) => item.status === 'open' || item.status === 'partially_paid')
                .map((item) => [item.studentName, formatMoney(item.balance), item.status])}
            />
          </DashboardCard>
          <DashboardCard title="Trends" description="Simple tuition and collection trend view.">
            <DashboardMiniBars items={buildTrendBars(invoices, collections)} />
          </DashboardCard>
        </DashboardGrid>
      ) : null}

      {section === 'schoolCommunication' ? (
        <DashboardGrid>
          <DashboardCard title="Send reminder" description="Queue parent reminders for overdue invoices.">
            <div className="loan-filter-row">
              <button type="button" className="btn btn-primary" onClick={() => void handleSendReminders()}>
                Send Reminders
              </button>
            </div>
            {communicationMessage ? <p className="muted">{communicationMessage}</p> : null}
          </DashboardCard>
          <DashboardCard title="Send announcement" description="Prepare a school-wide parent announcement.">
            <label className="field-stack">
              <span>Announcement</span>
              <textarea
                rows={5}
                value={announcementText}
                onChange={(event) => setAnnouncementText(event.target.value)}
              />
            </label>
            <div className="loan-filter-row">
              <button type="button" className="btn btn-primary" onClick={handleAnnouncement}>
                Send Announcement
              </button>
            </div>
          </DashboardCard>
        </DashboardGrid>
      ) : null}

      {section === 'schoolSettings' ? (
        <DashboardGrid>
          <DashboardCard title="School profile" description="Current school profile and branch context.">
            <DashboardDataTable
              headers={['Field', 'Value']}
              rows={[
                ['School', session.schoolName],
                ['Branch', session.branchName ?? 'Assigned branch'],
                ['School code', school?.code ?? 'n/a'],
                ['City', school?.city ?? 'n/a'],
              ]}
            />
          </DashboardCard>
          <DashboardCard title="Billing defaults" description="Reference values for the school-side billing workflow.">
            <DashboardDataTable
              headers={['Setting', 'Value']}
              rows={[
                ['Default due day', billingForm.dueDate],
                ['Penalty rate', `${billingForm.penaltyPercent}%`],
                ['Active fee plans', feePlans.length.toLocaleString()],
                ['Parent phones on file', registry.filter((item) => item.guardianPhone).length.toLocaleString()],
              ]}
            />
          </DashboardCard>
        </DashboardGrid>
      ) : null}
    </DashboardPage>
  );
}

function buildCollectionBars(items: SchoolCollectionItem[]) {
  const grouped = new Map<string, number>();
  for (const item of items) {
    const key = item.recordedAt.slice(5, 10);
    grouped.set(key, (grouped.get(key) ?? 0) + item.amount);
  }
  return Array.from(grouped.entries())
    .slice(-5)
    .map(([label, value]) => ({ label, value, tone: 'teal' as const }));
}

function buildTrendBars(invoices: SchoolInvoiceItem[], collections: SchoolCollectionItem[]) {
  return [
    {
      label: 'Open',
      value: invoices.filter((item) => item.status === 'open').length,
      tone: 'amber' as const,
    },
    {
      label: 'Partial',
      value: invoices.filter((item) => item.status === 'partially_paid').length,
      tone: 'red' as const,
    },
    {
      label: 'Paid',
      value: invoices.filter((item) => item.status === 'paid').length,
      tone: 'green' as const,
    },
    {
      label: 'Receipts',
      value: collections.length,
      tone: 'blue' as const,
    },
  ];
}

function formatMoney(amount: number) {
  return `ETB ${amount.toLocaleString()}`;
}

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (item) => item.toUpperCase());
}

function formatDate(value: string) {
  return value.slice(0, 10);
}
