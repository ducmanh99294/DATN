import * as XLSX from "xlsx";

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
