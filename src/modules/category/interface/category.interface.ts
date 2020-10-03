import { IsString, IsMongoId, IsArray } from 'class-validator';
import { Story } from 'src/modules/story/schema/story.schema';

export class CategoryInterface {
    @IsString() @IsMongoId() _id: string;
    @IsArray() stories: Array<Story>;
    @IsString() name: string;
    @IsString() slug: string;
    @IsString() description: string;
    @IsString() updated_at?: string;
}
