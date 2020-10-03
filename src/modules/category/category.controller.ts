import { Controller, Get, Res } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
  constructor(private cateService: CategoryService) {}
  @Get('/save')
  async save(@Res() res) {
    await this.cateService.create({
      name: 'cate',
    });
    return res.status(200).json({
      message: 'success',
    });
  }
}
