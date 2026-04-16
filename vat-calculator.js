// ===== حاسبة ضريبة القيمة المضافة =====

let totalInput = 0;
let totalOutput = 0;
let openingValue = 0;
let paymentsValue = 0;
let currentExcelFile = null;
let currentWorkbook = null;

// تهيئة الحاسبة
document.addEventListener('DOMContentLoaded', function() {
    initializeCalculator();
});

function initializeCalculator() {
    // إعداد رفع الملفات
    setupFileUpload();
    
    // تحميل الملفات المحفوظة
    loadSavedFiles();
    
    // إعادة حساب الضريبة
    recalculateVAT();
}

// إعداد رفع ملف Excel
function setupFileUpload() {
    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            currentExcelFile = file;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const data = new Uint8Array(event.target.result);
                currentWorkbook = XLSX.read(data, { type: 'array' });
                processExcelFile(currentWorkbook, file.name);
            };
            
            reader.readAsArrayBuffer(file);
        });
        
        // دعم السحب والإفلات
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary)';
            uploadArea.style.background = 'rgba(15, 118, 110, 0.05)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--primary-light)';
            uploadArea.style.background = 'var(--light)';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary-light)';
            uploadArea.style.background = 'var(--light)';
            
            const file = e.dataTransfer.files[0];
            if (file && file.name.match(/\.(xlsx|xls)$/i)) {
                fileInput.files = e.dataTransfer.files;
                fileInput.dispatchEvent(new Event('change'));
            } else {
                showAlert('يرجى رفع ملف Excel فقط', 'warning');
            }
        });
    }
}

// معالجة ملف Excel
function processExcelFile(workbook, fileName) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    totalInput = 0;
    totalOutput = 0;
    
    // تحديث واجهة الرفع
    document.querySelector('.upload-text').textContent = `تم رفع: ${fileName}`;
    document.querySelector('.upload-icon').innerHTML = '<i class="fas fa-check-circle"></i>';
    document.querySelector('.upload-note').textContent = `${rows.length} سجل`;
    
    rows.forEach((row, index) => {
        const payments = findValue(row, ['المسدد خلال العام', 'Payments', 'مدفوعات']);
        const vatPercent = findValue(row, ['ضريبة القيمة المضافة (%)', 'VAT Percentage', 'نسبة الضريبة']);
        const vatValue = findValue(row, ['ضريبة القيمة المضافة (قيمة)', 'VAT Value', 'قيمة الضريبة']);
        const transactionValue = findValue(row, ['قيمة التعامل قبل ضريبة القيمة المضافة', 'Transaction Value', 'قيمة التعامل']);
        const invoiceStatus = findValue(row, ['حالة الفاتورة', 'Invoice Status', 'الحالة']);
        const invoiceDirection = findValue(row, ['اتجاه الفاتورة', 'Invoice Direction', 'الاتجاه']);
        
        const vatNum = parseFloat(vatValue) || 0;
        
        if (invoiceDirection && invoiceDirection.toString().includes('مستلم')) {
            totalInput += vatNum;
        } else if (invoiceDirection && invoiceDirection.toString().includes('صادر')) {
            totalOutput += vatNum;
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
    
    updateValues();
    detectValues(rows);
    recalculateVAT();
}

// البحث عن قيمة في الصف
function findValue(row, possibleNames) {
    for (const name of possibleNames) {
        if (row[name] !== undefined) {
            return row[name];
        }
    }
    return null;
}

// تحديث القيم
function updateValues() {
    document.getElementById('totalInput').innerText = totalInput.toFixed(2);
    document.getElementById('totalOutput').innerText = totalOutput.toFixed(2);
    document.getElementById('netVAT').innerText = (totalOutput - totalInput).toFixed(2);
}

// اكتشاف القيم
function detectValues(rows) {
    if (rows.length > 0) {
        let openingCol = null;
        let paymentCol = null;
        
        Object.keys(rows[0]).forEach(col => {
            if (col.includes('رصيد') && col.includes('المدة')) openingCol = col;
            if (col.includes('سداد') || col.includes('سدادات') || col.includes('دفع')) paymentCol = col;
        });
        
        if (openingCol) {
            openingValue = parseFloat(rows[0][openingCol]) || 0;
            document.getElementById('manualOpening').value = openingValue;
        }
        
        if (paymentCol) {
            paymentsValue = parseFloat(rows[0][paymentCol]) || 0;
            document.getElementById('manualPayments').value = paymentsValue;
        }
    }
}

// إعادة حساب الضريبة
function recalculateVAT() {
    const manualOpening = parseFloat(document.getElementById('manualOpening')?.value);
    if (!isNaN(manualOpening)) openingValue = manualOpening;
    
    const manualPayments = parseFloat(document.getElementById('manualPayments')?.value);
    if (!isNaN(manualPayments)) paymentsValue = manualPayments;
    
    const afterInput = openingValue - totalInput;
    const afterOutput = afterInput + totalOutput;
    const finalVAT = afterOutput - paymentsValue;
    
    document.getElementById('openingBalance').innerText = openingValue.toFixed(2);
    document.getElementById('inputBalance').innerText = totalInput.toFixed(2);
    document.getElementById('outputBalance').innerText = totalOutput.toFixed(2);
    document.getElementById('paymentsBalance').innerText = paymentsValue.toFixed(2);
    document.getElementById('closingBalance').innerText = finalVAT.toFixed(2);
    
    const closingElement = document.getElementById('closingBalance');
    if (finalVAT > 0) {
        closingElement.style.color = 'var(--danger)';
    } else if (finalVAT < 0) {
        closingElement.style.color = 'var(--success)';
    } else {
        closingElement.style.color = 'var(--primary)';
    }
}

// تحميل الملفات المحفوظة
function loadSavedFiles() {
    const saved = localStorage.getItem('vatExcelFiles');
    const files = saved ? JSON.parse(saved) : [];
    
    const container = document.getElementById('savedFiles');
    
    if (files.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--gray);">
                <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>لا توجد ملفات محفوظة</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    files.forEach((file, index) => {
        const date = new Date(file.date);
        const dateStr = date.toLocaleDateString('ar-SA');
        
        html += `
            <div class="file-item">
                <div class="file-info">
                    <h4>${file.name}</h4>
                    <p>${dateStr}</p>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn load" onclick="loadSavedExcel(${index})">
                        <i class="fas fa-folder-open"></i> تحميل
                    </button>
                    <button class="file-action-btn delete" onclick="deleteSavedExcel(${index})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// حفظ ملف Excel الحالي
function saveCurrentExcel() {
    if (!currentExcelFile) {
        showAlert('لا يوجد ملف Excel مرفوع!', 'warning');
        return;
    }
    
    const fileName = prompt('أدخل اسم للملف:', currentExcelFile.name.replace(/\.[^/.]+$/, ''));
    if (!fileName) return;
    
    const saved = localStorage.getItem('vatExcelFiles');
    const files = saved ? JSON.parse(saved) : [];
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const fileData = {
            id: Date.now(),
            name: fileName + '.xlsx',
            date: new Date().toISOString(),
            data: event.target.result.split(',')[1]
        };
        
        files.push(fileData);
        localStorage.setItem('vatExcelFiles', JSON.stringify(files));
        
        loadSavedFiles();
        showAlert('تم حفظ الملف بنجاح!', 'success');
    };
    
    reader.readAsDataURL(currentExcelFile);
}

// تحميل ملف Excel محفوظ
function loadSavedExcel(index) {
    const saved = localStorage.getItem('vatExcelFiles');
    const files = saved ? JSON.parse(saved) : [];
    
    if (!files[index]) {
        showAlert('الملف غير موجود!', 'error');
        return;
    }
    
    const file = files[index];
    
    const byteString = atob(file.data);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const loadedFile = new File([blob], file.name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    currentExcelFile = loadedFile;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        currentWorkbook = XLSX.read(data, { type: 'array' });
        processExcelFile(currentWorkbook, file.name);
        
        showAlert(`تم تحميل الملف "${file.name}" بنجاح!`, 'success');
    };
    
    reader.readAsArrayBuffer(loadedFile);
}

// حذف ملف Excel محفوظ
function deleteSavedExcel(index) {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) {
        return;
    }
    
    const saved = localStorage.getItem('vatExcelFiles');
    const files = saved ? JSON.parse(saved) : [];
    
    files.splice(index, 1);
    localStorage.setItem('vatExcelFiles', JSON.stringify(files));
    
    loadSavedFiles();
    showAlert('تم حذف الملف بنجاح!', 'success');
}

// تنزيل ملف Excel الحالي
function downloadCurrentExcel() {
    if (!currentWorkbook) {
        showAlert('لا توجد بيانات لتنزيلها!', 'warning');
        return;
    }
    
    const wb = currentWorkbook;
    
    const summaryData = [
        ['TAX PRO - ملخص حسابات ضريبة القيمة المضافة'],
        [],
        ['إجمالي الضريبة الواردة (مستلم)', totalInput],
        ['إجمالي الضريبة الصادرة', totalOutput],
        ['صافي ضريبة القيمة المضافة', totalOutput - totalInput],
        [],
        ['رصيد أول المدة', openingValue],
        ['سدادات خلال الفترة', paymentsValue],
        ['الرصيد النهائي', (openingValue - totalInput + totalOutput - paymentsValue)],
        [],
        ['تم إنشاء هذا الملف بواسطة TAX PRO'],
        ['تاريخ الإنشاء', new Date().toLocaleDateString('ar-SA')]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'ملخص الضريبة');
    
    const fileName = prompt('أدخل اسم الملف للتنزيل:', 'TAX_PRO_' + new Date().toISOString().split('T')[0]);
    if (!fileName) return;
    
    XLSX.writeFile(wb, fileName + '.xlsx');
    showAlert('تم تنزيل ملف Excel بنجاح!', 'success');
}

// مسح جميع الملفات
function clearAllFiles() {
    if (!confirm('هل أنت متأكد من مسح جميع الملفات المحفوظة؟')) {
        return;
    }
    
    localStorage.removeItem('vatExcelFiles');
    loadSavedFiles();
    showAlert('تم مسح جميع الملفات المحفوظة', 'success');
}
