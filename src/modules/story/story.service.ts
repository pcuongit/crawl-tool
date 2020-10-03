import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Story } from './schema/story.schema';
import { Model } from 'mongoose';
import { StoryDto } from './dto/story.dto';
import { StoryInterface } from './interface/story.interface';
import { CateDto } from '../category/dto/category.dto';
import { Category } from '../category/schemas/category.schema';

@Injectable()
export class StoryService {
    constructor(
        @InjectModel('stories') private storyModel: Model<Story>,
        @InjectModel('categories') private cateModel: Model<Category>,
    ) {}
    async createOrUpdate(name: string, idCate: string, dataStory: StoryDto) {
        const findResult = await this.find(name);
        if (findResult) {
            // console.log(findResult.categories);
            // if (!findResult.categories.includes(dataStory.categoryId)) {
            //   await this.addCateToStory(findResult._id, dataStory.categoryId);
            // }
            return this.update(findResult._id, dataStory);
        } else {
            return this.create(idCate, dataStory);
        }
    }
    async create(idCate, dataStory: StoryDto): Promise<StoryInterface> {
        const newStory = await this.storyModel.create(dataStory);
        const category = await this.cateModel.findOne({ _id: idCate });
        await this.addStoryToCate(idCate, newStory);
        return this.addCateToStory(newStory._id, category);
    }

    async update(_id: string, dataStory: StoryDto): Promise<StoryInterface> {
        delete dataStory.categoryId;
        const changes = dataStory;
        return this.storyModel.findOneAndUpdate(
            { _id: _id },
            { ...changes },
            { new: true },
        );
    }

    async find(name: string): Promise<StoryInterface> {
        return this.storyModel.findOne({ name: name }).populate('categories');
    }

    async findAll(): Promise<StoryInterface[]> {
        return this.storyModel.find();
    }

    async addStoryToCate(cateId, story: StoryDto) {
        return this.cateModel.findByIdAndUpdate(
            cateId,
            { $push: { stories: story._id } },
            { new: true, useFindAndModify: false },
        );
    }

    async addCateToStory(storyId, category: CateDto) {
        return this.storyModel.findByIdAndUpdate(
            storyId,
            { $push: { categories: category._id } },
            { new: true, useFindAndModify: false },
        );
    }
}
