import { Controller, Get, Render, Post, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { LogSubscribe } from './services/socket';
import { PupperteerService } from './services/pupperteer';
import { CrawService } from './services/crawl';
import { sendResponse } from './services/helper';

@Controller()
export class AppController {
    constructor(
        private crawService: CrawService,
        private readonly appService: AppService,
        private readonly pupperteer: PupperteerService,
    ) {}

    @Get('/')
    @Render('index')
    index() {}

    @Post('tool/get-cate')
    async getCate(@Req() req, @Res() res) {
        let result;
        const options = {
            headless: req.body.headless,
            url: req.body.url,
            type: req.body.type,
        };
        LogSubscribe.next('Đang thu thập danh sách danh mục');
        if (req.body.type == 'pupperteer') {
            result = await this.pupperteer.getCate(options);
        } else {
            result = await this.crawService.getCateElements();
        }
        return res.status(200).json({
            status: 200,
            data: result,
        });
    }

    @Post('tool/start')
    async start(@Req() req, @Res() res) {
        const options = {
            headless: req.body.headless,
            url: req.body.url,
            category: req.body.category,
            type: req.body.type,
        };

        res.status(201).json({
            status: 200,
        });
        if (req.body.type == 'pupperteer') {
            await this.pupperteer.step0(options);
        } else {
            await this.crawService.startCrawl(options.category);
        }
    }

    @Get('test')
    async test(@Res() res) {
        res.status(201).json({});
    }
}
