import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { ExcelEntity } from '../entity/excel.entity';
import { UserEntity } from '../entity/user.entity';
import { ContactEntity } from '../entity/contact.entity';
import { MODELS } from '../constants/constants';

@Injectable()
export class ExcelService {
  constructor(
    @Inject(MODELS.EXCEL)
    private excelRepository: Repository<ExcelEntity>,
    @Inject(MODELS.CONTACT)
    private contactRepository: Repository<ContactEntity>,
    @Inject(MODELS.USER)
    private userRepository: Repository<UserEntity>,
  ) {}

  async processExcel(filePath: string, userId: number): Promise<ExcelEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const excel = this.excelRepository.create({
      user,
      filePath,
      status: 'processing',
    });
    await this.excelRepository.save(excel);

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    excel.totalRows = data.length;
    await this.excelRepository.save(excel);

    for (const row of data) {
      excel.processedRows++;
      // Simple validation, assuming 'phone' and 'name' columns
      if (!row['phone'] || !row['name']) {
        excel.invalidFormatRows++;
        continue;
      }

      const existingContact = await this.contactRepository.findOne({
        where: { identity_code: row['phone'], user: { id: userId } },
      });

      if (existingContact) {
        excel.duplicateRows++;
        continue;
      }

      const newContact = this.contactRepository.create({
        identity_code: row['phone'],
        commonData: {
          first_name: row['name'],
          middle_name: '',
          last_name: '',
          birth_date: '',
          gender: '',
          pinfl: '',
          inn: '',
          citizenship: '',
          nationality: '',
          birth_country: '',
        },
        user,
      });
      await this.contactRepository.save(newContact);
      excel.createdRows++;
    }

    excel.status = 'completed';
    return this.excelRepository.save(excel);
  }
}
