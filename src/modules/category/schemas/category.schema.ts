import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as moment from 'moment';
import { Story } from 'src/modules/story/schema/story.schema';
@Schema()
export class Category extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ default: null })
    slug: string;

    @Prop({ default: null })
    description: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'stories' })
    stories: Array<Story>;

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
export const CateSchema = SchemaFactory.createForClass(Category);
