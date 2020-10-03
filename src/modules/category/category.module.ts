import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CateSchema } from './schemas/category.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'categories', schema: CateSchema }])],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService]
})
export class CategoryModule {}
