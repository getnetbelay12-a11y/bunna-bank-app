const brand = {
  name: 'Bunna Bank',
  insurance: 'Bunna Insurance',
  logoPath: '/bunna-bank-logo.png',
  primary: '#6f1317',
  primaryDeep: '#561015',
  accent: '#f3e8dd',
  border: '#e2d8d6',
  surface: '#faf7f6',
  page: '#f6f3f2',
  text: '#243746',
};

const demo = {
  customerName: 'Abebe Kebede',
  paymentAmount: 'ETB 502,346.00',
  dueDate: 'March 17, 2026',
  provider: 'Bunna Insurance',
  policyNumber: 'CUST-1001-INS-001',
  renewalDate: 'March 19, 2026',
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function infoNote(content: string) {
  if (!content.trim()) {
    return '';
  }

  return `
    <div style="margin:0 0 18px;padding:14px 16px;border-radius:14px;background:#f8f1f0;border:1px solid ${brand.border};color:${brand.text};font-size:15px;line-height:1.65;">
      ${escapeHtml(content)}
    </div>
  `;
}

function loanEnglish() {
  return `
    <section>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Dear ${demo.customerName},</p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">This is a friendly reminder that your Bunna Bank loan payment is due soon. Please review the details below and settle the amount before the due date.</p>
      <div style="margin:0 0 20px;padding:18px;border:1px solid ${brand.border};border-radius:16px;background:${brand.surface};">
        <div style="margin-bottom:10px;font-size:15px;"><strong>Payment Amount:</strong> ${demo.paymentAmount}</div>
        <div style="font-size:15px;"><strong>Due Date:</strong> ${demo.dueDate}</div>
      </div>
      <p style="margin:0;font-size:15px;line-height:1.7;">Thank you,<br />Customer Service and Relationship Team<br />${brand.name}</p>
    </section>
  `;
}

function loanAmharic() {
  return `
    <section>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.8;">ሰላም ${demo.customerName},</p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.8;">የቡና ባንክ የብድር ክፍያዎ በቅርቡ የሚደርስ መሆኑን ለማስታወስ ነው። ከታች ያሉትን ዝርዝሮች ይመልከቱ እና በቀነ ገደቡ በፊት ክፍያውን ያጠናቁ።</p>
      <div style="margin:0 0 20px;padding:18px;border:1px solid ${brand.border};border-radius:16px;background:${brand.surface};">
        <div style="margin-bottom:10px;font-size:15px;"><strong>የክፍያ መጠን:</strong> ${demo.paymentAmount}</div>
        <div style="font-size:15px;"><strong>የክፍያ ቀን:</strong> ${demo.dueDate}</div>
      </div>
      <p style="margin:0;font-size:15px;line-height:1.8;">እናመሰግናለን፣<br />የአገልግሎት እና ግንኙነት ቡድን<br />ቡና ባንክ</p>
    </section>
  `;
}

function insuranceEnglish() {
  return `
    <section>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Dear ${demo.customerName},</p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">Your Bunna insurance renewal deadline is approaching. Please review the policy details below and submit the required renewal document on time.</p>
      <div style="margin:0 0 20px;padding:18px;border:1px solid ${brand.border};border-radius:16px;background:${brand.surface};">
        <div style="margin-bottom:10px;font-size:15px;"><strong>Provider:</strong> ${demo.provider}</div>
        <div style="margin-bottom:10px;font-size:15px;"><strong>Policy Number:</strong> ${demo.policyNumber}</div>
        <div style="font-size:15px;"><strong>Renewal Due Date:</strong> ${demo.renewalDate}</div>
      </div>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">If you have multiple policies, include <strong>policy:${demo.policyNumber}</strong> in the caption or subject when uploading.</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">Please upload a clear photo or PDF of your renewal paper, or reply directly to this email with the document attached.</p>
      <p style="margin:0;font-size:15px;line-height:1.7;">Thank you,<br />Customer Service and Relationship Team<br />${brand.name}</p>
    </section>
  `;
}

function insuranceAmharic() {
  return `
    <section>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.8;">ክቡር/ክብርት ${demo.customerName},</p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.8;">የኢንሹራንስ ማደሻዎ ቀነ ገደብ በቅርቡ ይደርሳል። ከታች ያሉትን የፖሊሲ ዝርዝሮች ይመልከቱ እና የማደሻ ሰነዱን በጊዜው ይላኩ።</p>
      <div style="margin:0 0 20px;padding:18px;border:1px solid ${brand.border};border-radius:16px;background:${brand.surface};">
        <div style="margin-bottom:10px;font-size:15px;"><strong>አቅራቢ:</strong> ${demo.provider}</div>
        <div style="margin-bottom:10px;font-size:15px;"><strong>ፖሊሲ ቁጥር:</strong> ${demo.policyNumber}</div>
        <div style="font-size:15px;"><strong>የማደሻ ቀን:</strong> ${demo.renewalDate}</div>
      </div>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.8;">ብዙ ፖሊሲ ካሉ በርዕስ ወይም በመግለጫ ውስጥ <strong>policy:${demo.policyNumber}</strong> ያካትቱ።</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.8;">እባክዎ የማደሻ ሰነዱን ግልፅ ፎቶ ወይም PDF ይላኩ ወይም ለዚህ ኢሜይል በአባሪ ፋይል ይመልሱ።</p>
      <p style="margin:0;font-size:15px;line-height:1.8;">እናመሰግናለን፣<br />የአገልግሎት እና ግንኙነት ቡድን<br />ቡና ባንክ</p>
    </section>
  `;
}

export function renderReminderEmailPreview(input: {
  category: 'loan' | 'insurance';
  subject: string;
  messageBody: string;
}) {
  const title =
    input.subject ||
    (input.category === 'loan'
      ? 'Bunna Bank Loan Due Soon Reminder'
      : 'Bunna Insurance Renewal Reminder');
  const englishBody =
    input.category === 'loan' ? loanEnglish() : insuranceEnglish();
  const amharicBody =
    input.category === 'loan' ? loanAmharic() : insuranceAmharic();

  return `
    <div style="background:${brand.page};padding:18px;border-radius:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid ${brand.border};border-radius:20px;overflow:hidden;box-shadow:0 14px 34px rgba(16,66,42,0.08);">
        <div style="padding:28px 28px 24px;background:linear-gradient(135deg,#7f1016,#611015);color:#ffffff;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:middle;padding-right:16px;">
                <img src="${brand.logoPath}" alt="Bunna Bank" width="56" height="56" style="display:block;border:0;outline:none;text-decoration:none;width:56px;height:56px;object-fit:contain;background:#ffffff;border-radius:12px;padding:6px;" />
              </td>
              <td style="vertical-align:middle;">
                <div style="color:#f3d9c7;font-size:14px;font-weight:700;letter-spacing:1px;">BUNNA BANK</div>
                <h3 style="margin:6px 0 0;font-size:24px;line-height:1.2;color:#ffffff;">${escapeHtml(title)}</h3>
              </td>
            </tr>
          </table>
        </div>
        <div style="padding:28px;color:${brand.text};">
          ${infoNote(input.messageBody)}
          ${englishBody}
          <hr style="border:none;border-top:1px solid ${brand.border};margin:28px 0;" />
          ${input.messageBody.trim() ? infoNote(`ማስታወሻ: ${input.messageBody}`) : ''}
          ${amharicBody}
        </div>
      </div>
    </div>
  `;
}
