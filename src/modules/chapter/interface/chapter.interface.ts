import { IsMongoId, IsString, IsArray, IsNumber } from 'class-validator';

export class ChapterInterface {
    @IsString() @IsMongoId() _id: string;
    @IsNumber() stt: number;
    @IsString() name: string;
    @IsArray() images: Array<string>;
    @IsString() created_at: string;
    @IsString() updated_at: string;
}
