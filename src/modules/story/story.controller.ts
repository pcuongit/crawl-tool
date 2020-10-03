import { Controller, Get, Res } from '@nestjs/common';
import { StoryService } from './story.service';

@Controller('story')
export class StoryController {
  constructor(private storyService: StoryService) {}
  @Get('test')
  async test(@Res() res) {
    // const result1 = await this.storyService.addCateToStory(
    //   '5f2ae0f7cf8902355cddda23',
    //   '5f2ae0f1cf8902355cddd9ee',
    // );
    const result = await this.storyService.find(
      ' Bị Ép Trở Thành Người Mạnh Nhất Thế Giới',
    );
    console.log('StoryController -> test -> result', result.categories);
    return res.status(200).json({
      result,
    });
  }
}
