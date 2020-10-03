import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as moment from 'moment';
import { Story } from 'src/modules/story/schema/story.schema';

@Schema()
export class Chapter extends Document {
    @Prop()
    stt: number;

    @Prop()
    name: string;

    @Prop({ default: [] })
    images: Array<{}>;

    @Prop({ default: 0 })
    view: number;

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
export const ChapterSchema = SchemaFactory.createForClass(Chapter);
