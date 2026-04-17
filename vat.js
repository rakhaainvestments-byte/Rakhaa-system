// vat.js - منطق حاسبة ضريبة القيمة المضافة
const VATCalculator = {
    totalInput: 0,
    totalOutput: 0,
    openingValue: 0,
    paymentsValue: 0,
    currentExcelFile: null,
    currentWorkbook: null,

    init: function() {
        this.attachEvents();
    },

    attachEvents: function() {
        const self = this;

        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) self.handleFileUpload(file);
        });

        const dropZone = document.getElementById('dropZone');
        dropZone.addEventListener('dragover', (e) => e.preventDefault());
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.name.match(/\.(xlsx|xls)$/i)) {
                self.handleFileUpload(file);
            } else {
                alert('يرجى رفع ملف Excel فقط');
            }
        });

        document.getElementById('recalculateBtn').addEventListener('click', () => {
            this.recalculateVAT();
        });

        document.getElementById('saveExcelBtn').addEventListener('click', () => this.saveCurrentExcel());
        document.getElementById('downloadExcelBtn').addEventListener('click', () => this.downloadCurrentExcel());
    },

    handleFileUpload: function(file) {
        this.currentExcelFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            this.currentWorkbook = XLSX.read(data, { type: 'array' });
            this.processExcelFile(this.currentWorkbook, file.name);
        };
        reader.readAsArrayBuffer(file);
    },

    processExcelFile: function(workbook, fileName) {
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        this.totalInput = 0;
        this.totalOutput = 0;

        document.querySelector('.upload-text').textContent = `تم رفع: ${fileName}`;
        document.querySelector('.upload-icon').textContent = '✅';
        document.querySelector('.upload-note').textContent = `${rows.length} سجل`;

        rows.forEach((row, index) => {
            const payments = this.findValue(row, ['المسدد خلال العام', 'Payments', 'مدفوعات']);
            const vatPercent = this.findValue(row, ['ضريبة القيمة المضافة (%)', 'VAT Percentage']);
            const vatValue = this.findValue(row, ['ضريبة القيمة المضافة (قيمة)', 'VAT Value', 'قيمة الضريبة']);
            const transactionValue = this.findValue(row, ['قيمة التعامل قبل ضريبة القيمة المضافة', 'Transaction Value']);
            const invoiceStatus = this.findValue(row, ['حالة الفاتورة', 'Invoice Status']);
            const invoiceDirection = this.findValue(row, ['اتجاه الفاتورة', 'Invoice Direction']);

            const vatNum = parseFloat(vatValue) || 0;
            if (invoiceDirection && invoiceDirection.toString().includes('مستلم')) {
                this.totalInput += vatNum;
            } else if (invoiceDirection && invoiceDirection.toString().includes('صادر')) {
                this.totalOutput += vatNum;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${payments ? parseFloat(payments).toFixed(2) : '0.00'}</td>
                <td>${vatPercent ? parseFloat(vatPercent).toFixed(2) + '%' : '0%'}</td>
                <td>${vatNum.toFixed(2)}</td>
                <td>${transactionValue ? parseFloat(transactionValue).toFixed(2) : '0.00'}</td>
                <td>${invoiceStatus || 'غير محدد'}</td>
                <td>${invoiceDirection || 'غير محدد'}</td>
            `;
            tbody.appendChild(tr);
        });

        this.updateValues();
        this.detectValues(rows);
        this.recalculateVAT();
    },

    findValue: function(row, possibleNames) {
        for (const name of possibleNames) {
            if (row[name] !== undefined) return row[name];
        }
        return null;
    },

    updateValues: function() {
        document.getElementById('totalInput').innerText = this.totalInput.toFixed(2);
        document.getElementById('totalOutput').innerText = this.totalOutput.toFixed(2);
        document.getElementById('netVAT').innerText = (this.totalOutput - this.totalInput).toFixed(2);
    },

    detectValues: function(rows) {
        if (rows.length > 0) {
            const firstRow = rows[0];
            Object.keys(firstRow).forEach(col => {
                if (col.includes('رصيد') && col.includes('المدة')) {
                    this.openingValue = parseFloat(firstRow[col]) || 0;
                    document.getElementById('manualOpening').value = this.openingValue;
                }
                if (col.includes('سداد') || col.includes('سدادات')) {
                    this.paymentsValue = parseFloat(firstRow[col]) || 0;
                    document.getElementById('manualPayments').value = this.paymentsValue;
                }
            });
        }
    },

    recalculateVAT: function() {
        const manualOpening = parseFloat(document.getElementById('manualOpening').value);
        if (!isNaN(manualOpening)) this.openingValue = manualOpening;

        const manualPayments = parseFloat(document.getElementById('manualPayments').value);
        if (!isNaN(manualPayments)) this.paymentsValue = manualPayments;

        const finalVAT = this.openingValue - this.totalInput + this.totalOutput - this.paymentsValue;
        // إنشاء عنصر للرصيد النهائي إذا لم يكن موجوداً
        let closingEl = document.getElementById('closingBalance');
        if (!closingEl) {
            const summaryDiv = document.querySelector('.summary-cards');
            const newCard = document.createElement('div');
            newCard.className = 'card';
            newCard.innerHTML = `
                <div class="card-header">
                    <span class="card-icon">💰</span>
                    <h3>الرصيد النهائي</h3>
                </div>
                <div class="card-value" id="closingBalance">0.00</div>
                <div class="card-label">ريال سعودي</div>
            `;
            summaryDiv.appendChild(newCard);
            closingEl = document.getElementById('closingBalance');
        }
        closingEl.innerText = finalVAT.toFixed(2);
    },

    saveCurrentExcel: function() {
        if (!this.currentExcelFile) {
            alert('لا يوجد ملف مرفوع للحفظ');
            return;
        }
        const fileName = prompt('أدخل اسماً للملف:', this.currentExcelFile.name.replace(/\.[^/.]+$/, ''));
        if (!fileName) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result.split(',')[1];
            const user = Auth.getCurrentUser();
            const fileRecord = {
                id: Date.now().toString(),
                name: fileName + '.xlsx',
                ownerId: user.id,
                ownerEmail: user.email,
                type: 'private',
                uploadedAt: new Date().toISOString(),
                data: base64Data
            };
            const privateFiles = Storage.get(`privateFiles_${user.id}`) || [];
            privateFiles.push(fileRecord);
            Storage.set(`privateFiles_${user.id}`, privateFiles);
            alert('تم حفظ الملف بنجاح في ملفاتك الخاصة');
        };
        reader.readAsDataURL(this.currentExcelFile);
    },

    downloadCurrentExcel: function() {
        if (!this.currentWorkbook) {
            alert('لا توجد بيانات للتنزيل');
            return;
        }
        const fileName = prompt('اسم الملف للتنزيل:', 'تقرير_الضريبة.xlsx');
        if (!fileName) return;
        XLSX.writeFile(this.currentWorkbook, fileName);
    }
};
