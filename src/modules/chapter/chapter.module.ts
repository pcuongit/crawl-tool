import { Module } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChapterSchema } from './schema/chapter.schema';
import { StorySchema } from '../story/schema/story.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'chapters', schema: ChapterSchema },
            { name: 'stories', schema: StorySchema },
        ]),
    ],
    providers: [ChapterService],
    exports: [ChapterService],
})
export class ChapterModule {}
