import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { ExcelEntity } from '../entity/excel.entity';
import { UserEntity } from '../entity/user.entity';
import { ContactEntity } from '../entity/contact.entity';
import { MODELS } from '../constants/constants';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import { PaginationParams } from '../utils/dto/dto';

@Injectable()
export class ExcelService {
  constructor(
    @Inject(MODELS.EXCEL)
    private readonly excelRepos: Repository<ExcelEntity>,
    @Inject(MODELS.CONTACT)
    private readonly contactRepos: Repository<ContactEntity>,
    @Inject(MODELS.USER)
    private readonly userRepos: Repository<UserEntity>,
  ) {}

  async createExcelAnalysis(data: {
    user_id: number;
    fileName: string;
    fileType: string;
    totalRows: number;
    status: string;
  }): Promise<ExcelEntity> {
    const user = await this.userRepos.findOne({
      where: { id: data.user_id },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const excel = this.excelRepos.create({
      user,
      filePath: data.fileName, // Store filename instead of file path
      status: data.status,
      totalRows: data.totalRows,
      processedRows: 0,
      duplicateRows: 0,
      invalidFormatRows: 0,
      createdRows: 0,
    });

    return await this.excelRepos.save(excel);
  }

  async updateExcelAnalysis(
    excelId: number,
    data: {
      processedRows?: number;
      duplicateRows?: number;
      invalidFormatRows?: number;
      createdRows?: number;
      status?: string;
    },
  ): Promise<ExcelEntity> {
    const excel = await this.excelRepos.findOne({
      where: { id: excelId },
    });
    if (!excel) {
      throw new Error('Excel analysis not found');
    }

    Object.assign(excel, data);
    return await this.excelRepos.save(excel);
  }

  async processExcel(filePath: string, userId: number): Promise<ExcelEntity> {
    const user = await this.userRepos.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const excel = this.excelRepos.create({
      user,
      filePath,
      status: 'processing',
    });
    await this.excelRepos.save(excel);

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    excel.totalRows = data.length;
    await this.excelRepos.save(excel);

    for (const row of data) {
      excel.processedRows++;
      // Simple validation, assuming 'phone' and 'name' columns
      if (!row['phone'] || !row['name']) {
        excel.invalidFormatRows++;
        continue;
      }

      const existingContact = await this.contactRepos.findOne({
        where: { identity_code: row['phone'], user: { id: userId } },
      });

      if (existingContact) {
        excel.duplicateRows++;
        continue;
      }

      const newContact = this.contactRepos.create({
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
      await this.contactRepos.save(newContact);
      excel.createdRows++;
    }

    excel.status = 'completed';
    return this.excelRepos.save(excel);
  }

  async findAll(
    payload: PaginationParams,
  ): Promise<PaginationResponse<ExcelEntity[]>> {
    const { page = 1, limit = 10 } = payload;
    const skip: number = (page - 1) * limit;

    try {
      const queryBuilder = this.excelRepos
        .createQueryBuilder('excels')
        .where('excels.id IS NOT NULL');

      const [excelData, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('excels.created_at', 'DESC')
        .getManyAndCount();

      return getPaginationResponse<ExcelEntity>(excelData, page, limit, total);
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching Excel', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
