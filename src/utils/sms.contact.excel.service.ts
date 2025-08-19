import * as XLSX from 'xlsx';

export interface ParsedContactRow {
	name?: string | null;
	phone: string;
}

export class SmsContactExcelService {
	// Parse xlsx/xls/csv buffer and return rows with at least a phone present
	static parseContacts(buffer: Buffer): ParsedContactRow[] {
		if (!buffer || !buffer.length) return [];

		const workbook = XLSX.read(buffer, { type: 'buffer' });
		const sheetName = workbook.SheetNames[0];
		if (!sheetName) return [];

		const sheet = workbook.Sheets[sheetName];
		// Convert to JSON preserving headers
		const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
			defval: '',
			raw: false,
		});

		const out: ParsedContactRow[] = [];
		for (const r of rows) {
			// Support case-insensitive headers and trim values
			const lowered: Record<string, any> = {};
			for (const k of Object.keys(r)) lowered[k.toLowerCase().trim()] = r[k];

			const nameRaw = lowered['name'] ?? lowered['ism'] ?? lowered['fio'];
			const phoneRaw = lowered['phone'] ?? lowered['telefon'] ?? lowered['tel'] ?? lowered['raqam'];

			const name = (nameRaw ?? '').toString().trim();
			const phone = (phoneRaw ?? '').toString().trim();

			if (!phone) continue; // skip rows without phone

			out.push({ name: name || null, phone });
		}
		return out;
	}
}
