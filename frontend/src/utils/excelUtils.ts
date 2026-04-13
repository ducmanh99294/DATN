import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function exportToExcelWithDropdown(
  data: Record<string, unknown>[] | unknown[][],
  filename: string,
  sheetName = "Sheet1",
  dropdown?: {
    columnKey: string;
    values: string[];
  }
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  // ===== Convert data giống xlsx =====
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && !Array.isArray(data[0])) {
    const keys = Object.keys(data[0] as Record<string, unknown>);

    sheet.columns = keys.map((key) => ({
      header: key,
      key,
      width: 25,
    }));

    (data as Record<string, unknown>[]).forEach((row) => {
      sheet.addRow(row);
    });

    // ===== Thêm dropdown =====
    if (dropdown) {
      const colIndex = keys.findIndex(k => k === dropdown.columnKey);
      if (colIndex !== -1) {
        const colLetter = sheet.getColumn(colIndex + 1).letter;

        // tạo sheet ẩn
        const hiddenSheet = workbook.addWorksheet("dropdown_data");

        dropdown.values.forEach((val, i) => {
          hiddenSheet.getCell(`A${i + 1}`).value = val;
        });

        hiddenSheet.state = "hidden";

        // apply dropdown
        for (let i = 2; i <= 500; i++) {
          sheet.getCell(`${colLetter}${i}`).dataValidation = {
            type: "list",
            allowBlank: false,
            formulae: [`dropdown_data!$A$1:$A$${dropdown.values.length}`],
            showErrorMessage: true,
            error: "Chỉ được chọn từ danh sách",
          };
        }
      }
    }

  } else {
    // array 2 chiều
    (data as unknown[][]).forEach(row => {
      sheet.addRow(row);
    });
  }

  // style nhẹ
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${filename}.xlsx`);
}

/** Xuất mảng đối tượng hoặc mảng 2 chiều ra file Excel */
export function exportToExcel(
  data: Record<string, unknown>[] | unknown[][],
  filename: string,
  sheetName = "Sheet1"
): void {
  const ws = Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && !Array.isArray(data[0])
    ? XLSX.utils.json_to_sheet(data as Record<string, unknown>[])
    : XLSX.utils.aoa_to_sheet((data as unknown[][]) || [[]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** Đọc file Excel (file đầu tiên, sheet đầu tiên) trả về mảng object (hàng đầu = header) */
export function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        console.log(data)
        if (!data) {
          reject(new Error("Không đọc được file"));
          return;
        }
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
        resolve(rows || []);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file"));
    reader.readAsArrayBuffer(file);
  });
}

/** Đọc file Excel trả về mảng 2 chiều (raw) */
export function parseExcelFileRaw(file: File): Promise<unknown[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("Không đọc được file"));
          return;
        }
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: "" });
        resolve((rows || []) as unknown[][]);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file"));
    reader.readAsArrayBuffer(file);
  });
}
