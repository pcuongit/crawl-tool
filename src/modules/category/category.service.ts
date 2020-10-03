import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CateDto } from './dto/category.dto';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CategoryInterface } from './interface/category.interface';
@Injectable()
export class CategoryService {
    constructor(
        @InjectModel('categories') private cateModel: Model<Category>,
    ) {}

    async createOrUpdate(name: string, obj: any) {
        const findResult = await this.find(name);
        if (findResult) {
            return this.update(findResult._id, obj);
        } else {
            const cateObj = {};
            cateObj['name'] = obj.name;
            if (obj.description) cateObj['description'] = obj.description;
            return this.create(cateObj);
        }
    }
    async create(CateObj: CateDto): Promise<CategoryInterface> {
        const createdCate = new this.cateModel(CateObj);
        const saveCate = await createdCate.save();
        return saveCate.toObject({ versionKey: false });
    }
    async createOrUpdateBulk(arrayData: any) {
        return new Promise(async resolve => {
            for (const item in arrayData) {
                await this.createOrUpdate(item, { name: item });
            }
            resolve();
        });
    }
    async update(_id: string, cate: CateDto): Promise<CategoryInterface> {
        const changes = cate;
        return this.cateModel.findOneAndUpdate(
            { _id: _id },
            { ...changes },
            { new: true },
        );
    }

    async find(name: string): Promise<CategoryInterface> {
        return this.cateModel.findOne({ name: name });
    }

    async findAll(): Promise<CategoryInterface[]> {
        return this.cateModel.find();
    }
}
