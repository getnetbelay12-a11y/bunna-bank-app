import { useEffect, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  FeePlanRecord,
  GuardianStudentLinkItem,
  InvoiceBatchPreviewResult,
  SchoolCollectionItem,
  SchoolConsoleOverview,
  SchoolInvoiceItem,
  SchoolPortfolioItem,
  SchoolSettlementSummaryItem,
  StudentImportRowInput,
  StudentDetail,
  StudentRegistryItem,
} from '../../core/api/contracts';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

type SchoolConsolePageProps = {
  session: {
    schoolId: string;
    schoolName: string;
    branchName?: string;
    districtName?: string;
  };
  variant?: 'school' | 'bank';
};

type SchoolConsoleSection =
  | 'overview'
  | 'registry'
  | 'billing'
  | 'collections'
  | 'onboarding';

export function SchoolConsolePage({
  session,
  variant = 'school',
}: SchoolConsolePageProps) {
  const { authApi, schoolConsoleApi } = useAppClient();
  const [overview, setOverview] = useState<SchoolConsoleOverview | null>(null);
  const [activeSection, setActiveSection] = useState<SchoolConsoleSection>(
    variant === 'school' ? 'onboarding' : 'overview',
  );
  const [registry, setRegistry] = useState<StudentRegistryItem[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlanRecord[]>([]);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [billingGradeFilter, setBillingGradeFilter] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
  const [collectionReconciliationFilter, setCollectionReconciliationFilter] = useState('');
  const [collectionDateFrom, setCollectionDateFrom] = useState('');
  const [collectionDateTo, setCollectionDateTo] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentDetail | null>(null);
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState('');
  const [invoicePreview, setInvoicePreview] = useState<InvoiceBatchPreviewResult | null>(null);
  const [invoiceActionMessage, setInvoiceActionMessage] = useState('');
  const [schoolForm, setSchoolForm] = useState({
    name: '',
    code: '',
    branchName: session.branchName ?? '',
    city: '',
    region: 'Bunna',
  });
  const [importSchoolId, setImportSchoolId] = useState('');
  const [importText, setImportText] = useState(
    'ST-3001,Selam Tesfaye,Grade 6,A,Tesfaye Bekele,0911223344',
  );
  const [setupMessage, setSetupMessage] = useState('');
  const [feePlanMessage, setFeePlanMessage] = useState('');
  const [feePlanForm, setFeePlanForm] = useState({
    schoolId: '',
    academicYear: '2026',
    term: 'Term 1',
    grade: '',
    name: '',
    status: 'active',
  });
  const [feePlanItems, setFeePlanItems] = useState([
    { label: 'Tuition', amount: '0' },
    { label: 'Transport', amount: '0' },
  ]);
  const [linkMessage, setLinkMessage] = useState('');
  const [guardianMessage, setGuardianMessage] = useState('');
  const [guardianForm, setGuardianForm] = useState({
    fullName: '',
    phone: '',
    relationship: 'parent',
    status: 'linked',
  });
  const [linkForm, setLinkForm] = useState({
    guardianId: '',
    memberCustomerId: '',
    relationship: 'parent',
    status: 'active',
  });
  const [registrationForm, setRegistrationForm] = useState({
    schoolId: '',
    studentId: '',
    fullName: '',
    grade: '',
    section: '',
    guardianName: '',
    guardianPhone: '',
    memberCustomerId: '',
    monthlyFee: '',
  });
  const isSchoolPortal = variant === 'school';
  const scopedSchoolId = isSchoolPortal ? session.schoolId : '';

  useEffect(() => {
    if (!schoolConsoleApi) {
      setOverview(null);
      return;
    }

    let cancelled = false;

    void schoolConsoleApi.getOverview().then((result) => {
      if (!cancelled) {
        setOverview(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [schoolConsoleApi]);

  useEffect(() => {
    if (!schoolConsoleApi) {
      setRegistry([]);
      return;
    }

    let cancelled = false;

    void schoolConsoleApi
      .getRegistry({
        schoolId: schoolFilter || undefined,
        grade: gradeFilter || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      })
      .then((result) => {
        if (!cancelled) {
          setRegistry(result);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gradeFilter, schoolConsoleApi, schoolFilter, search, statusFilter]);

  useEffect(() => {
    if (!schoolConsoleApi) {
      setFeePlans([]);
      return;
    }

    let cancelled = false;
    void schoolConsoleApi.getFeePlans(schoolFilter || undefined).then((result) => {
      if (!cancelled) {
        setFeePlans(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [schoolConsoleApi, schoolFilter]);

  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedStudentDetail(null);
      return;
    }

    if (!schoolConsoleApi) {
      return;
    }

    let cancelled = false;

    void schoolConsoleApi.getStudentDetail(selectedStudentId).then((result) => {
      if (!cancelled) {
        setSelectedStudentDetail(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [schoolConsoleApi, selectedStudentId]);

  useEffect(() => {
    if (registry.length === 0) {
      setSelectedStudentId('');
      return;
    }

    if (!registry.some((item) => item.studentId === selectedStudentId)) {
      setSelectedStudentId(registry[0]?.studentId ?? '');
    }
  }, [registry, selectedStudentId]);

  useEffect(() => {
    if (!isSchoolPortal) {
      return;
    }

    setSchoolFilter(scopedSchoolId);
    setImportSchoolId(scopedSchoolId);
    setFeePlanForm((current) => ({ ...current, schoolId: scopedSchoolId }));
    setRegistrationForm((current) => ({ ...current, schoolId: scopedSchoolId }));
    setSchoolForm((current) => ({
      ...current,
      name: session.schoolName,
      branchName: session.branchName ?? current.branchName,
    }));
  }, [isSchoolPortal, scopedSchoolId, session.branchName, session.schoolName]);

  const summary = overview?.summary;
  const schools = overview?.schools ?? [];
  const invoices = overview?.invoices ?? [];
  const collections = overview?.collections ?? [];
  const collectionSummary = overview?.collectionSummary ?? null;
  const schoolSettlements = overview?.schoolSettlements ?? [];
  const scopedSchools = isSchoolPortal
    ? schools.filter((item) => item.id === scopedSchoolId)
    : filterSchoolsForBankScope(schools, {
        branchName: session.branchName,
        districtName: session.districtName,
      });
  const visibleSchools = isSchoolPortal
    ? scopedSchools
    : scopedSchools;
  const visibleSchoolIds = new Set(visibleSchools.map((item) => item.id));
  const visibleRegistry = isSchoolPortal
    ? registry.filter((item) => item.schoolId === scopedSchoolId)
    : registry.filter((item) => visibleSchoolIds.has(item.schoolId));
  const visibleInvoices = isSchoolPortal
    ? invoices.filter((item) => item.schoolId === scopedSchoolId)
    : invoices.filter((item) => visibleSchoolIds.has(item.schoolId));
  const visibleCollections = isSchoolPortal
    ? collections.filter((item) => item.schoolId === scopedSchoolId)
    : collections.filter((item) => visibleSchoolIds.has(item.schoolId));
  const visibleSchoolSettlements = isSchoolPortal
    ? schoolSettlements.filter((item) => item.schoolId === scopedSchoolId)
    : schoolSettlements.filter(
        (item) =>
          visibleSchoolIds.has(item.schoolId) &&
          (!schoolFilter || item.schoolId === schoolFilter),
      );
  const selectedSchool =
    visibleSchools.find((item) => item.id === (schoolFilter || scopedSchoolId)) ??
    visibleSchools[0] ??
    null;
  const gradeOptions = Array.from(new Set(visibleRegistry.map((item) => item.grade))).sort();
  const statusOptions = Array.from(new Set(visibleRegistry.map((item) => item.status))).sort();
  const reconciliationOptions = Array.from(
    new Set(visibleCollections.map((item) => item.reconciliationStatus)),
  ).sort();
  const firstParentLinkGap =
    visibleRegistry.find((item) => item.guardianStatus !== 'linked') ?? null;
  const schoolOperationalCards = buildSchoolOperationalCards(
    visibleSchools,
    visibleRegistry,
    visibleInvoices,
    visibleCollections,
  );
  const selectedSchoolOperationalCard =
    schoolOperationalCards.find((item) => item.schoolId === selectedSchool?.id) ?? null;
  const overviewOperationalSummary = buildOverviewOperationalSummary(
    visibleRegistry,
    feePlans,
    visibleInvoices,
  );
  const followUpRows = buildSchoolFollowUpRows(visibleRegistry, feePlans, visibleInvoices, (studentId) => {
    setSelectedStudentId(studentId);
    setActiveSection('registry');
  });
  const registryMetrics = buildRegistryMetrics(visibleRegistry, feePlans, visibleInvoices);
  const selectedStudentOperationalSummary = selectedStudentDetail
    ? buildStudentOperationalSummary(selectedStudentDetail, feePlans)
    : null;
  const branchLabel = session.branchName ?? 'the assigned branch';
  const districtLabel = session.districtName ?? 'the assigned district';
  const scopeLabel = isSchoolPortal
    ? branchLabel
    : session.branchName === 'Head Office'
      ? 'head office'
      : session.districtName
        ? districtLabel
        : branchLabel;
  const heroEyebrow = isSchoolPortal
    ? 'School operations desk'
    : 'Bank school operations';
  const heroTitle = isSchoolPortal
    ? session.schoolName
    : 'School network operations';
  const heroDescription = isSchoolPortal
    ? `Student registry, billing, collections, and parent payment operations for ${branchLabel}.`
    : session.branchName === 'Head Office'
      ? 'Institution-wide school onboarding, student registry oversight, invoicing, and reconciliation across partner schools.'
      : `School onboarding, student registry oversight, invoicing, and reconciliation across schools in ${scopeLabel}.`;
  const consoleTitle = isSchoolPortal ? 'School SIS Console' : 'Bank School Console';
  const consoleDescription = isSchoolPortal
    ? `Dedicated school workspace for student registry, parent linking, billing status, reports, and communication under ${branchLabel}.`
    : `Bank-side workspace for school onboarding, billing control, collections, and partner-school reconciliation in ${scopeLabel}.`;
  const overviewTitle = isSchoolPortal ? 'School Portfolio' : 'Partner School Portfolio';
  const overviewDescription = isSchoolPortal
    ? 'Track payment posture, parent readiness, and student follow-up for your school workspace.'
    : `Head-office, district, and branch teams can onboard schools, monitor collections, and spot reconciliation pressure across ${scopeLabel}.`;
  const onboardingTitle = isSchoolPortal ? 'Student Onboarding' : 'School Onboarding and Registration';
  const onboardingDescription = isSchoolPortal
    ? 'Register students, capture parent contact details, and prepare parent app visibility for this school.'
    : 'Create school profiles, register students, and capture parent banking readiness before billing starts.';
  const registrationHelper = isSchoolPortal
    ? 'This registers the student, captures parent contact detail, links bank/app access when possible, and prepares billing for the parent app.'
    : 'This creates the student, captures parent contact detail, links bank/app access when possible, and prepares billing across the bank school operations workflow.';
  const summaryMetrics = isSchoolPortal
    ? {
        schools: visibleSchools.length || 1,
        students: visibleRegistry.length,
        openInvoices: visibleInvoices.filter(
          (item) => item.status === 'open' || item.status === 'partially_paid',
        ).length,
        todayCollections: visibleCollections.reduce((sum, item) => sum + item.amount, 0),
      }
    : {
        schools: summary?.schools ?? 0,
        students: summary?.students ?? 0,
        openInvoices: summary?.openInvoices ?? 0,
        todayCollections: summary?.todayCollections ?? 0,
      };

  async function handleReminder(invoiceNo: string) {
    if (!schoolConsoleApi) {
      return;
    }

    const result = await schoolConsoleApi.sendInvoiceReminder(invoiceNo);
    setInvoiceActionMessage(result.message);
  }

  async function handleBulkReminder() {
    if (!schoolConsoleApi) {
      return;
    }

    const targetInvoices = filteredInvoices
      .filter((item) => item.status === 'open' || item.status === 'partially_paid')
      .map((item) => item.invoiceNo);

    if (targetInvoices.length === 0) {
      setInvoiceActionMessage('No open invoices match the current billing filter.');
      return;
    }

    const result = await schoolConsoleApi.sendInvoiceReminders(targetInvoices);
    setInvoiceActionMessage(result.message);
  }

  async function handleGenerateBatch() {
    if (!schoolConsoleApi) {
      return;
    }

    const targetSchoolId = schoolFilter || schools[0]?.id;
    if (!targetSchoolId) {
      setInvoiceActionMessage('Select or onboard a school before generating invoices.');
      return;
    }

    const result = await schoolConsoleApi.generateInvoiceBatch({
      schoolId: targetSchoolId,
      academicYear: '2026',
      term: 'Term 1',
      grade: billingGradeFilter || undefined,
    });
    setInvoiceActionMessage(result.message);
    setInvoicePreview(null);
  }

  async function handlePreviewBatch() {
    if (!schoolConsoleApi) {
      return;
    }

    const targetSchoolId = schoolFilter || schools[0]?.id;
    if (!targetSchoolId) {
      setInvoiceActionMessage('Select or onboard a school before previewing invoices.');
      return;
    }

    const result = await schoolConsoleApi.previewInvoiceBatch({
      schoolId: targetSchoolId,
      academicYear: '2026',
      term: 'Term 1',
      grade: billingGradeFilter || undefined,
    });
    setInvoicePreview(result);
    setInvoiceActionMessage(
      `Preview covers ${result.previewCount} students. Missing grades: ${result.missingGrades.join(', ') || 'none'}.`,
    );
  }

  const filteredInvoices = visibleInvoices.filter((item) => {
    if (schoolFilter && item.schoolId !== schoolFilter) {
      return false;
    }
    if (invoiceStatusFilter && item.status !== invoiceStatusFilter) {
      return false;
    }
    if (billingGradeFilter) {
      const student = visibleRegistry.find((entry) => entry.studentId === item.studentId);
      if (student?.grade !== billingGradeFilter) {
        return false;
      }
    }
    return true;
  });
  const filteredCollections = visibleCollections.filter((item) => {
    if (schoolFilter && item.schoolId !== schoolFilter) {
      return false;
    }
    if (
      collectionReconciliationFilter &&
      item.reconciliationStatus !== collectionReconciliationFilter
    ) {
      return false;
    }
    const recordedDay = item.recordedAt.slice(0, 10);
    if (collectionDateFrom && recordedDay < collectionDateFrom) {
      return false;
    }
    if (collectionDateTo && recordedDay > collectionDateTo) {
      return false;
    }
    return true;
  });
  const hasCollectionSubFilters =
    Boolean(collectionReconciliationFilter) || Boolean(collectionDateFrom) || Boolean(collectionDateTo);
  const settlementRows = hasCollectionSubFilters
    ? summarizeSchoolSettlements(filteredCollections)
    : visibleSchoolSettlements;
  const selectedInvoice = filteredInvoices.find((item) => item.invoiceNo === selectedInvoiceNo) ?? null;

  useEffect(() => {
    if (filteredInvoices.length === 0) {
      setSelectedInvoiceNo('');
      return;
    }

    if (!filteredInvoices.some((item) => item.invoiceNo === selectedInvoiceNo)) {
      setSelectedInvoiceNo(filteredInvoices[0]?.invoiceNo ?? '');
    }
  }, [selectedInvoiceNo, filteredInvoices]);

  async function handleCreateSchool(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolConsoleApi) {
      return;
    }

    const created = await schoolConsoleApi.createSchool(schoolForm);
    setSetupMessage(`School ${created.name} created in onboarding status.`);
    setSchoolForm({
      name: '',
      code: '',
      branchName: session.branchName ?? '',
      city: '',
      region: 'Bunna',
    });
  }

  async function handleImportStudents(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolConsoleApi) {
      return;
    }

    const schoolId = importSchoolId || schools[0]?.id;
    if (!schoolId) {
      setSetupMessage('Select or create a school before importing students.');
      return;
    }

    const students = parseImportRows(importText);
    if (students.length === 0) {
      setSetupMessage('Enter at least one valid student import row.');
      return;
    }

    const result = await schoolConsoleApi.importStudents({
      schoolId,
      students,
    });
    setSetupMessage(result.message);
    setImportSchoolId(schoolId);
  }

  async function handleRegisterStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolConsoleApi) {
      return;
    }

    const schoolId = registrationForm.schoolId || importSchoolId || schoolFilter || schools[0]?.id;
    const school = schools.find((item) => item.id === schoolId);
    if (!schoolId || !school) {
      setSetupMessage('Select a school before registering a student.');
      return;
    }

    const parsedMonthlyFee = Number(registrationForm.monthlyFee);
    const hasMonthlyFee = registrationForm.monthlyFee.trim().length > 0;
    const typedMemberCustomerId = registrationForm.memberCustomerId.trim();

    if (
      !registrationForm.fullName.trim() ||
      !registrationForm.grade.trim() ||
      !registrationForm.guardianName.trim() ||
      !registrationForm.guardianPhone.trim()
    ) {
      setSetupMessage('Student name, grade, parent name, and phone are required.');
      return;
    }

    if (hasMonthlyFee && (!Number.isFinite(parsedMonthlyFee) || parsedMonthlyFee <= 0)) {
      setSetupMessage('Monthly fee must be a valid amount greater than zero.');
      return;
    }

    const importResult = await schoolConsoleApi.importStudents({
      schoolId,
      students: [
        {
          studentId: registrationForm.studentId.trim() || undefined,
          fullName: registrationForm.fullName.trim(),
          grade: registrationForm.grade.trim(),
          section: registrationForm.section.trim() || 'A',
          guardianName: registrationForm.guardianName.trim(),
          guardianPhone: registrationForm.guardianPhone.trim(),
          parentAccountNumber: typedMemberCustomerId || undefined,
        },
      ],
    });
    const assignedStudentId = importResult.items[0]?.studentId ?? registrationForm.studentId.trim();

    const hasExistingGradePlan = feePlans.some(
      (item) =>
        item.schoolId === schoolId &&
        item.grade.trim().toLowerCase() === registrationForm.grade.trim().toLowerCase() &&
        item.status === 'active',
    );

    const gradeLabel = registrationForm.grade.trim();

    if (hasMonthlyFee && !hasExistingGradePlan) {
      await schoolConsoleApi.createFeePlan({
        schoolId,
        schoolName: school.name,
        academicYear: '2026',
        term: 'Term 1',
        grade: gradeLabel,
        name: `${gradeLabel} standard monthly fee`,
        status: 'active',
        items: [{ label: 'Monthly fee', amount: parsedMonthlyFee }],
      });
    }

    const guardian = await schoolConsoleApi.createGuardian({
      studentId: assignedStudentId,
      fullName: registrationForm.guardianName.trim(),
      phone: registrationForm.guardianPhone.trim(),
      relationship: 'parent',
      status: 'linked',
    });

    const resolvedAccount =
      typedMemberCustomerId.length > 0
        ? {
            customerId: typedMemberCustomerId,
            resolvedByPhone: false,
          }
        : (() => undefined)();

    let linkedMemberAccount = resolvedAccount;
    if (!linkedMemberAccount && authApi.checkExistingAccount) {
      const existingAccount = await authApi.checkExistingAccount({
        phoneNumber: registrationForm.guardianPhone.trim(),
      });

      if (existingAccount.exists && existingAccount.customerId) {
        linkedMemberAccount = {
          customerId: existingAccount.customerId,
          resolvedByPhone: true,
        };
      }
    }

    if (linkedMemberAccount?.customerId) {
      await schoolConsoleApi.createGuardianStudentLink({
        studentId: assignedStudentId,
        guardianId: guardian.guardianId,
        memberCustomerId: linkedMemberAccount.customerId,
        relationship: 'parent',
        status: 'active',
      });
    }

    const invoiceBatchResult =
      hasMonthlyFee || hasExistingGradePlan
        ? await schoolConsoleApi.generateInvoiceBatch({
            schoolId,
            academicYear: '2026',
            term: 'Term 1',
            grade: gradeLabel,
          })
        : null;

    const [nextOverview, nextRegistry, nextFeePlans, detail] = await Promise.all([
      schoolConsoleApi.getOverview(),
      schoolConsoleApi.getRegistry({
        schoolId: schoolFilter || undefined,
        grade: gradeFilter || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      }),
      schoolConsoleApi.getFeePlans(schoolFilter || undefined),
      schoolConsoleApi.getStudentDetail(assignedStudentId),
    ]);

    setOverview(nextOverview);
    setRegistry(nextRegistry);
    setFeePlans(nextFeePlans);
    setSelectedStudentId(assignedStudentId);
    setSelectedStudentDetail(detail);
    setRegistrationForm({
      schoolId,
      studentId: '',
      fullName: '',
      grade: '',
      section: '',
      guardianName: '',
      guardianPhone: '',
      memberCustomerId: '',
      monthlyFee: '',
    });
    setSetupMessage(
      `Registered ${detail?.student.fullName ?? 'student'} as ${assignedStudentId} with parent contact${
        linkedMemberAccount?.customerId ? ' and linked bank/app access' : ''
      }${
        hasMonthlyFee
          ? `; monthly fee ${formatMoney(parsedMonthlyFee)} ${
              hasExistingGradePlan ? 'uses the existing grade plan' : 'was configured for this grade'
            }`
          : hasExistingGradePlan
            ? '; the existing grade plan was reused'
            : ''
      }${
        invoiceBatchResult
          ? `; invoice generation ran and ${invoiceBatchResult.generatedInvoices} invoice${
              invoiceBatchResult.generatedInvoices === 1 ? '' : 's'
            } ${invoiceBatchResult.generatedInvoices === 1 ? 'was' : 'were'} prepared for ${gradeLabel}`
          : ''
      }${
        linkedMemberAccount?.customerId
          ? linkedMemberAccount.resolvedByPhone
            ? `; linked to ${linkedMemberAccount.customerId} from the parent phone number and ready to appear in the parent app.`
            : `; linked to ${linkedMemberAccount.customerId} from the parent account number and ready to appear in the parent app.`
          : '; no bank/app account was found for that parent phone number, so the student will not appear in the parent app until a member account is linked.'
      }`,
    );
  }

  async function handleCreateFeePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolConsoleApi) {
      return;
    }

    const schoolId = feePlanForm.schoolId || schoolFilter || schools[0]?.id;
    const school = schools.find((item) => item.id === schoolId);
    if (!schoolId || !school) {
      setFeePlanMessage('Select a school before creating a fee plan.');
      return;
    }

    const created = await schoolConsoleApi.createFeePlan({
      schoolId,
      schoolName: school.name,
      academicYear: feePlanForm.academicYear,
      term: feePlanForm.term,
      grade: feePlanForm.grade,
      name: feePlanForm.name,
      status: feePlanForm.status,
      items: feePlanItems
        .map((item) => ({ label: item.label, amount: Number(item.amount) || 0 }))
        .filter((item) => item.label.trim().length > 0 && item.amount > 0),
    });

    setFeePlanMessage(`Created fee plan ${created.name} with total ${formatMoney(created.total)}.`);
    setFeePlanForm((current) => ({
      ...current,
      schoolId,
      grade: '',
      name: '',
    }));
    setFeePlanItems([
      { label: 'Tuition', amount: '0' },
      { label: 'Transport', amount: '0' },
    ]);
    setFeePlans(await schoolConsoleApi.getFeePlans(schoolFilter || undefined));
  }

  async function refreshStudentDetail(studentId: string) {
    if (!schoolConsoleApi) {
      return;
    }

    const [detail, nextRegistry] = await Promise.all([
      schoolConsoleApi.getStudentDetail(studentId),
      schoolConsoleApi.getRegistry({
        schoolId: schoolFilter || undefined,
        grade: gradeFilter || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      }),
    ]);

    setSelectedStudentDetail(detail);
    setRegistry(nextRegistry);
  }

  async function handleCreateGuardianLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolConsoleApi || !selectedStudentDetail) {
      return;
    }

    const created = await schoolConsoleApi.createGuardianStudentLink({
      studentId: selectedStudentDetail.student.studentId,
      guardianId: linkForm.guardianId,
      memberCustomerId: linkForm.memberCustomerId,
      relationship: linkForm.relationship,
      status: linkForm.status,
    });
    setLinkMessage(`Created link ${created.linkId} for ${selectedStudentDetail.student.studentId}.`);
    setLinkForm((current) => ({ ...current, memberCustomerId: '' }));
    await refreshStudentDetail(selectedStudentDetail.student.studentId);
  }

  async function handleCreateGuardian(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolConsoleApi || !selectedStudentDetail) {
      return;
    }

    const created = await schoolConsoleApi.createGuardian({
      studentId: selectedStudentDetail.student.studentId,
      fullName: guardianForm.fullName,
      phone: guardianForm.phone,
      relationship: guardianForm.relationship,
      status: guardianForm.status,
    });
    setGuardianMessage(`Created guardian ${created.guardianId}.`);
    setGuardianForm({
      fullName: '',
      phone: '',
      relationship: 'parent',
      status: 'linked',
    });
    await refreshStudentDetail(selectedStudentDetail.student.studentId);
  }

  async function handleToggleGuardianStatus(guardianId: string, status: string) {
    if (!schoolConsoleApi || !selectedStudentDetail) {
      return;
    }

    const updated = await schoolConsoleApi.updateGuardian(guardianId, { status });
    setGuardianMessage(`Updated ${updated.guardianId} to ${titleCase(updated.status)}.`);
    await refreshStudentDetail(selectedStudentDetail.student.studentId);
  }

  async function handleUpdateGuardianLink(
    linkId: string,
    status: GuardianStudentLinkItem['status'],
  ) {
    if (!schoolConsoleApi || !selectedStudentDetail) {
      return;
    }

    const updated = await schoolConsoleApi.updateGuardianStudentLink(linkId, { status });
    setLinkMessage(`Updated ${updated.linkId} to ${titleCase(updated.status)}.`);
    await refreshStudentDetail(selectedStudentDetail.student.studentId);
  }

  function handleExportInvoices() {
    if (filteredInvoices.length === 0) {
      setInvoiceActionMessage('No invoices match the current billing filter.');
      return;
    }

    const gradeByStudentId = new Map(registry.map((item) => [item.studentId, item.grade]));
    downloadCsv(
      'school-console-invoices.csv',
      ['Invoice', 'Student ID', 'Student Name', 'School', 'Grade', 'Total', 'Paid', 'Balance', 'Status', 'Due Date'],
      filteredInvoices.map((item) => [
        item.invoiceNo,
        item.studentId,
        item.studentName,
        item.schoolName,
        gradeByStudentId.get(item.studentId) ?? '',
        item.total,
        item.paid,
        item.balance,
        item.status,
        item.dueDate,
      ]),
    );
    setInvoiceActionMessage(`Exported ${filteredInvoices.length} filtered invoices to CSV.`);
  }

  function handleExportCollections() {
    if (filteredCollections.length === 0) {
      setInvoiceActionMessage('No collections match the current school filter.');
      return;
    }

    downloadCsv(
      'school-console-collections.csv',
      ['Receipt', 'School', 'Student ID', 'Channel', 'Amount', 'Status', 'Reconciliation', 'Recorded At'],
      filteredCollections.map((item) => [
        item.receiptNo,
        item.schoolName,
        item.studentId,
        item.channel,
        item.amount,
        item.status,
        item.reconciliationStatus,
        item.recordedAt,
      ]),
    );
    setInvoiceActionMessage(`Exported ${filteredCollections.length} collection records to CSV.`);
  }

  return (
    <div className="page-stack school-console-page">
      <section className="school-console-hero">
        <article className="school-console-hero-primary">
          <div className="school-console-hero-copy">
            <span className="eyebrow">{heroEyebrow}</span>
            <h2>{heroTitle}</h2>
            <p>{heroDescription}</p>
          </div>
          <div className="school-console-hero-metrics">
            <div>
              <span>Students</span>
              <strong>{summaryMetrics.students.toLocaleString()}</strong>
            </div>
            <div>
              <span>Open invoices</span>
              <strong>{summaryMetrics.openInvoices.toLocaleString()}</strong>
            </div>
            <div>
              <span>Collected today</span>
              <strong>{formatMoney(summaryMetrics.todayCollections)}</strong>
            </div>
            <div>
              <span>Schools</span>
              <strong>{summaryMetrics.schools.toLocaleString()}</strong>
            </div>
          </div>
        </article>

        <article className="school-console-hero-card">
          <span className="eyebrow">Current focus</span>
          <h3>What the operator should clear today</h3>
          <ul className="school-console-hero-list">
            <li>
              <span>Due invoices</span>
              <strong>{overviewOperationalSummary.dueStudents.toLocaleString()}</strong>
            </li>
            <li>
              <span>Parent link gaps</span>
              <strong>{overviewOperationalSummary.parentLinkGaps.toLocaleString()}</strong>
            </li>
            <li>
              <span>Awaiting settlement</span>
              <strong>{(collectionSummary?.pendingSettlement ?? 0).toLocaleString()}</strong>
            </li>
          </ul>
        </article>

        <article className="school-console-hero-card">
          <span className="eyebrow">Parent readiness</span>
          <h3>Bank and app linkage posture</h3>
          <ul className="school-console-hero-list">
            <li>
              <span>Linked parents</span>
              <strong>{overviewOperationalSummary.linkedParents.toLocaleString()}</strong>
            </li>
            <li>
              <span>Pending verification</span>
              <strong>{overviewOperationalSummary.pendingParents.toLocaleString()}</strong>
            </li>
            <li>
              <span>Phones on file</span>
              <strong>{overviewOperationalSummary.parentsWithPhone.toLocaleString()}</strong>
            </li>
          </ul>
        </article>
      </section>

      <Panel
        title={consoleTitle}
        description={consoleDescription}
      >
        <div className="dashboard-summary-strip">
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Schools</span>
            <strong>{summaryMetrics.schools.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Students</span>
            <strong>{summaryMetrics.students.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Open invoices</span>
            <strong>{summaryMetrics.openInvoices.toLocaleString()}</strong>
          </div>
          <div className="dashboard-summary-chip">
            <span className="dashboard-summary-label">Today’s collections</span>
            <strong>{formatMoney(summaryMetrics.todayCollections)}</strong>
          </div>
        </div>

        <div className="school-console-section-switcher" style={{ marginTop: 16 }}>
          {(
            isSchoolPortal
              ? ([
                  ['overview', 'Reports'],
                  ['onboarding', 'Student Registry'],
                  ['registry', 'Parent Linking'],
                  ['billing', 'Billing System'],
                  ['collections', 'Communication'],
                ] as Array<[SchoolConsoleSection, string]>)
              : ([
                  ['overview', 'Overview'],
                  ['registry', 'Linking'],
                  ['billing', 'Payment Processing'],
                  ['collections', 'Reconciliation'],
                  ['onboarding', 'Onboarding'],
                ] as Array<[SchoolConsoleSection, string]>)
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={activeSection === key ? 'channel-chip active' : 'channel-chip'}
              onClick={() => setActiveSection(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </Panel>

      {activeSection === 'overview' ? (
        <Panel
          title={overviewTitle}
          description={overviewDescription}
        >
          <div className="loan-filter-row" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className="channel-chip"
              aria-label="Open due invoices queue"
              onClick={() => {
                setActiveSection('billing');
                setInvoiceStatusFilter('open');
                setBillingGradeFilter('');
              }}
            >
              Due invoices · {overviewOperationalSummary.dueStudents.toLocaleString()}
            </button>
            <button
              type="button"
              className="channel-chip"
              aria-label="Open partially paid queue"
              onClick={() => {
                setActiveSection('billing');
                setInvoiceStatusFilter('partially_paid');
                setBillingGradeFilter('');
              }}
            >
              Partial payments · {overviewOperationalSummary.partiallyPaidStudents.toLocaleString()}
            </button>
            <button
              type="button"
              className="channel-chip"
              aria-label="Open parent link gap queue"
              onClick={() => {
                setActiveSection('registry');
                setSearch('');
                setSchoolFilter(isSchoolPortal ? scopedSchoolId : '');
                if (firstParentLinkGap) {
                  setSelectedStudentId(firstParentLinkGap.studentId);
                }
              }}
            >
              Parent link gaps · {overviewOperationalSummary.parentLinkGaps.toLocaleString()}
            </button>
            <button
              type="button"
              className="channel-chip"
              aria-label="Open awaiting settlement queue"
              onClick={() => {
                setActiveSection('collections');
                setCollectionReconciliationFilter('awaiting_settlement');
                setCollectionDateFrom('');
                setCollectionDateTo('');
              }}
            >
              Awaiting settlement · {(collectionSummary?.pendingSettlement ?? 0).toLocaleString()}
            </button>
          </div>
          {isSchoolPortal ? (
            selectedSchoolOperationalCard ? (
              <div className="loan-detail-grid" style={{ marginBottom: 16 }}>
                <div className="loan-detail-card">
                  <div className="loan-detail-card-header">
                    <div>
                      <h3>{selectedSchoolOperationalCard.schoolName}</h3>
                      <p>{selectedSchoolOperationalCard.branchName}</p>
                    </div>
                    {renderSchoolStatusBadge(
                      selectedSchoolOperationalCard.settlementLabel,
                      selectedSchoolOperationalCard.settlementTone,
                    )}
                  </div>
                  <div className="dashboard-summary-strip dashboard-summary-strip-dense">
                    <div className="dashboard-summary-chip">
                      <span className="dashboard-summary-label">Students due</span>
                      <strong>{selectedSchoolOperationalCard.dueStudents.toLocaleString()}</strong>
                    </div>
                    <div className="dashboard-summary-chip">
                      <span className="dashboard-summary-label">Linked parents</span>
                      <strong>{selectedSchoolOperationalCard.linkedParents.toLocaleString()}</strong>
                    </div>
                    <div className="dashboard-summary-chip">
                      <span className="dashboard-summary-label">Open invoices</span>
                      <strong>{selectedSchoolOperationalCard.openInvoices.toLocaleString()}</strong>
                    </div>
                    <div className="dashboard-summary-chip">
                      <span className="dashboard-summary-label">Today collected</span>
                      <strong>{formatMoney(selectedSchoolOperationalCard.todayCollections)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          ) : (
            <div className="loan-detail-grid" style={{ marginBottom: 16 }}>
              {schoolOperationalCards.map((item) => (
                <div key={item.schoolId} className="loan-detail-card">
                  <div className="loan-detail-card-header">
                    <div>
                      <h3>{item.schoolName}</h3>
                      <p>{item.branchName}</p>
                    </div>
                    {renderSchoolStatusBadge(item.settlementLabel, item.settlementTone)}
                  </div>
                  <div className="dashboard-summary-strip dashboard-summary-strip-dense">
                    <div className="dashboard-summary-chip">
                      <span className="dashboard-summary-label">Students due</span>
                      <strong>{item.dueStudents.toLocaleString()}</strong>
                    </div>
                    <div className="dashboard-summary-chip">
                      <span className="dashboard-summary-label">Linked parents</span>
                      <strong>{item.linkedParents.toLocaleString()}</strong>
                    </div>
                    <div className="dashboard-summary-chip">
                      <span className="dashboard-summary-label">Open invoices</span>
                      <strong>{item.openInvoices.toLocaleString()}</strong>
                    </div>
                    <div className="dashboard-summary-chip">
                      <span className="dashboard-summary-label">Today collected</span>
                      <strong>{formatMoney(item.todayCollections)}</strong>
                    </div>
                  </div>
                  <div className="loan-filter-row" style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="loan-watchlist-link"
                      aria-label={`Open ${item.schoolName} registry`}
                      onClick={() => {
                        setSchoolFilter(item.schoolId);
                        setActiveSection('registry');
                      }}
                    >
                      Open registry
                    </button>
                    <button
                      type="button"
                      className="loan-watchlist-link"
                      aria-label={`Open ${item.schoolName} billing`}
                      onClick={() => {
                        setSchoolFilter(item.schoolId);
                        setFeePlanForm((current) => ({ ...current, schoolId: item.schoolId }));
                        setActiveSection('billing');
                        setInvoiceStatusFilter('');
                      }}
                    >
                      Open billing
                    </button>
                    <button
                      type="button"
                      className="loan-watchlist-link"
                      aria-label={`Open ${item.schoolName} collections`}
                      onClick={() => {
                        setSchoolFilter(item.schoolId);
                        setActiveSection('collections');
                      }}
                    >
                      Open collections
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="loan-detail-grid">
            <div className="loan-detail-card">
              <div className="loan-detail-card-header">
                <div>
                  <h3>Payment posture</h3>
                  <p>Current due, paid, and no-invoice posture across all registered students.</p>
                </div>
              </div>
              <div className="dashboard-summary-strip dashboard-summary-strip-dense">
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Students due</span>
                  <strong>{overviewOperationalSummary.dueStudents.toLocaleString()}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Paid students</span>
                  <strong>{overviewOperationalSummary.paidStudents.toLocaleString()}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">No invoice</span>
                  <strong>{overviewOperationalSummary.noInvoiceStudents.toLocaleString()}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Monthly billed</span>
                  <strong>{formatMoney(overviewOperationalSummary.monthlyFees)}</strong>
                </div>
              </div>
            </div>
            <div className="loan-detail-card">
              <div className="loan-detail-card-header">
                <div>
                  <h3>Parent banking readiness</h3>
                  <p>Track which parents are linked to the bank/app before reminder and collection runs.</p>
                </div>
              </div>
              <div className="dashboard-summary-strip dashboard-summary-strip-dense">
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Linked parents</span>
                  <strong>{overviewOperationalSummary.linkedParents.toLocaleString()}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Pending link</span>
                  <strong>{overviewOperationalSummary.pendingParents.toLocaleString()}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Not linked</span>
                  <strong>{overviewOperationalSummary.unlinkedParents.toLocaleString()}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Parent phones on file</span>
                  <strong>{overviewOperationalSummary.parentsWithPhone.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
          {!isSchoolPortal ? (
            <SimpleTable
              headers={['School', 'Linked branch', 'Students', 'Open invoices', 'Today', 'Status']}
              rows={buildSchoolRows(visibleSchools)}
              emptyState={{
                title: 'No schools onboarded yet',
                description: 'School portfolio items will appear here once onboarding starts.',
              }}
            />
          ) : null}
          <div style={{ marginTop: 16 }}>
            <p className="eyebrow">Students needing follow-up</p>
            <SimpleTable
              headers={['Student', 'Parent', 'Monthly fee', 'Payment status', 'Bank / app', 'Open']}
              rows={followUpRows}
              emptyState={{
                title: 'No follow-up needed right now',
                description: 'Students with due payments or missing bank/app links will appear here.',
              }}
            />
          </div>
        </Panel>
      ) : null}

      {activeSection === 'registry' ? (
        <Panel
          title={isSchoolPortal ? 'Parent Linking' : 'Student-To-Account Linking'}
          description={
            isSchoolPortal
              ? 'Review parent contact readiness, linked bank/app access, and student-linked parent records.'
              : 'Link students to bank customer accounts and review parent access readiness across schools.'
          }
        >
          {selectedSchool ? (
            <div className="loan-action-banner" style={{ marginBottom: 16 }}>
              <strong>{`Scoped to ${selectedSchool.name}`}</strong>
              <span>{`Registry view is filtered to ${selectedSchool.branchName}.`}</span>
              {selectedSchoolOperationalCard ? (
                <div className="dashboard-summary-strip" style={{ marginTop: 12 }}>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Students due</span>
                    <strong>{selectedSchoolOperationalCard.dueStudents.toLocaleString()}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Linked parents</span>
                    <strong>{selectedSchoolOperationalCard.linkedParents.toLocaleString()}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Open invoices</span>
                    <strong>{selectedSchoolOperationalCard.openInvoices.toLocaleString()}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Today collected</span>
                    <strong>{formatMoney(selectedSchoolOperationalCard.todayCollections)}</strong>
                  </div>
                </div>
              ) : null}
              <div className="loan-filter-row">
                <button
                  type="button"
                  className="loan-watchlist-link"
                  onClick={() => setSchoolFilter(isSchoolPortal ? scopedSchoolId : '')}
                >
                  Clear scope
                </button>
                <button type="button" className="loan-watchlist-link" onClick={() => setActiveSection('billing')}>
                  Open billing
                </button>
                <button type="button" className="loan-watchlist-link" onClick={() => setActiveSection('collections')}>
                  Open collections
                </button>
              </div>
            </div>
          ) : null}
          <div className="dashboard-summary-strip">
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Registered students</span>
              <strong>{registryMetrics.students.toLocaleString()}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Parent linked to bank/app</span>
              <strong>{registryMetrics.linkedParents.toLocaleString()}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Monthly amount due</span>
              <strong>{formatMoney(registryMetrics.monthlyFees)}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Overdue students</span>
              <strong>{registryMetrics.overdueStudents.toLocaleString()}</strong>
            </div>
          </div>
          <div className="dashboard-toolbar">
            {!isSchoolPortal ? (
              <label className="field-stack">
                <span>School</span>
                <select value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)}>
                  <option value="">All schools</option>
                  {schools.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
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
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {statusOptions.map((item) => (
                  <option key={item} value={item}>
                    {titleCase(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack" style={{ minWidth: 240 }}>
              <span>Search</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Student, guardian, phone, ID"
              />
            </label>
          </div>
          <SimpleTable
            headers={[
              'Student',
              'Parent detail',
              'Bank / app',
              'Monthly fee',
              'Payment status',
              'Enrollment',
              'Open',
            ]}
            rows={buildRegistryRows(
              visibleRegistry,
              selectedStudentId,
              setSelectedStudentId,
              feePlans,
              visibleInvoices,
            )}
            emptyState={{
              title: 'No students match this filter',
              description: 'Try clearing one of the filters or broaden the search term.',
            }}
          />
        </Panel>
      ) : null}

      {activeSection === 'registry' && selectedStudentDetail ? (
        <Panel
          title={`${selectedStudentDetail.student.fullName} · Student Detail`}
          description="Use this detail panel to review parent detail, payment status, monthly amount, and bank/app readiness before taking action."
        >
          <div className="dashboard-summary-strip">
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Student ID</span>
              <strong>{selectedStudentDetail.student.studentId}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Guardian</span>
              <strong>{selectedStudentDetail.student.guardianName}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Current status</span>
              <strong>{titleCase(selectedStudentDetail.student.status)}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Enrollment</span>
              <strong>{titleCase(selectedStudentDetail.student.enrollmentStatus)}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Monthly amount</span>
              <strong>{formatMoney(selectedStudentOperationalSummary?.monthlyFee)}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Payment status</span>
              <strong>{selectedStudentOperationalSummary?.paymentLabel ?? 'No invoice yet'}</strong>
            </div>
            <div className="dashboard-summary-chip">
              <span className="dashboard-summary-label">Bank / app access</span>
              <strong>{selectedStudentOperationalSummary?.accessLabel ?? 'Not linked'}</strong>
            </div>
          </div>

          <SimpleTable
            headers={['Profile field', 'Value']}
            rows={[
              ['School', selectedStudentDetail.student.schoolName],
              [
                'Placement',
                `${selectedStudentDetail.student.grade} · ${selectedStudentDetail.student.section}`,
              ],
              ['Academic year', selectedStudentDetail.student.academicYear],
              ['Roll number', selectedStudentDetail.student.rollNumber ?? 'n/a'],
              [
                'Parent detail',
                `${selectedStudentDetail.student.guardianName} (${selectedStudentDetail.student.guardianPhone || 'n/a'})`,
              ],
              ['Guardian status', titleCase(selectedStudentDetail.student.guardianStatus)],
              [
                'Parent has bank account',
                selectedStudentOperationalSummary?.hasLinkedBankAccount ? 'Yes' : 'No',
              ],
              ['Parent uses app', selectedStudentOperationalSummary?.hasAppAccess ? 'Yes' : 'No'],
              [
                'Linked member/customer ID',
                selectedStudentOperationalSummary?.memberCustomerId ?? 'Not linked',
              ],
              [
                'Outstanding balance',
                formatMoney(selectedStudentOperationalSummary?.outstandingBalance),
              ],
            ]}
          />

          <div className="loan-detail-grid" style={{ marginTop: 16 }}>
            <div>
              <p className="eyebrow">Guardian records</p>
              <SimpleTable
                headers={['Guardian ID', 'Name', 'Phone', 'Relationship', 'Status', 'Action']}
                rows={selectedStudentDetail.guardians.map((item) => [
                  item.guardianId,
                  item.fullName,
                  item.phone,
                  titleCase(item.relationship),
                  titleCase(item.status),
                  <button
                    key={item.guardianId}
                    type="button"
                    className="loan-watchlist-link"
                    onClick={() =>
                      void handleToggleGuardianStatus(
                        item.guardianId,
                        item.status === 'inactive' ? 'linked' : 'inactive',
                      )
                    }
                  >
                    {item.status === 'inactive' ? 'Activate' : 'Deactivate'}
                  </button>,
                ])}
                emptyState={{
                  title: 'No guardian records',
                  description: 'Create a guardian record before linking portal access.',
                }}
              />
              <form
                className="form-stack"
                style={{ marginTop: 16 }}
                onSubmit={(event) => void handleCreateGuardian(event)}
              >
                <p className="eyebrow">Create guardian</p>
                <label className="field-stack">
                  <span>Full name</span>
                  <input
                    value={guardianForm.fullName}
                    onChange={(event) =>
                      setGuardianForm((current) => ({ ...current, fullName: event.target.value }))
                    }
                    placeholder="Alemu Bekele"
                  />
                </label>
                <label className="field-stack">
                  <span>Phone</span>
                  <input
                    value={guardianForm.phone}
                    onChange={(event) =>
                      setGuardianForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    placeholder="0911000001"
                  />
                </label>
                <label className="field-stack">
                  <span>Relationship</span>
                  <input
                    value={guardianForm.relationship}
                    onChange={(event) =>
                      setGuardianForm((current) => ({
                        ...current,
                        relationship: event.target.value,
                      }))
                    }
                    placeholder="father"
                  />
                </label>
                <label className="field-stack">
                  <span>Status</span>
                  <select
                    value={guardianForm.status}
                    onChange={(event) =>
                      setGuardianForm((current) => ({ ...current, status: event.target.value }))
                    }
                  >
                    <option value="linked">Linked</option>
                    <option value="pending_verification">Pending verification</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <button type="submit" className="btn btn-primary">
                  Create Guardian
                </button>
                {guardianMessage ? <p className="muted">{guardianMessage}</p> : null}
              </form>
            </div>
            <div>
              <p className="eyebrow">Portal links</p>
              <SimpleTable
                headers={['Link', 'Guardian', 'Member', 'Relationship', 'Status', 'Action']}
                rows={selectedStudentDetail.guardianLinks.map((item) => [
                  item.linkId,
                  item.guardianId,
                  item.memberCustomerId,
                  titleCase(item.relationship),
                  titleCase(item.status),
                  <button
                    key={item.linkId}
                    type="button"
                    className="loan-watchlist-link"
                    onClick={() =>
                      void handleUpdateGuardianLink(
                        item.linkId,
                        item.status === 'active' ? 'inactive' : 'active',
                      )
                    }
                  >
                    {item.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>,
                ])}
                emptyState={{
                  title: 'No portal links',
                  description: 'Create a guardian-student link to enable parent portal access.',
                }}
              />
            </div>
          </div>

          <form
            className="loan-detail-grid"
            style={{ marginTop: 16 }}
            onSubmit={(event) => void handleCreateGuardianLink(event)}
          >
            <div className="form-stack">
              <p className="eyebrow">Create guardian-student link</p>
              <label className="field-stack">
                <span>Guardian</span>
                <select
                  value={linkForm.guardianId}
                  onChange={(event) =>
                    setLinkForm((current) => ({ ...current, guardianId: event.target.value }))
                  }
                >
                  <option value="">Select guardian</option>
                  {selectedStudentDetail.guardians.map((item) => (
                    <option key={item.guardianId} value={item.guardianId}>
                      {item.fullName} ({item.guardianId})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-stack">
                <span>Member customer ID</span>
                <input
                  value={linkForm.memberCustomerId}
                  onChange={(event) =>
                    setLinkForm((current) => ({
                      ...current,
                      memberCustomerId: event.target.value,
                    }))
                  }
                  placeholder="BUN-100001"
                />
              </label>
            </div>
            <div className="form-stack">
              <label className="field-stack">
                <span>Relationship</span>
                <input
                  value={linkForm.relationship}
                  onChange={(event) =>
                    setLinkForm((current) => ({ ...current, relationship: event.target.value }))
                  }
                  placeholder="father"
                />
              </label>
              <label className="field-stack">
                <span>Status</span>
                <select
                  value={linkForm.status}
                  onChange={(event) =>
                    setLinkForm((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending_verification">Pending verification</option>
                </select>
              </label>
              <button type="submit" className="btn btn-primary">
                Create Link
              </button>
              {linkMessage ? <p className="muted">{linkMessage}</p> : null}
            </div>
          </form>
        </Panel>
      ) : null}

      {activeSection === 'billing' ? (
        <Panel
          title={isSchoolPortal ? 'Billing Workspace' : 'Registry And Billing'}
          description={
            isSchoolPortal
              ? 'Review invoices, send reminders, and track parent payment status for your school.'
              : 'The first MVP keeps billing close to the registry so fee assignment and payment follow-up stay consistent.'
          }
        >
          {selectedSchool ? (
            <div className="loan-action-banner" style={{ marginBottom: 16 }}>
              <strong>{`Scoped to ${selectedSchool.name}`}</strong>
              <span>{`Billing actions and invoice queues are limited to ${selectedSchool.branchName}.`}</span>
              {selectedSchoolOperationalCard ? (
                <div className="dashboard-summary-strip" style={{ marginTop: 12 }}>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Students due</span>
                    <strong>{selectedSchoolOperationalCard.dueStudents.toLocaleString()}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Linked parents</span>
                    <strong>{selectedSchoolOperationalCard.linkedParents.toLocaleString()}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Open invoices</span>
                    <strong>{selectedSchoolOperationalCard.openInvoices.toLocaleString()}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Today collected</span>
                    <strong>{formatMoney(selectedSchoolOperationalCard.todayCollections)}</strong>
                  </div>
                </div>
              ) : null}
              <div className="loan-filter-row">
                <button
                  type="button"
                  className="loan-watchlist-link"
                  onClick={() => {
                    setSchoolFilter(isSchoolPortal ? scopedSchoolId : '');
                    setFeePlanForm((current) => ({ ...current, schoolId: '' }));
                  }}
                >
                  Clear scope
                </button>
                <button type="button" className="loan-watchlist-link" onClick={() => setActiveSection('registry')}>
                  Open registry
                </button>
                <button type="button" className="loan-watchlist-link" onClick={() => setActiveSection('collections')}>
                  Open collections
                </button>
              </div>
            </div>
          ) : null}
          {!isSchoolPortal ? (
            <div className="loan-detail-grid">
              <form className="form-stack" onSubmit={(event) => void handleCreateFeePlan(event)}>
                <p className="eyebrow">Fee plan setup</p>
                <label className="field-stack">
                  <span>School</span>
                  <select
                    value={feePlanForm.schoolId}
                    onChange={(event) =>
                      setFeePlanForm((current) => ({ ...current, schoolId: event.target.value }))
                    }
                  >
                    <option value="">Use selected school</option>
                    {schools.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-grid">
                  <label className="field-stack">
                    <span>Academic year</span>
                    <input
                      value={feePlanForm.academicYear}
                      onChange={(event) =>
                        setFeePlanForm((current) => ({
                          ...current,
                          academicYear: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="field-stack">
                    <span>Term</span>
                    <input
                      value={feePlanForm.term}
                      onChange={(event) =>
                        setFeePlanForm((current) => ({ ...current, term: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <label className="field-stack">
                  <span>Grade</span>
                  <select
                    value={feePlanForm.grade}
                    onChange={(event) =>
                      setFeePlanForm((current) => ({ ...current, grade: event.target.value }))
                    }
                  >
                    <option value="">Select grade</option>
                    {gradeOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-stack">
                  <span>Plan name</span>
                  <input
                    value={feePlanForm.name}
                    onChange={(event) =>
                      setFeePlanForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Grade 7 Standard Plan"
                  />
                </label>
                {feePlanItems.map((item, index) => (
                  <div key={index} className="form-grid">
                    <label className="field-stack">
                      <span>{`Item ${index + 1}`}</span>
                      <input
                        value={item.label}
                        onChange={(event) =>
                          setFeePlanItems((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, label: event.target.value }
                                : entry,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="field-stack">
                      <span>Amount</span>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(event) =>
                          setFeePlanItems((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, amount: event.target.value }
                                : entry,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                ))}
                <div className="loan-filter-row">
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      setFeePlanItems((current) => [
                        ...current,
                        { label: '', amount: '0' },
                      ])
                    }
                  >
                    Add Fee Item
                  </button>
                  {feePlanItems.length > 1 ? (
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        setFeePlanItems((current) => current.slice(0, current.length - 1))
                      }
                    >
                      Remove Last Item
                    </button>
                  ) : null}
                </div>
                <button type="submit" className="btn btn-primary">
                  Create Fee Plan
                </button>
                {feePlanMessage ? <p className="muted">{feePlanMessage}</p> : null}
              </form>

              <div>
                <p className="eyebrow">Configured fee plans</p>
                <SimpleTable
                  headers={['Plan', 'School', 'Grade', 'Term', 'Status', 'Total']}
                  rows={feePlans.map((item) => [
                    item.name,
                    item.schoolName,
                    item.grade,
                    `${item.academicYear} · ${item.term}`,
                    titleCase(item.status),
                    formatMoney(item.total),
                  ])}
                  emptyState={{
                    title: 'No fee plans yet',
                    description: 'Create a fee plan before generating invoice batches.',
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="loan-detail-grid">
            <div>
              <p className="eyebrow">{isSchoolPortal ? 'Billing status' : 'Invoice actions'}</p>
              <p className="muted">
                {isSchoolPortal
                  ? 'Review due balances, partially paid invoices, and parent-facing billing status.'
                  : 'Queue reminders, jump into student payment history, or generate a school batch.'}
              </p>
            </div>
            <div>
              <p className="eyebrow">{isSchoolPortal ? 'Billing filters' : 'Batch controls'}</p>
              <div className="form-grid" style={{ marginBottom: 12 }}>
                <label className="field-stack">
                  <span>Grade scope</span>
                  <select
                    value={billingGradeFilter}
                    onChange={(event) => setBillingGradeFilter(event.target.value)}
                  >
                    <option value="">All grades</option>
                    {gradeOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-stack">
                  <span>Invoice status</span>
                  <select
                    value={invoiceStatusFilter}
                    onChange={(event) => setInvoiceStatusFilter(event.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="open">Open</option>
                    <option value="partially_paid">Partially paid</option>
                    <option value="paid">Paid</option>
                  </select>
                </label>
              </div>
              <div className="loan-filter-row">
                {!isSchoolPortal ? (
                  <button type="button" className="btn" onClick={() => void handlePreviewBatch()}>
                    Preview Invoice Batch
                  </button>
                ) : null}
                <button type="button" className="btn" onClick={() => void handleBulkReminder()}>
                  {isSchoolPortal ? 'Queue Parent Reminders' : 'Send Bulk Reminders'}
                </button>
                <button type="button" className="btn" onClick={handleExportInvoices}>
                  Export Invoices CSV
                </button>
                {!isSchoolPortal ? (
                  <button type="button" className="btn btn-primary" onClick={() => void handleGenerateBatch()}>
                    Generate Invoice Batch
                  </button>
                ) : null}
              </div>
              {invoiceActionMessage ? <p className="muted">{invoiceActionMessage}</p> : null}
            </div>
          </div>
          {!isSchoolPortal && invoicePreview ? (
            <SimpleTable
              headers={['Grade', 'Students', 'Plan', 'Plan status', 'Invoice total']}
              rows={invoicePreview.grades.map((item) => [
                item.grade,
                item.totalStudents.toLocaleString(),
                item.feePlanName ?? 'No plan',
                item.activePlan ? 'Ready' : 'Missing plan',
                item.invoiceTotal > 0 ? formatMoney(item.invoiceTotal) : 'n/a',
              ])}
              emptyState={{
                title: 'No preview rows',
                description: 'No students were found for the selected school and term.',
              }}
            />
          ) : null}
          <SimpleTable
            headers={['Invoice', 'Student', 'School', 'Total', 'Balance', 'Status', 'Actions']}
            rows={buildInvoiceRows(
              filteredInvoices,
              selectedStudentId,
              selectedInvoiceNo,
              setSelectedStudentId,
              setSelectedInvoiceNo,
              (invoiceNo) => void handleReminder(invoiceNo),
            )}
            emptyState={{
              title: 'No invoices yet',
              description: 'Generated school invoices will appear here once fee plans are published.',
            }}
          />
          {selectedInvoice ? (
            <Panel
              title={`${selectedInvoice.invoiceNo} · Invoice Detail`}
              description="Inspect one invoice in detail before sending reminders or opening payment history."
            >
              <SimpleTable
                headers={['Field', 'Value']}
                rows={[
                  ['Invoice', selectedInvoice.invoiceNo],
                  ['Student', `${selectedInvoice.studentName} (${selectedInvoice.studentId})`],
                  ['School', selectedInvoice.schoolName],
                  ['Total', formatMoney(selectedInvoice.total)],
                  ['Paid', formatMoney(selectedInvoice.paid)],
                  ['Balance', formatMoney(selectedInvoice.balance)],
                  ['Status', titleCase(selectedInvoice.status)],
                  ['Due date', selectedInvoice.dueDate],
                ]}
              />
            </Panel>
          ) : null}
        </Panel>
      ) : null}

      {activeSection === 'collections' ? (
        <Panel
          title={isSchoolPortal ? 'Communication' : 'Collections And Reconciliation'}
          description={
            isSchoolPortal
              ? 'Prepare parent outreach for due balances, partial payments, and bank-app link gaps.'
              : 'Every school payment should move through receipt normalization, matching, and settlement tracking.'
          }
        >
          {isSchoolPortal ? (
            <>
              <div className="dashboard-summary-strip">
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Parents with phone</span>
                  <strong>{overviewOperationalSummary.parentsWithPhone.toLocaleString()}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Due reminders</span>
                  <strong>{filteredInvoices.filter((item) => item.status === 'open').length.toLocaleString()}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Partial follow-up</span>
                  <strong>
                    {filteredInvoices
                      .filter((item) => item.status === 'partially_paid')
                      .length.toLocaleString()}
                  </strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Link gaps</span>
                  <strong>{overviewOperationalSummary.parentLinkGaps.toLocaleString()}</strong>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <p className="eyebrow">Parent communication queue</p>
                <SimpleTable
                  headers={['Student', 'Parent', 'Amount due', 'Status', 'Action']}
                  rows={buildSchoolCommunicationRows(filteredInvoices, visibleRegistry, (invoiceNo) =>
                    void handleReminder(invoiceNo),
                  )}
                  emptyState={{
                    title: 'No communication actions queued',
                    description: 'Students with due or partially paid invoices will appear here for reminder follow-up.',
                  }}
                />
              </div>
              {invoiceActionMessage ? <p className="muted">{invoiceActionMessage}</p> : null}
            </>
          ) : (
            <>
          {selectedSchool ? (
            <div className="loan-action-banner" style={{ marginBottom: 16 }}>
              <strong>{`Scoped to ${selectedSchool.name}`}</strong>
              <span>{`Collections and settlement review are limited to ${selectedSchool.branchName}.`}</span>
              {selectedSchoolOperationalCard ? (
                <div className="dashboard-summary-strip" style={{ marginTop: 12 }}>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Students due</span>
                    <strong>{selectedSchoolOperationalCard.dueStudents.toLocaleString()}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Linked parents</span>
                    <strong>{selectedSchoolOperationalCard.linkedParents.toLocaleString()}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Open invoices</span>
                    <strong>{selectedSchoolOperationalCard.openInvoices.toLocaleString()}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Today collected</span>
                    <strong>{formatMoney(selectedSchoolOperationalCard.todayCollections)}</strong>
                  </div>
                </div>
              ) : null}
              <div className="loan-filter-row">
                <button
                  type="button"
                  className="loan-watchlist-link"
                  onClick={() => setSchoolFilter(isSchoolPortal ? scopedSchoolId : '')}
                >
                  Clear scope
                </button>
                <button type="button" className="loan-watchlist-link" onClick={() => setActiveSection('registry')}>
                  Open registry
                </button>
                <button type="button" className="loan-watchlist-link" onClick={() => setActiveSection('billing')}>
                  Open billing
                </button>
              </div>
            </div>
          ) : null}
          {collectionSummary ? (
            <>
              <div className="dashboard-summary-strip">
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Receipts</span>
                  <strong>{collectionSummary.receipts.toLocaleString()}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Successful</span>
                  <strong>{collectionSummary.successful.toLocaleString()}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Matched amount</span>
                  <strong>{formatMoney(collectionSummary.matchedAmount)}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Awaiting settlement</span>
                  <strong>{formatMoney(collectionSummary.awaitingSettlementAmount)}</strong>
                </div>
              </div>
              <div className="loan-detail-grid" style={{ marginTop: 16 }}>
                <div>
                  <p className="eyebrow">Reconciliation summary</p>
                  <SimpleTable
                    headers={['Metric', 'Value']}
                    rows={[
                      ['Generated at', formatDateTime(collectionSummary.generatedAt)],
                      ['Total amount', formatMoney(collectionSummary.totalAmount)],
                      ['Pending settlement receipts', collectionSummary.pendingSettlement.toLocaleString()],
                      ['Awaiting settlement amount', formatMoney(collectionSummary.awaitingSettlementAmount)],
                    ]}
                  />
                </div>
                <div>
                  <p className="eyebrow">Settlement aging</p>
                  <SimpleTable
                    headers={['Bucket', 'Receipts', 'Amount']}
                    rows={collectionSummary.aging.map((item) => [
                      item.label,
                      item.count.toLocaleString(),
                      formatMoney(item.amount),
                    ])}
                    emptyState={{
                      title: 'No settlement aging',
                      description: 'Awaiting-settlement receipts will appear here once they are recorded.',
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <p className="eyebrow">{isSchoolPortal ? 'Settlement summary' : 'Settlement by school'}</p>
                <SimpleTable
                  headers={
                    isSchoolPortal
                      ? ['Receipts', 'Total amount', 'Matched amount', 'Awaiting settlement', 'Pending receipts', 'Last recorded']
                      : ['School', 'Receipts', 'Total amount', 'Matched amount', 'Awaiting settlement', 'Pending receipts', 'Last recorded']
                  }
                  rows={settlementRows.map((item) =>
                    isSchoolPortal
                      ? [
                          item.receipts.toLocaleString(),
                          formatMoney(item.totalAmount),
                          formatMoney(item.matchedAmount),
                          formatMoney(item.awaitingSettlementAmount),
                          item.pendingSettlement.toLocaleString(),
                          item.lastRecordedAt ? formatDateTime(item.lastRecordedAt) : 'n/a',
                        ]
                      : [
                          item.schoolName,
                          item.receipts.toLocaleString(),
                          formatMoney(item.totalAmount),
                          formatMoney(item.matchedAmount),
                          formatMoney(item.awaitingSettlementAmount),
                          item.pendingSettlement.toLocaleString(),
                          item.lastRecordedAt ? formatDateTime(item.lastRecordedAt) : 'n/a',
                        ],
                  )}
                  emptyState={{
                    title: isSchoolPortal ? 'No settlement summary yet' : 'No school settlement rows',
                    description: isSchoolPortal
                      ? 'Settlement data will appear here once school-payment receipts are recorded.'
                      : 'Settlement summaries will appear here once school-payment receipts are recorded.',
                  }}
                />
              </div>
            </>
          ) : null}
          <div className="dashboard-toolbar">
            <label className="field-stack">
              <span>Reconciliation</span>
              <select
                value={collectionReconciliationFilter}
                onChange={(event) => setCollectionReconciliationFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                {reconciliationOptions.map((item) => (
                  <option key={item} value={item}>
                    {titleCase(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-stack">
              <span>Recorded from</span>
              <input
                type="date"
                value={collectionDateFrom}
                onChange={(event) => setCollectionDateFrom(event.target.value)}
              />
            </label>
            <label className="field-stack">
              <span>Recorded to</span>
              <input
                type="date"
                value={collectionDateTo}
                onChange={(event) => setCollectionDateTo(event.target.value)}
              />
            </label>
          </div>
          <div className="loan-filter-row" style={{ marginBottom: 16 }}>
            <button type="button" className="btn" onClick={handleExportCollections}>
              Export Collections CSV
            </button>
            {schoolFilter ? (
              <p className="muted">Export scope is limited to the currently selected school.</p>
            ) : null}
            {collectionReconciliationFilter || collectionDateFrom || collectionDateTo ? (
              <p className="muted">Export uses the current reconciliation and date filters.</p>
            ) : null}
          </div>
          <SimpleTable
            headers={['Receipt', 'Student', 'Channel', 'Amount', 'Reconciliation', 'Recorded']}
            rows={buildCollectionRows(filteredCollections)}
            emptyState={{
              title: 'No collections yet',
              description: 'School payment receipts will appear here after the first successful transactions.',
            }}
          />
            </>
          )}
        </Panel>
      ) : null}

      {activeSection === 'onboarding' ? (
        <Panel
          title={onboardingTitle}
          description={onboardingDescription}
        >
          <div className="loan-detail-grid">
            <form className="form-stack" onSubmit={(event) => void handleRegisterStudent(event)}>
              <p className="eyebrow">New student registration</p>
              {isSchoolPortal ? (
                <label className="field-stack">
                  <span>School</span>
                  <input value={session.schoolName} disabled />
                </label>
              ) : (
                <label className="field-stack">
                  <span>School</span>
                  <select
                    value={registrationForm.schoolId}
                    onChange={(event) =>
                      setRegistrationForm((current) => ({ ...current, schoolId: event.target.value }))
                    }
                  >
                    <option value="">Use selected school</option>
                    {schools.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="form-grid">
                <label className="field-stack">
                  <span>Student ID</span>
                  <input
                    value={registrationForm.studentId}
                    onChange={(event) =>
                      setRegistrationForm((current) => ({
                        ...current,
                        studentId: event.target.value,
                      }))
                    }
                    placeholder="Auto-generated (optional)"
                  />
                  <small className="field-hint">
                    Leave blank to let the system assign the next consecutive ID.
                  </small>
                </label>
                <label className="field-stack">
                  <span>Student full name</span>
                  <input
                    value={registrationForm.fullName}
                    onChange={(event) =>
                      setRegistrationForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="Abel Getnet"
                  />
                </label>
              </div>
              <div className="form-grid">
                <label className="field-stack">
                  <span>Grade</span>
                  <input
                    value={registrationForm.grade}
                    onChange={(event) =>
                      setRegistrationForm((current) => ({
                        ...current,
                        grade: event.target.value,
                      }))
                    }
                    placeholder="Grade 6"
                  />
                </label>
                <label className="field-stack">
                  <span>Section</span>
                  <input
                    value={registrationForm.section}
                    onChange={(event) =>
                      setRegistrationForm((current) => ({
                        ...current,
                        section: event.target.value,
                      }))
                    }
                    placeholder="A"
                  />
                </label>
              </div>
              <label className="field-stack">
                <span>Parent name</span>
                <input
                  value={registrationForm.guardianName}
                  onChange={(event) =>
                    setRegistrationForm((current) => ({
                      ...current,
                      guardianName: event.target.value,
                    }))
                  }
                  placeholder="Getnet Belay"
                />
              </label>
              <label className="field-stack">
                <span>Parent phone number</span>
                <input
                  value={registrationForm.guardianPhone}
                  onChange={(event) =>
                    setRegistrationForm((current) => ({
                      ...current,
                      guardianPhone: event.target.value,
                    }))
                  }
                  placeholder="0911000001"
                />
              </label>
              <label className="field-stack">
                <span>Parent account number</span>
                <input
                  value={registrationForm.memberCustomerId}
                  onChange={(event) =>
                    setRegistrationForm((current) => ({
                      ...current,
                      memberCustomerId: event.target.value,
                    }))
                  }
                  placeholder="BUN-100001"
                />
              </label>
              <label className="field-stack">
                <span>Monthly fee amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={registrationForm.monthlyFee}
                  onChange={(event) =>
                    setRegistrationForm((current) => ({
                      ...current,
                      monthlyFee: event.target.value,
                    }))
                  }
                  placeholder="5000"
                />
              </label>
              <button type="submit" className="btn btn-primary">
                Register Student
              </button>
              <p className="muted">
                {registrationHelper} Use parent phone and account number together when both are available so the parent can be identified quickly.
              </p>
            </form>
            {!isSchoolPortal ? (
              <>
                <form className="form-stack" onSubmit={(event) => void handleCreateSchool(event)}>
                  <p className="eyebrow">School onboarding</p>
                  <label className="field-stack">
                    <span>School name</span>
                    <input
                      value={schoolForm.name}
                      onChange={(event) =>
                        setSchoolForm((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="Blue Nile Academy"
                    />
                  </label>
                  <label className="field-stack">
                    <span>School code</span>
                    <input
                      value={schoolForm.code}
                      onChange={(event) =>
                        setSchoolForm((current) => ({ ...current, code: event.target.value }))
                      }
                      placeholder="SCH-3001"
                    />
                  </label>
                  <div className="form-grid">
                    <label className="field-stack">
                      <span>Linked branch</span>
                      <input
                        value={schoolForm.branchName}
                        onChange={(event) =>
                          setSchoolForm((current) => ({ ...current, branchName: event.target.value }))
                        }
                        placeholder="Bahir Dar Branch"
                      />
                    </label>
                    <label className="field-stack">
                      <span>City</span>
                      <input
                        value={schoolForm.city}
                        onChange={(event) =>
                          setSchoolForm((current) => ({ ...current, city: event.target.value }))
                        }
                        placeholder="Bahir Dar"
                      />
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Create School
                  </button>
                </form>

                <form className="form-stack" onSubmit={(event) => void handleImportStudents(event)}>
                  <p className="eyebrow">Student import</p>
                  <label className="field-stack">
                    <span>School</span>
                    <select
                      value={importSchoolId}
                      onChange={(event) => setImportSchoolId(event.target.value)}
                    >
                      <option value="">Use first available school</option>
                      {schools.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-stack">
                    <span>CSV rows</span>
                    <textarea
                      rows={6}
                      value={importText}
                      onChange={(event) => setImportText(event.target.value)}
                      placeholder="studentId,fullName,grade,section,guardianName,guardianPhone"
                    />
                  </label>
                  <button type="submit" className="btn btn-primary">
                    Import Students
                  </button>
                  <p className="muted">
                    Format: `studentId, fullName, grade, section, guardianName, guardianPhone`
                  </p>
                </form>
              </>
            ) : null}
          </div>
          {setupMessage ? <p className="muted">{setupMessage}</p> : null}
        </Panel>
      ) : null}
    </div>
  );
}

function buildSchoolRows(items: SchoolPortfolioItem[]) {
  return items.map((item) => [
    item.name,
    item.branchName,
    item.students.toLocaleString(),
    item.openInvoices.toLocaleString(),
    formatMoney(item.todayCollections),
    titleCase(item.status),
  ]);
}

function buildInvoiceRows(
  items: SchoolInvoiceItem[],
  selectedStudentId: string,
  selectedInvoiceNo: string,
  onOpenStudent: (studentId: string) => void,
  onOpenInvoice: (invoiceNo: string) => void,
  onSendReminder: (invoiceNo: string) => void,
) {
  return items.map((item) => [
    item.invoiceNo,
    item.studentId,
    item.schoolName,
    formatMoney(item.total),
    formatMoney(item.balance),
    titleCase(item.status),
    <div key={item.invoiceNo} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() => onOpenInvoice(item.invoiceNo)}
      >
        {selectedInvoiceNo === item.invoiceNo ? 'Opened' : 'Open detail'}
      </button>
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() => onSendReminder(item.invoiceNo)}
      >
        Send reminder
      </button>
      <button
        type="button"
        className="loan-watchlist-link"
        onClick={() => onOpenStudent(item.studentId)}
      >
        {selectedStudentId === item.studentId ? 'Payment history opened' : 'Open payment history'}
      </button>
    </div>,
  ]);
}

function buildCollectionRows(items: SchoolCollectionItem[]) {
  return items.map((item) => [
    item.receiptNo,
    item.studentId,
    titleCase(item.channel),
    formatMoney(item.amount),
    titleCase(item.reconciliationStatus),
    formatDateTime(item.recordedAt),
  ]);
}

function summarizeSchoolSettlements(items: SchoolCollectionItem[]): SchoolSettlementSummaryItem[] {
  return Array.from(
    items.reduce<Map<string, SchoolSettlementSummaryItem>>((accumulator, item) => {
      const current = accumulator.get(item.schoolId) ?? {
        schoolId: item.schoolId,
        schoolName: item.schoolName,
        receipts: 0,
        totalAmount: 0,
        matchedAmount: 0,
        awaitingSettlementAmount: 0,
        pendingSettlement: 0,
        lastRecordedAt: item.recordedAt,
      };

      current.receipts += 1;
      current.totalAmount += item.amount;
      current.lastRecordedAt =
        !current.lastRecordedAt || current.lastRecordedAt < item.recordedAt
          ? item.recordedAt
          : current.lastRecordedAt;

      if (item.reconciliationStatus === 'matched') {
        current.matchedAmount += item.amount;
      } else if (item.reconciliationStatus === 'awaiting_settlement') {
        current.awaitingSettlementAmount += item.amount;
        current.pendingSettlement += 1;
      }

      accumulator.set(item.schoolId, current);
      return accumulator;
    }, new Map())
      .values(),
  ).sort((left, right) => right.awaitingSettlementAmount - left.awaitingSettlementAmount);
}

function buildRegistryRows(
  items: StudentRegistryItem[],
  selectedStudentId: string,
  onSelect: (studentId: string) => void,
  feePlans: FeePlanRecord[],
  invoices: SchoolInvoiceItem[],
) {
  return items.map((item) => [
    `${item.fullName} (${item.studentId})`,
    `${item.guardianName} (${item.guardianPhone || 'n/a'})`,
    renderSchoolStatusBadge(resolveRegistryAccessLabel(item), schoolAccessBadgeTone(item)),
    renderMonthlyFeeCell(resolveMonthlyFee(item, feePlans)),
    renderSchoolStatusBadge(
      resolveRegistryPaymentLabel(item, invoices),
      schoolPaymentBadgeTone(resolveRegistryPaymentLabel(item, invoices)),
    ),
    `${titleCase(item.enrollmentStatus)} · ${item.grade} ${item.section}`,
    <button
      key={item.studentId}
      type="button"
      className="loan-watchlist-link"
      onClick={() => onSelect(item.studentId)}
    >
      {selectedStudentId === item.studentId ? 'Opened' : 'Open detail'}
    </button>,
  ]);
}

function resolveMonthlyFee(student: StudentRegistryItem, feePlans: FeePlanRecord[]) {
  const matchingPlan = feePlans.find(
    (item) =>
      item.schoolId === student.schoolId &&
      item.grade === student.grade &&
      item.status !== 'archived',
  );

  return matchingPlan?.total;
}

function resolveRegistryPaymentLabel(student: StudentRegistryItem, invoices: SchoolInvoiceItem[]) {
  const studentInvoices = invoices.filter((item) => item.studentId === student.studentId);
  if (studentInvoices.some((item) => item.status === 'open')) {
    return 'Due';
  }
  if (studentInvoices.some((item) => item.status === 'partially_paid')) {
    return 'Partially paid';
  }
  if (studentInvoices.some((item) => item.status === 'paid')) {
    return 'Paid';
  }

  return 'No invoice';
}

function resolveRegistryAccessLabel(student: StudentRegistryItem) {
  if (student.guardianStatus === 'linked') {
    return 'Linked';
  }
  if (student.guardianStatus === 'pending_verification') {
    return 'Pending link';
  }

  return 'Not linked';
}

function buildRegistryMetrics(
  items: StudentRegistryItem[],
  feePlans: FeePlanRecord[],
  invoices: SchoolInvoiceItem[],
) {
  return {
    students: items.length,
    linkedParents: items.filter((item) => item.guardianStatus === 'linked').length,
    monthlyFees: items.reduce((sum, item) => sum + (resolveMonthlyFee(item, feePlans) ?? 0), 0),
    overdueStudents: items.filter((item) =>
      invoices.some(
        (invoice) =>
          invoice.studentId === item.studentId &&
          (invoice.status === 'open' || invoice.status === 'partially_paid'),
      ),
    ).length,
  };
}

function buildSchoolFollowUpRows(
  items: StudentRegistryItem[],
  feePlans: FeePlanRecord[],
  invoices: SchoolInvoiceItem[],
  onOpenStudent: (studentId: string) => void,
) {
  return items
    .map((item) => {
      const paymentLabel = resolveRegistryPaymentLabel(item, invoices);
      const accessLabel = resolveRegistryAccessLabel(item);
      const priority =
        paymentLabel === 'Due'
          ? 0
          : paymentLabel === 'Partially paid'
            ? 1
            : accessLabel !== 'Linked'
              ? 2
              : paymentLabel === 'No invoice'
                ? 3
                : 4;

      return {
        item,
        paymentLabel,
        accessLabel,
        priority,
      };
    })
    .sort((left, right) => left.priority - right.priority || left.item.fullName.localeCompare(right.item.fullName))
    .slice(0, 5)
    .map(({ item, paymentLabel, accessLabel }) => [
      `${item.fullName} (${item.studentId})`,
      `${item.guardianName} (${item.guardianPhone || 'n/a'})`,
      renderMonthlyFeeCell(resolveMonthlyFee(item, feePlans)),
      renderSchoolStatusBadge(paymentLabel, schoolPaymentBadgeTone(paymentLabel)),
      renderSchoolStatusBadge(accessLabel, schoolAccessBadgeTone(item)),
      <button
        key={item.studentId}
        type="button"
        className="loan-watchlist-link"
        onClick={() => onOpenStudent(item.studentId)}
      >
        Open student
      </button>,
    ]);
}

function buildSchoolCommunicationRows(
  invoices: SchoolInvoiceItem[],
  registry: StudentRegistryItem[],
  onSendReminder: (invoiceNo: string) => void,
) {
  return invoices
    .filter((item) => item.status === 'open' || item.status === 'partially_paid')
    .slice(0, 8)
    .map((item) => {
      const student = registry.find((entry) => entry.studentId === item.studentId);
      const paymentLabel = item.status === 'partially_paid' ? 'Partially paid' : 'Due';
      return [
        `${item.studentName} (${item.studentId})`,
        `${student?.guardianName ?? 'Parent pending'} (${student?.guardianPhone || 'n/a'})`,
        formatMoney(item.balance),
        renderSchoolStatusBadge(paymentLabel, schoolPaymentBadgeTone(paymentLabel)),
        <button
          key={item.invoiceNo}
          type="button"
          className="loan-watchlist-link"
          onClick={() => onSendReminder(item.invoiceNo)}
        >
          Send reminder
        </button>,
      ];
    });
}

function buildOverviewOperationalSummary(
  items: StudentRegistryItem[],
  feePlans: FeePlanRecord[],
  invoices: SchoolInvoiceItem[],
) {
  return {
    linkedParents: items.filter((item) => item.guardianStatus === 'linked').length,
    pendingParents: items.filter((item) => item.guardianStatus === 'pending_verification').length,
    unlinkedParents: items.filter(
      (item) => item.guardianStatus !== 'linked' && item.guardianStatus !== 'pending_verification',
    ).length,
    parentsWithPhone: items.filter((item) => item.guardianPhone.trim().length > 0).length,
    dueStudents: items.filter((item) =>
      invoices.some(
        (invoice) =>
          invoice.studentId === item.studentId &&
          (invoice.status === 'open' || invoice.status === 'partially_paid'),
      ),
    ).length,
    partiallyPaidStudents: items.filter((item) =>
      invoices.some(
        (invoice) => invoice.studentId === item.studentId && invoice.status === 'partially_paid',
      ),
    ).length,
    paidStudents: items.filter((item) =>
      invoices.some((invoice) => invoice.studentId === item.studentId && invoice.status === 'paid'),
    ).length,
    noInvoiceStudents: items.filter(
      (item) => !invoices.some((invoice) => invoice.studentId === item.studentId),
    ).length,
    parentLinkGaps: items.filter((item) => item.guardianStatus !== 'linked').length,
    monthlyFees: items.reduce((sum, item) => sum + (resolveMonthlyFee(item, feePlans) ?? 0), 0),
  };
}

function buildSchoolOperationalCards(
  schools: SchoolPortfolioItem[],
  registry: StudentRegistryItem[],
  invoices: SchoolInvoiceItem[],
  collections: SchoolCollectionItem[],
) {
  return schools.map((school) => {
    const schoolStudents = registry.filter((item) => item.schoolId === school.id);
    const schoolInvoices = invoices.filter((item) => item.schoolId === school.id);
    const schoolCollections = collections.filter((item) => item.schoolId === school.id);
    const awaitingSettlementCount = schoolCollections.filter(
      (item) => item.reconciliationStatus === 'awaiting_settlement',
    ).length;

    const settlementLabel =
      awaitingSettlementCount > 0
        ? `${awaitingSettlementCount} awaiting settlement`
        : schoolCollections.length > 0
          ? 'Collections matched'
          : 'No collections yet';
    const settlementTone: 'warning' | 'positive' | 'neutral' =
      awaitingSettlementCount > 0
        ? 'warning'
        : schoolCollections.length > 0
          ? 'positive'
          : 'neutral';

    return {
      schoolId: school.id,
      schoolName: school.name,
      branchName: school.branchName,
      dueStudents: schoolStudents.filter((item) =>
        schoolInvoices.some(
          (invoice) =>
            invoice.studentId === item.studentId &&
            (invoice.status === 'open' || invoice.status === 'partially_paid'),
        ),
      ).length,
      linkedParents: schoolStudents.filter((item) => item.guardianStatus === 'linked').length,
      openInvoices: schoolInvoices.filter(
        (item) => item.status === 'open' || item.status === 'partially_paid',
      ).length,
      todayCollections: school.todayCollections,
      settlementLabel,
      settlementTone,
    };
  });
}

function filterSchoolsForBankScope(
  schools: SchoolPortfolioItem[],
  scope: {
    branchName?: string;
    districtName?: string;
  },
) {
  if (scope.branchName === 'Head Office') {
    return schools;
  }

  if (scope.branchName && scope.branchName.trim().length > 0) {
    return schools.filter((item) => item.branchName === scope.branchName);
  }

  if (scope.districtName && scope.districtName.trim().length > 0) {
    const districtStem = scope.districtName
      .replace(/\s+district$/i, '')
      .trim()
      .toLowerCase();
    const districtScoped = schools.filter((item) =>
      item.branchName.toLowerCase().includes(districtStem),
    );
    return districtScoped.length > 0 ? districtScoped : schools;
  }

  return schools;
}

function renderMonthlyFeeCell(amount?: number) {
  if (typeof amount !== 'number') {
    return <span className="table-status-badge subtle">Fee plan needed</span>;
  }

  return formatMoney(amount);
}

function renderSchoolStatusBadge(label: string, tone: 'positive' | 'warning' | 'critical' | 'neutral') {
  return <span className={`table-status-badge ${tone}`}>{label}</span>;
}

function schoolPaymentBadgeTone(label: string) {
  if (label === 'Paid') {
    return 'positive';
  }
  if (label === 'Due' || label === 'Partially paid') {
    return 'warning';
  }
  if (label === 'No invoice') {
    return 'neutral';
  }

  return 'neutral';
}

function schoolAccessBadgeTone(student: StudentRegistryItem) {
  if (student.guardianStatus === 'linked') {
    return 'positive';
  }
  if (student.guardianStatus === 'pending_verification') {
    return 'warning';
  }

  return 'critical';
}

function buildStudentOperationalSummary(detail: StudentDetail, feePlans: FeePlanRecord[]) {
  const monthlyFee = resolveMonthlyFee(detail.student, feePlans);
  const outstandingBalance = detail.invoices.reduce((sum, item) => sum + item.balance, 0);
  const activeLink = detail.guardianLinks.find((item) => item.status === 'active');
  const hasLinkedBankAccount = Boolean(activeLink?.memberCustomerId);
  const hasAppAccess = hasLinkedBankAccount || detail.student.guardianStatus === 'linked';

  return {
    monthlyFee,
    outstandingBalance,
    paymentLabel: resolveRegistryPaymentLabel(detail.student, detail.invoices),
    hasLinkedBankAccount,
    hasAppAccess,
    memberCustomerId: activeLink?.memberCustomerId,
    accessLabel: hasLinkedBankAccount ? 'Bank + app linked' : hasAppAccess ? 'App linked' : 'Not linked',
  };
}

function formatMoney(amount?: number) {
  if (typeof amount !== 'number') {
    return '...';
  }

  return `ETB ${amount.toLocaleString()}`;
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (item) => item.toUpperCase());
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-ET', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function parseImportRows(input: string): StudentImportRowInput[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(',').map((part) => part.trim()))
    .filter((parts) => parts.length >= 2)
    .map(([studentId, fullName, grade, section, guardianName, guardianPhone]) => ({
      studentId,
      fullName,
      grade,
      section,
      guardianName,
      guardianPhone,
    }));
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  if (typeof document === 'undefined') {
    return;
  }

  const csvContent = [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string | number) {
  const normalized = String(value ?? '');
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}
