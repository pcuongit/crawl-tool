import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chapter } from './schema/chapter.schema';
import { ChapterInterface } from './interface/chapter.interface';
import { ChapterDto } from './dto/chapter.dto';
import { Story } from '../story/schema/story.schema';

@Injectable()
export class ChapterService {
    constructor(
        @InjectModel('chapters') private chapterModel: Model<Chapter>,
        @InjectModel('stories') private storyModel: Model<Story>,
    ) {}
    async createOrUpdate(name: string, storyId: string, chapterData: any) {
        const findResult = await this.find(name);
        if (findResult) {
            return this.updateChapter(findResult._id, chapterData);
        } else {
            delete chapterData.updated_at;
            return this.createChapter(storyId, chapterData);
        }
    }
    async find(name: string): Promise<ChapterInterface> {
        return this.chapterModel.findOne({ name: name });
    }
    async createChapter(
        storyId: string,
        chapterData: any,
    ): Promise<ChapterInterface> {
        const newChapter = await this.chapterModel.create(chapterData);
        return this.storyModel.findByIdAndUpdate(
            storyId,
            { $push: { chapters: newChapter._id } },
            { new: true, useFindAndModify: false },
        );
    }

    async updateChapter(
        _id: string,
        data: ChapterDto,
    ): Promise<ChapterInterface> {
        const changes = data;
        return this.chapterModel.findOneAndUpdate(
            { _id: _id },
            { ...changes },
            { new: true },
        );
    }
}
