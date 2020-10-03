import { IsString, IsMongoId, IsNumber, IsArray } from 'class-validator';
import { Category } from 'src/modules/category/schemas/category.schema';

export class StoryInterface {
    @IsString() @IsMongoId() _id: string;
    @IsArray() categories: Array<string>;
    @IsArray() chapters: Array<string>;
    @IsString() name: string;
    @IsString() banner: string;
    @IsString() author: string;
    @IsString() View: string;
    @IsNumber() rate: number;
    @IsNumber() status: number;
    @IsString() description: string;
    @IsNumber() follower: number;
    @IsString() created_at: string;
    @IsString() updated_at: string;
}
