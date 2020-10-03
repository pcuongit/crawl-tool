import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as moment from 'moment';
import { Category } from 'src/modules/category/schemas/category.schema';
import { Chapter } from 'src/modules/chapter/schema/chapter.schema';
@Schema()
export class Story extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'categories' })
    categories: Array<Category>;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'chapters' })
    chapters: Array<Chapter>;

    @Prop()
    name: string;

    @Prop()
    banner: string;

    @Prop({ default: null })
    author: string;

    @Prop({ default: 0 })
    View: string;

    @Prop({ default: 0 })
    rate: number;
    //status = 0 => chua hoan thanh , 1 => hoan thanh
    @Prop({ default: null })
    status: string;

    @Prop({ default: null })
    description: string;

    @Prop({ default: 0 })
    follower: number;

    @Prop({
        default: moment()
            .local()
            .format('YYYY-MM-DDTHH:mm:ss.sssZ'),
    })
    created_at: string;

    @Prop({
        default: moment()
            .local()
            .format('YYYY-MM-DDTHH:mm:ss.sssZ'),
    })
    updated_at: string;
}
export const StorySchema = SchemaFactory.createForClass(Story);
