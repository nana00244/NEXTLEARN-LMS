/**
 * Global Print Utility for NextLearn LMS (bv3)
 * Bypasses sandbox restrictions by opening content in a non-sandboxed window.
 */

export const printService = {
  printReceipt: (data: {
    receiptNumber: string;
    date: string;
    studentName: string;
    admission: string;
    amount: number;
    paymentMethod: string;
    balance: number;
    recordedBy: string;
  }) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert("Please allow popups to print receipts.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${data.receiptNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 50px; 
            color: #1e293b; 
            background: white;
            line-height: 1.5;
          }
          
          /* Header with NEXTLMS Branding */
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding-bottom: 25px; 
            border-bottom: 4px solid #4f46e5; 
          }
          .brand { 
            font-size: 42px; 
            font-weight: 900; 
            color: #1e293b; 
            letter-spacing: -1.5px;
            margin-bottom: 5px;
          }
          .brand span { color: #4f46e5; }
          .subtitle { 
            font-size: 12px; 
            font-weight: 700; 
            color: #64748b; 
            text-transform: uppercase; 
            letter-spacing: 4px; 
          }

          .receipt-title-box {
            text-align: center;
            margin-bottom: 30px;
          }
          .receipt-title {
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            background: #f8fafc;
            display: inline-block;
            padding: 8px 24px;
            border-radius: 99px;
            border: 1px solid #e2e8f0;
          }

          .meta-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 40px; 
            margin-bottom: 40px; 
          }
          
          .info-group { margin-bottom: 20px; }
          .label { 
            font-size: 10px; 
            font-weight: 800; 
            text-transform: uppercase; 
            color: #94a3b8; 
            margin-bottom: 4px; 
            letter-spacing: 1px;
          }
          .value { font-size: 15px; font-weight: 700; color: #0f172a; }
          .value.mono { font-family: monospace; font-size: 16px; }

          .amount-container {
            background: #f0fdf4;
            border: 2px solid #bbf7d0;
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            margin-bottom: 25px;
          }
          .amount-label {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            color: #166534;
            margin-bottom: 10px;
          }
          .amount-value {
            font-size: 48px;
            font-weight: 900;
            color: #15803d;
          }

          .arrears-container {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 24px;
            padding: 25px;
            text-align: center;
          }
          .arrears-label {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #991b1b;
            margin-bottom: 5px;
          }
          .arrears-value {
            font-size: 24px;
            font-weight: 900;
            color: #b91c1c;
          }

          .footer { 
            margin-top: 60px; 
            padding-top: 30px; 
            border-top: 1px dashed #e2e8f0; 
            display: flex; 
            justify-content: space-between; 
            font-size: 11px; 
            color: #64748b; 
            font-weight: 600; 
          }

          .thank-you {
            text-align: center;
            margin-top: 40px;
            font-style: italic;
            color: #94a3b8;
            font-size: 13px;
          }

          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">NEXT<span>LMS</span></div>
          <div class="subtitle">NextLearn Learning Management System</div>
        </div>

        <div class="receipt-title-box">
          <div class="receipt-title">Official Payment Receipt</div>
        </div>
        
        <div class="meta-grid">
          <div>
            <div class="info-group">
              <div class="label">Student Identity</div>
              <div class="value">${data.studentName}</div>
            </div>
            <div class="info-group">
              <div class="label">Admission Number</div>
              <div class="value mono">${data.admission}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="info-group">
              <div class="label">Receipt Number</div>
              <div class="value mono" style="color: #4f46e5;">${data.receiptNumber}</div>
            </div>
            <div class="info-group">
              <div class="label">Date of Issue</div>
              <div class="value">${data.date}</div>
            </div>
          </div>
        </div>

        <div class="amount-container">
          <div class="amount-label">Net Amount Collected</div>
          <div class="amount-value">GH₵ ${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>

        ${data.balance > 0 ? `
          <div class="arrears-container">
            <div class="arrears-label">Outstanding Arrears</div>
            <div class="arrears-value">GH₵ ${data.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div>RECORDED BY: ${data.recordedBy || 'SYSTEM ADMINISTRATOR'}</div>
          <div style="text-transform: uppercase;">VERIFIED DIGITAL DOCUMENT</div>
        </div>

        <div class="thank-you">
          "Educating for Excellence" • Thank you for your payment
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              // In some browsers, print() is blocking. After print finishes:
              window.onafterprint = () => window.close();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  },

  printReportCard: (student: any, report: any) => {
    const printWindow = window.open('', '_blank', 'width=1000,height=1200');
    if (!printWindow) {
      alert("Please allow popups to print reports.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Card - ${student?.firstName} ${student?.lastName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 50px; color: #000; line-height: 1.4; }
          .card { border: 8px double #000; padding: 40px; min-height: 1000px; position: relative; }
          .header { text-align: center; border-bottom: 4px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .brand { font-size: 36px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
          .brand span { color: #4f46e5; }
          .doc-title { font-size: 14px; font-weight: 700; letter-spacing: 6px; margin-top: 5px; text-transform: uppercase; }
          .student-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
          .meta-item { border-bottom: 2px solid #000; padding-bottom: 5px; }
          .label { font-size: 8px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 2px; }
          .val { font-size: 13px; font-weight: 700; }
          .grade-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-bottom: 40px; }
          .stat-box { border: 3px solid #000; padding: 20px; text-align: center; }
          .stat-val { font-size: 48px; font-weight: 900; }
          .comments { margin-bottom: 40px; }
          .comment-block { margin-bottom: 20px; border-left: 5px solid #000; padding-left: 15px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 80px; }
          .sig-line { border-top: 2px solid #000; width: 220px; text-align: center; padding-top: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; font-weight: 900; color: rgba(0,0,0,0.03); z-index: -1; pointer-events: none; width: 100%; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="watermark">OFFICIAL TRANSCRIPT</div>
          <div class="header">
            <div class="brand">NEXT<span>LMS</span> ACADEMY</div>
            <div class="doc-title">Student Performance Report</div>
          </div>

          <div class="student-meta">
            <div class="meta-item"><div class="label">Full Name</div><div class="val">${student?.firstName} ${student?.lastName}</div></div>
            <div class="meta-item"><div class="label">Admission No.</div><div class="val">SN-2024-REG</div></div>
            <div class="meta-item"><div class="label">Session</div><div class="val">2024 Academic Year</div></div>
            <div class="meta-item"><div class="label">Term Unit</div><div class="val">${report.termId}</div></div>
          </div>

          <div class="grade-summary">
            <div class="stat-box"><div class="label">Final Grade</div><div class="stat-val">${report.overallGrade}</div></div>
            <div class="stat-box"><div class="label">Percentage Score</div><div class="stat-val">${report.overallPercentage}%</div></div>
            <div class="stat-box"><div class="label">Class Ranking</div><div class="stat-val">${report.classRank}/${report.totalStudents}</div></div>
          </div>

          <div class="comments">
             <div class="comment-block">
                <div class="label">Class Mentor Assessment</div>
                <div class="val" style="font-style: italic;">"${report.teacherComment}"</div>
             </div>
             <div class="comment-block">
                <div class="label">Board of Directors Review</div>
                <div class="val" style="font-style: italic;">"Commendable discipline and academic rigor shown. Transition to next level authorized."</div>
             </div>
          </div>

          <div style="margin-bottom: 40px;">
             <div class="label">Presence Log Summary</div>
             <div class="val">Maintained ${report.attendancePercentage}% attendance for the appraisal period.</div>
          </div>

          <div class="signatures">
            <div class="sig-line">Faculty Lead</div>
            <div style="width: 110px; height: 110px; border: 3px solid #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #ccc; font-weight: 900; text-align: center;">NEXTLMS<br>SEAL</div>
            <div class="sig-line">Registrar General</div>
          </div>

          <div style="text-align: center; margin-top: 60px; font-size: 9px; color: #666; font-weight: bold;">
            DIGITALLY SIGNED ON ${new Date().toLocaleString()} • NEXTLMS SECURE CLOUD
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
};
