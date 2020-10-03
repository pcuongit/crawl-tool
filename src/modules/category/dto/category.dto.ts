import { Story } from 'src/modules/story/schema/story.schema';

export class CateDto {
    _id?: string;
    name?: string;
    slug?: string;
    stories?: Array<Story>;
    description?: string;
    updated_at?: string;
}
