import * as XLSX from "xlsx";
import type { Trainer } from "./trainers-store";

export function exportTrainersToExcel(trainers: Trainer[]) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Trainers overview
  const overview = trainers.map((t) => ({
    "ID": t.id,
    "Full Name": t.fullName,
    "Position": t.position,
    "Status": t.status,
    "Email": t.email,
    "Phone": t.phone,
    "Address": t.address,
    "Qualification": t.academic.qualification,
    "University": t.academic.university,
    "Major": t.academic.major,
    "English Test": t.english.test,
    "CEFR": t.english.cefr,
    "English Score": t.english.score,
    "Test Date": t.english.testDate,
    "Performance Score": t.performance.score,
    "Performance Date": t.performance.date,
    "Performance Comments": t.performance.comments,
    "Contract Start": t.contract.startDate,
    "Contract End": t.contract.endDate,
    "Leave Entitlement": t.leave.entitlement,
    "Leave Taken": t.leave.taken,
    "Leave Remaining": t.leave.entitlement - t.leave.taken,
    "Current Leave From": t.leave.currentLeave?.from ?? "",
    "Current Leave To": t.leave.currentLeave?.to ?? "",
    "Notes": t.notes,
  }));
  const ws1 = XLSX.utils.json_to_sheet(overview);
  ws1["!cols"] = Object.keys(overview[0] ?? { a: "" }).map((k) => ({
    wch: Math.min(Math.max(k.length + 2, 14), 40),
  }));
  XLSX.utils.book_append_sheet(wb, ws1, "Trainers");

  // Sheet 2: Calendar / date availability notes
  const agendaRows: Record<string, string>[] = [];
  for (const t of trainers) {
    const entries = Object.entries(t.dateAvailability ?? {})
      .filter(([, v]) => v && v.trim().length > 0)
      .sort(([a], [b]) => a.localeCompare(b));
    for (const [date, note] of entries) {
      agendaRows.push({
        "Trainer": t.fullName,
        "Position": t.position,
        "Date": date,
        "Note": note,
      });
    }
  }
  if (agendaRows.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(agendaRows);
    ws2["!cols"] = [{ wch: 24 }, { wch: 20 }, { wch: 12 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Calendar Notes");
  }

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `trainers-${stamp}.xlsx`);
}
