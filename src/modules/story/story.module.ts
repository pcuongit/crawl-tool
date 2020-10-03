import { Module } from '@nestjs/common';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { MongooseModule } from '@nestjs/mongoose';
import { StorySchema } from './schema/story.schema';
import { CateSchema } from '../category/schemas/category.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'stories', schema: StorySchema },
            { name: 'categories', schema: CateSchema },
        ]),
    ],
    controllers: [StoryController],
    providers: [StoryService],
    exports: [StoryService],
})
export class StoryModule {}
