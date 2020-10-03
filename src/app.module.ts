import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketProviders } from './services/socket';
import { CategoryModule } from './modules/category/category.module';
import { MongooseModule } from '@nestjs/mongoose';
import { StoryModule } from './modules/story/story.module';
import { ChapterModule } from './modules/chapter/chapter.module';
import { PupperteerService } from './services/pupperteer';
import { CrawService } from './services/crawl';
const uri =
    'mongodb+srv://truyenchon:Cuong123%21%40%23@truyenchon.keng7.mongodb.net/truyenchon?retryWrites=true&w=majority';
const uri_local = 'mongodb://localhost:27017/truyenchon2';
@Module({
    imports: [
        MongooseModule.forRoot(uri_local, {
            useFindAndModify: false,
        }),
        CategoryModule,
        StoryModule,
        ChapterModule,
    ],
    controllers: [AppController],
    providers: [AppService, ...SocketProviders, PupperteerService, CrawService],
})
export class AppModule {}
