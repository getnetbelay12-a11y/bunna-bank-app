import { useMemo, useState } from 'react';

import { useAppClient } from '../../app/AppContext';
import type {
  ParentPortalSession,
  ParentPortalPaymentResult,
  ParentStudentAccount,
  ParentStudentLookupItem,
} from '../../core/api/contracts';
import { Panel } from '../../shared/components/Panel';
import { SimpleTable } from '../../shared/components/SimpleTable';

export function ParentPortalPage() {
  const { parentPortalApi } = useAppClient();
  const [session, setSession] = useState<ParentPortalSession | null>(null);
  const [customerId, setCustomerId] = useState('BUN-100001');
  const [password, setPassword] = useState('demo-pass');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<ParentStudentLookupItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [account, setAccount] = useState<ParentStudentAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [message, setMessage] = useState('');
  const [lastPayment, setLastPayment] = useState<ParentPortalPaymentResult | null>(null);
  const [qrRequest, setQrRequest] = useState<{
    invoiceNo: string;
    amount: number;
    deepLink: string;
    reference: string;
  } | null>(null);

  const selectedInvoice = useMemo(
    () =>
      account?.invoices.find((item) => item.invoiceNo === selectedInvoiceNo) ??
      account?.invoices.find((item) => item.balance > 0) ??
      account?.invoices[0] ??
      null,
    [account, selectedInvoiceNo],
  );

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parentPortalApi) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const nextSession = await parentPortalApi.login({ customerId, password });
      setSession(nextSession);
      const linkedStudents = await parentPortalApi.getLinkedStudents();
      setMatches(linkedStudents);
      const nextStudentId = linkedStudents[0]?.studentId ?? '';
      setSelectedStudentId(nextStudentId);
      const nextAccount = nextStudentId
        ? await parentPortalApi.getStudentAccount(nextStudentId)
        : null;
      setAccount(nextAccount);
      setSelectedInvoiceNo(
        nextAccount?.invoices.find((item) => item.balance > 0)?.invoiceNo ??
          nextAccount?.invoices[0]?.invoiceNo ??
          '',
      );
      setLastPayment(null);
      setQrRequest(null);
    } catch {
      setMessage('Parent sign-in failed. Check customer ID and password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parentPortalApi || !session) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const linkedStudents = await parentPortalApi.getLinkedStudents();
      const normalizedQuery = query.trim().toLowerCase();
      const result = normalizedQuery
        ? linkedStudents.filter((item) =>
            [item.studentId, item.fullName, item.schoolName]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery),
          )
        : linkedStudents;
      setMatches(result);
      const nextStudentId = result[0]?.studentId ?? '';
      setSelectedStudentId(nextStudentId);
      const nextAccount = nextStudentId
        ? await parentPortalApi.getStudentAccount(nextStudentId)
        : null;
      setAccount(nextAccount);
      setSelectedInvoiceNo(
        nextAccount?.invoices.find((item) => item.balance > 0)?.invoiceNo ??
          nextAccount?.invoices[0]?.invoiceNo ??
          '',
      );
      setLastPayment(null);
      setQrRequest(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(studentId: string) {
    if (!parentPortalApi) {
      return;
    }

    setSelectedStudentId(studentId);
    setLoading(true);

    try {
      const nextAccount = await parentPortalApi.getStudentAccount(studentId);
      setAccount(nextAccount);
      setSelectedInvoiceNo(
        nextAccount?.invoices.find((item) => item.balance > 0)?.invoiceNo ??
          nextAccount?.invoices[0]?.invoiceNo ??
          '',
      );
      setLastPayment(null);
      setQrRequest(null);
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parentPortalApi || !selectedInvoice) {
      return;
    }

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Enter a valid payment amount.');
      return;
    }

    setLoading(true);

    try {
      const result = await parentPortalApi.submitPayment({
        invoiceNo: selectedInvoice.invoiceNo,
        amount,
        channel: 'mobile',
        payerName,
        payerPhone,
      });
      setLastPayment(result);
      setQrRequest(null);
      setMessage(result.message);
      setPaymentAmount('');
      if (selectedStudentId) {
        const nextAccount = await parentPortalApi.getStudentAccount(selectedStudentId);
        setAccount(nextAccount);
        setSelectedInvoiceNo(
          nextAccount?.invoices.find((item) => item.balance > 0)?.invoiceNo ??
            nextAccount?.invoices[0]?.invoiceNo ??
            '',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleGenerateQr() {
    if (!selectedInvoice) {
      return;
    }

    const amount = Number(paymentAmount || selectedInvoice.balance);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Enter a valid payment amount before generating QR.');
      return;
    }

    const reference = `SCH-${selectedInvoice.invoiceNo}-${Date.now().toString().slice(-6)}`;
    const deepLink = `bunnabank://school-pay?invoice=${encodeURIComponent(
      selectedInvoice.invoiceNo,
    )}&amount=${encodeURIComponent(String(amount))}&ref=${encodeURIComponent(reference)}`;

    setQrRequest({
      invoiceNo: selectedInvoice.invoiceNo,
      amount,
      deepLink,
      reference,
    });
    setLastPayment(null);
    setMessage('QR payment request prepared. Use the deep link or confirm after scanning.');
  }

  async function handleConfirmQrPayment() {
    if (!parentPortalApi || !qrRequest) {
      return;
    }

    setLoading(true);

    try {
      const result = await parentPortalApi.submitPayment({
        invoiceNo: qrRequest.invoiceNo,
        amount: qrRequest.amount,
        channel: 'qr',
        payerName,
        payerPhone,
      });
      setLastPayment(result);
      setQrRequest(null);
      setMessage(`QR payment confirmed. ${result.message}`);
      setPaymentAmount('');

      if (selectedStudentId) {
        const nextAccount = await parentPortalApi.getStudentAccount(selectedStudentId);
        setAccount(nextAccount);
        setSelectedInvoiceNo(
          nextAccount?.invoices.find((item) => item.balance > 0)?.invoiceNo ??
            nextAccount?.invoices[0]?.invoiceNo ??
            '',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="standalone-page">
      <div className="page-stack" style={{ width: 'min(1200px, 100%)' }}>
        {!session ? (
          <Panel
            title="Parent Portal Login"
            description="Sign in with a real member account before accessing linked student balances and receipts."
          >
            <form className="loan-detail-grid" onSubmit={(event) => void handleLogin(event)}>
              <div className="form-stack">
                <label className="field-stack">
                  <span>Customer ID</span>
                  <input
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    placeholder="BUN-100001"
                  />
                </label>
                <label className="field-stack">
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="demo-pass"
                  />
                </label>
              </div>
              <div className="form-stack">
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Demo member</span>
                  <strong>BUN-100001 / demo-pass</strong>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
                <a href="/" className="loan-watchlist-link">
                  Staff and school login
                </a>
              </div>
            </form>
            {message ? <p className="muted">{message}</p> : null}
          </Panel>
        ) : (
          <Panel
            title="Parent School Payment Portal"
            description={`Signed in as ${session.fullName}. View linked students, school invoices, and payment receipts.`}
          >
            <div className="dashboard-toolbar">
              <div className="dashboard-summary-chip">
                <span className="dashboard-summary-label">Customer ID</span>
                <strong>{session.customerId}</strong>
              </div>
              <div className="dashboard-summary-chip">
                <span className="dashboard-summary-label">Linked phone</span>
                <strong>{session.phone ?? 'n/a'}</strong>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setSession(null);
                  setMatches([]);
                  setAccount(null);
                  setSelectedStudentId('');
                  setMessage('');
                }}
              >
                Sign Out
              </button>
            </div>
          </Panel>
        )}

        {session ? (
        <Panel
          title="Linked Students"
          description="These students are linked to the signed-in member account through guardian contact matching."
        >
          <form className="dashboard-toolbar" onSubmit={(event) => void handleSearch(event)}>
            <label className="field-stack" style={{ minWidth: 320 }}>
              <span>Search linked students</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Student ID or student name"
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Filtering...' : 'Filter Students'}
            </button>
            <a href="/" className="loan-watchlist-link" style={{ alignSelf: 'end' }}>
              Staff and school login
            </a>
          </form>
        </Panel>
        ) : null}

        {session ? (
        <Panel
          title="Matched Students"
          description="Select the correct linked student before opening balances and payment history."
        >
          <SimpleTable
            headers={['Student', 'School', 'Grade', 'Fee status', 'Guardian', 'Open']}
            rows={matches.map((item) => [
              `${item.fullName} (${item.studentId})`,
              item.schoolName,
              `${item.grade} · ${item.section}`,
              item.paymentSummary
                ? `${titleCase(item.paymentSummary.paymentStatus)} · ${formatMoney(item.paymentSummary.outstandingBalance)} outstanding`
                : 'Pending billing',
              `${item.guardianName} (${item.guardianPhone || 'n/a'})`,
              <button
                key={item.studentId}
                type="button"
                className="loan-watchlist-link"
                onClick={() => void handleSelect(item.studentId)}
              >
                {selectedStudentId === item.studentId ? 'Opened' : 'Open account'}
              </button>,
            ])}
            emptyState={{
              title: 'No students selected yet',
              description: 'Run a search to find a student account for payment.',
            }}
          />
        </Panel>
        ) : null}

        {session && account ? (
          <>
            <Panel
              title={`${account.student.fullName} · Account`}
              description="Outstanding invoices, payment history, and receipt creation for parents and guardians."
            >
              <div className="dashboard-summary-strip">
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">School</span>
                  <strong>{account.student.schoolName}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Student ID</span>
                  <strong>{account.student.studentId}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Guardian</span>
                  <strong>{account.student.guardianName}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Outstanding balance</span>
                  <strong>{formatMoney(account.outstandingBalance)}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Fee status</span>
                  <strong>
                    {account.paymentSummary
                      ? titleCase(account.paymentSummary.paymentStatus)
                      : 'Pending billing'}
                  </strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Performance</span>
                  <strong>
                    {account.performanceSummary
                      ? `${account.performanceSummary.latestAverage}% average`
                      : 'Awaiting report'}
                  </strong>
                </div>
              </div>
            </Panel>

            <Panel
              title="Academic update"
              description="Latest grade, attendance, and teacher summary sent with the parent-linked student profile."
            >
              <div className="dashboard-summary-strip">
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Grade</span>
                  <strong>{account.student.grade}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Report period</span>
                  <strong>{account.performanceSummary?.latestReportPeriod ?? 'Current term'}</strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Attendance</span>
                  <strong>
                    {account.performanceSummary
                      ? `${account.performanceSummary.attendanceRate}%`
                      : 'n/a'}
                  </strong>
                </div>
                <div className="dashboard-summary-chip">
                  <span className="dashboard-summary-label">Class rank</span>
                  <strong>
                    {account.performanceSummary?.classRank
                      ? `#${account.performanceSummary.classRank}`
                      : 'n/a'}
                  </strong>
                </div>
              </div>
              <p className="muted">
                {account.parentUpdateSummary ??
                  account.performanceSummary?.teacherRemark ??
                  'No parent update has been published yet.'}
              </p>
            </Panel>

            <Panel
              title="Outstanding Invoices"
              description="Parents can pay full or partial amounts against open school invoices."
            >
              <SimpleTable
                headers={['Invoice', 'Due date', 'Total', 'Paid', 'Balance', 'Status']}
                rows={account.invoices.map((item) => [
                  item.invoiceNo,
                  item.dueDate,
                  formatMoney(item.total),
                  formatMoney(item.paid),
                  formatMoney(item.balance),
                  titleCase(item.status),
                ])}
                emptyState={{
                  title: 'No invoices found',
                  description: 'This student does not have a current school invoice.',
                }}
              />
            </Panel>

            <Panel
              title="Make Payment"
              description="The payment form defaults to the first invoice with a remaining balance."
            >
              <form className="loan-detail-grid" onSubmit={(event) => void handlePay(event)}>
                <div className="form-stack">
                  <label className="field-stack">
                    <span>Invoice</span>
                    <select
                      value={selectedInvoice?.invoiceNo ?? ''}
                      onChange={(event) => setSelectedInvoiceNo(event.target.value)}
                    >
                      {account.invoices.map((item) => (
                        <option key={item.invoiceNo} value={item.invoiceNo}>
                          {item.invoiceNo} · {formatMoney(item.balance)} outstanding
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-stack">
                    <span>Amount</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(event) => setPaymentAmount(event.target.value)}
                      placeholder={selectedInvoice ? `${selectedInvoice.balance}` : '0'}
                    />
                  </label>
                  <button
                    type="button"
                    className="loan-watchlist-link"
                    onClick={() =>
                      setPaymentAmount(
                        selectedInvoice ? String(selectedInvoice.balance) : '',
                      )
                    }
                    disabled={!selectedInvoice || selectedInvoice.balance <= 0}
                  >
                    Use full balance
                  </button>
                </div>
                <div className="form-stack">
                  <label className="field-stack">
                    <span>Payer name</span>
                    <input
                      value={payerName}
                      onChange={(event) => setPayerName(event.target.value)}
                      placeholder={account.student.guardianName}
                    />
                  </label>
                  <label className="field-stack">
                    <span>Payer phone</span>
                    <input
                      value={payerPhone}
                      onChange={(event) => setPayerPhone(event.target.value)}
                      placeholder={account.student.guardianPhone}
                    />
                  </label>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !selectedInvoice || selectedInvoice.balance <= 0}
                  >
                    {loading ? 'Processing...' : 'Pay Now'}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleGenerateQr}
                    disabled={!selectedInvoice || selectedInvoice.balance <= 0}
                  >
                    Generate QR Request
                  </button>
                </div>
              </form>
              {message ? <p className="muted">{message}</p> : null}
            </Panel>

            {qrRequest ? (
              <Panel
                title="QR Payment Request"
                description="Use this request to hand off payment into the mobile app, then confirm the payment result."
              >
                <div className="dashboard-summary-strip">
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Reference</span>
                    <strong>{qrRequest.reference}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Invoice</span>
                    <strong>{qrRequest.invoiceNo}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Requested amount</span>
                    <strong>{formatMoney(qrRequest.amount)}</strong>
                  </div>
                </div>
                <SimpleTable
                  headers={['Field', 'Value']}
                  rows={[
                    ['Reference', qrRequest.reference],
                    ['Deep link', qrRequest.deepLink],
                    ['Scan text', `QR|${qrRequest.reference}|${qrRequest.invoiceNo}|${qrRequest.amount}`],
                  ]}
                />
                <div className="loan-filter-row">
                  <a href={qrRequest.deepLink} className="btn btn-primary">
                    Open in mobile app
                  </a>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void navigator.clipboard?.writeText(qrRequest.deepLink)}
                  >
                    Copy deep link
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void handleConfirmQrPayment()}
                    disabled={loading}
                  >
                    {loading ? 'Confirming...' : 'Confirm QR Payment'}
                  </button>
                </div>
              </Panel>
            ) : null}

            {lastPayment?.status === 'successful' ? (
              <Panel
                title="Payment Confirmation"
                description="Receipt reference and remaining balance after the latest payment."
              >
                <div className="dashboard-summary-strip">
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Receipt</span>
                    <strong>{lastPayment.receiptNo ?? 'Pending'}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Applied amount</span>
                    <strong>{formatMoney(lastPayment.amount ?? 0)}</strong>
                  </div>
                  <div className="dashboard-summary-chip">
                    <span className="dashboard-summary-label">Remaining balance</span>
                    <strong>{formatMoney(lastPayment.remainingBalance ?? 0)}</strong>
                  </div>
                </div>
                <div className="loan-filter-row">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => downloadReceipt(account, lastPayment)}
                  >
                    Download Receipt
                  </button>
                </div>
              </Panel>
            ) : null}

            <Panel
              title="Payment History"
              description="Recent school-payment receipts and settlement visibility for the selected student."
            >
              <SimpleTable
                headers={[
                  'Receipt',
                  'Amount',
                  'Channel',
                  'Status',
                  'Reconciliation',
                  'Recorded',
                  'Actions',
                ]}
                rows={account.collections.map((item) => [
                  item.receiptNo,
                  formatMoney(item.amount),
                  titleCase(item.channel),
                  titleCase(item.status),
                  titleCase(item.reconciliationStatus),
                  formatDateTime(item.recordedAt),
                  <button
                    key={item.receiptNo}
                    type="button"
                    className="loan-watchlist-link"
                    onClick={() =>
                      downloadReceipt(account, {
                        status: item.status,
                        message: `Receipt ${item.receiptNo}`,
                        receiptNo: item.receiptNo,
                        studentId: item.studentId,
                        amount: item.amount,
                      })
                    }
                  >
                    Download receipt
                  </button>,
                ])}
                emptyState={{
                  title: 'No receipts yet',
                  description: 'Receipts appear here after the first successful school payment.',
                }}
              />
            </Panel>
          </>
        ) : null}
      </div>
    </div>
  );
}

function formatMoney(amount: number) {
  return `ETB ${amount.toLocaleString()}`;
}

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (item) => item.toUpperCase());
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

function downloadReceipt(
  account: ParentStudentAccount | null,
  receipt: ParentPortalPaymentResult,
) {
  if (!account || !receipt.receiptNo) {
    return;
  }

  const lines = [
    'Bunna Bank School Payment Receipt',
    `Receipt No: ${receipt.receiptNo}`,
    `Student: ${account.student.fullName} (${account.student.studentId})`,
    `School: ${account.student.schoolName}`,
    `Guardian: ${account.student.guardianName}`,
    `Amount: ETB ${(receipt.amount ?? 0).toLocaleString()}`,
    `Remaining Balance: ETB ${(receipt.remainingBalance ?? account.outstandingBalance).toLocaleString()}`,
    `Generated At: ${new Date().toISOString()}`,
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${receipt.receiptNo}.txt`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
