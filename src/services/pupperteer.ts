import * as pupperteer from 'puppeteer';
import { LogSubscribe } from './socket';
import { CategoryService } from '../modules/category/category.service';
import moment = require('moment');
import { StoryService } from '../modules/story/story.service';
import { ChapterService } from '../modules/chapter/chapter.service';
import { Injectable } from '@nestjs/common';
@Injectable()
export class PupperteerService {
    page: any;
    browser: any;
    loop: number = 5;
    constructor(
        private cateService: CategoryService,
        private storyService: StoryService,
        private chapterService: ChapterService,
    ) {}
    async getCate(options) {
        try {
            await this.initBrowser(options);
            await this.step1();
            return this.cateService.findAll();
        } catch (err) {
            LogSubscribe.next('đã có lỗi xảy ra: ' + err);
            if (this.browser) await this.browser.close();
        }
    }
    //khởi tại browser
    async initBrowser(options) {
        try {
            this.browser = await pupperteer.launch({
                headless: options.headless === 'true' ? true : false,
                // executablePath: '/usr/bin/google-chrome'
            });
            LogSubscribe.next('Mở chromenium');
            this.page = await this.browser.newPage();
            this.page.on('console', msg => {
                for (let i = 0; i < msg.args.length; ++i)
                    console.log(`${i}: ${msg.args[i]}`);
            });
            LogSubscribe.next('đi đến link: ' + options.url);
            await this.page.goto(options.url);
        } catch (error) {
            LogSubscribe.next(error);
            await this.browser.close();
        }
    }
    async step0(options) {
        try {
            // this.initBrowser(options);
            // await this.step1();
            await this.step2(options.category);
            LogSubscribe.next('thu thập dữ liệu hoàn tất. đóng browser');
            await this.browser.close();
        } catch (err) {
            LogSubscribe.next('đã có lỗi xảy ra: ' + err);
            if (this.browser) await this.browser.close();
        }
    }
    //save Category
    async step1(): Promise<any> {
        const arrayElement = await this.page.$$(
            '.dropdown-menu.megamenu li div.clearfix ul.nav li a',
        );
        try {
            LogSubscribe.next('Lấy danh sách category và lưu db');
            for (const element of arrayElement) {
                await new Promise(async resolve => {
                    const text = await this.page.evaluate(
                        element => element.textContent,
                        element,
                    );
                    if (text.trim() != 'Tất cả') {
                        await this.cateService.createOrUpdate(text.trim(), {
                            name: text.trim(),
                        });
                    }
                    resolve('step1: done');
                });
            }
        } catch (e) {}
    }
    //get story
    async step2(arrCateDB: [string]) {
        return new Promise<any>(async resolve => {
            try {
                for (const cate of arrCateDB) {
                    await new Promise(async resolve => {
                        LogSubscribe.next(
                            `Cập nhật chi tiết cho thể loại ${cate}`,
                        );
                        try {
                            await this.page.waitForSelector('.dropdown', {
                                timeout: 30000,
                            });
                            await this.page.hover('.dropdown');
                            await this.page.waitForSelector('.dropdown.open', {
                                timeout: 30000,
                            });
                            const elWithText = await this.page.$x(
                                `//a[contains(., "${cate}")]`,
                            );
                            elWithText[0].click();
                            await this.page.waitForSelector(
                                '.description .info',
                                {
                                    timeout: 30000,
                                },
                            );
                        } catch (error) {
                            LogSubscribe.next(error);
                            resolve();
                        }
                        const elDescription = await this.page.$(
                            '.description .info',
                        );
                        const description = await this.page.evaluate(
                            element => element.textContent,
                            elDescription,
                        );
                        const category = await this.cateService.createOrUpdate(
                            cate,
                            {
                                description: description,
                                updated_at: moment()
                                    .local()
                                    .format('YYYY-MM-DDTHH:mm:ss.sssZ'),
                            },
                        );
                        await this.step3(category._id);
                        await this.page.waitFor(5000);
                        resolve();
                    });
                }
                resolve('step2: done');
            } catch (err) {
                LogSubscribe.next(err + ' => bỏ qua');
                resolve('next');
            }
        });
    }
    //get information story
    async step3(idCate) {
        return new Promise(async resolve => {
            try {
                let stopNextPage = false;
                while (!stopNextPage) {
                    await this.page.waitForSelector('.ModuleContent .items', {
                        timeout: 30000,
                    });
                    await this.page.waitForSelector('.pagination li.active', {
                        timeout: 30000,
                    });
                    const currentPage = await this.page.$eval(
                        '.pagination li.active',
                        el => el.innerText,
                    );
                    stopNextPage =
                        (await this.page.$('.pagination li .next-page')) !==
                        null
                            ? false
                            : true;
                    const stories = await this.page.evaluate(() => {
                        const arr = [];
                        document
                            .querySelectorAll('.item .image')
                            .forEach(async element => {
                                const name = element
                                    .querySelector('a')
                                    .title.replace('Truyện tranh', '');
                                const banner = element
                                    .querySelector('a img')
                                    .getAttribute('data-original');
                                const link = element.querySelector('a').href;
                                arr.push({
                                    name,
                                    banner,
                                    link,
                                });
                            });
                        return arr;
                    });
                    for (
                        let i = 0;
                        i <= Math.floor(stories.length / this.loop);
                        i++
                    ) {
                        await new Promise(async resolve => {
                            const listPromise = [];
                            if (i == Math.floor(stories.length / this.loop)) {
                                for (
                                    let j = 0;
                                    j < stories.length % this.loop;
                                    j++
                                ) {
                                    listPromise.push(
                                        this.step4(stories[i * 5 + j], idCate),
                                    );
                                }
                            } else {
                                for (let j = 0; j < this.loop; j++) {
                                    listPromise.push(
                                        this.step4(stories[i * 5 + j], idCate),
                                    );
                                }
                            }
                            await Promise.all(listPromise);
                            resolve();
                        });
                    }
                    LogSubscribe.next(
                        'chuyển tiếp page ' + (parseInt(currentPage) + 1),
                    );
                    await this.page.click('.pagination li .next-page');
                }
                resolve('step3: done');
            } catch (err) {
                LogSubscribe.next(err + ' => bỏ qua');
                resolve('next');
            }
        });
    }

    async step4(storyObj, idCate) {
        return new Promise(async resolve => {
            try {
                LogSubscribe.next(
                    `Đang thu thập dữ liệu truyện: ${storyObj.name}`,
                );
                const page = await this.browser.newPage();
                try {
                    await page.goto(storyObj.link, {
                        waitUntil: 'networkidle0',
                        timeout: 60000,
                    });
                } catch (error) {
                    LogSubscribe.next(error);
                    resolve();
                }

                const dataStory = await page.evaluate(async () => {
                    const author = document.querySelector(
                        '.list-info .author p:last-child',
                    ).textContent;
                    const status = document.querySelector(
                        '.list-info .status p:last-child',
                    ).textContent;
                    const description = document.querySelector(
                        '.detail-content p',
                    ).textContent;
                    return { author, status, description };
                });
                const checkExists = await this.storyService.find(storyObj.name);
                if (checkExists != null) {
                    LogSubscribe.next('đã tồn tại truyện trong db => bỏ qua');
                    await page.close();
                    resolve();
                }
                const story = await this.storyService.createOrUpdate(
                    storyObj.name,
                    idCate,
                    {
                        name: storyObj.name,
                        banner: storyObj.banner,
                        author: dataStory.author,
                        description: dataStory.description,
                        status: dataStory.status,
                    },
                );

                LogSubscribe.next(`Đang thu thập số lượng chapter.`);
                const listChapter = await page.evaluate(async story => {
                    const list = [];
                    document
                        .querySelectorAll('.list-chapter nav ul li')
                        .forEach(element => {
                            if (!element.classList.contains('heading')) {
                                const linkChapter = element.querySelector(
                                    '.chapter a',
                                )['href'];
                                const nameChapter = element.querySelector(
                                    '.chapter a',
                                ).textContent;
                                list.push({
                                    linkChapter,
                                    nameChapter,
                                    idStory: story._id,
                                });
                            }
                        });
                    return list;
                }, story);
                LogSubscribe.next(`Hoàn tất lưu dữ liệu truyện: `);
                LogSubscribe.next(`- Tên: ${story.name}`);
                LogSubscribe.next(`- Số lượng chapter: ${listChapter.length}`);
                for (const index in listChapter.reverse()) {
                    await new Promise(async resolve => {
                        await this.step5(listChapter[index], story.name);
                        resolve();
                    });
                }
                await page.close();
                resolve('step4: done');
            } catch (err) {
                LogSubscribe.next(err + ' => bỏ qua');
                resolve('next');
            }
        });
    }

    async step5(dataChapter, nameStory) {
        return new Promise(async resolve => {
            try {
                LogSubscribe.next(
                    `Đang thu thập dữ liệu chapter của truyện: ${nameStory}, ${dataChapter.nameChapter}`,
                );
                const page = await this.browser.newPage();
                try {
                    await page.goto(dataChapter.linkChapter, {
                        waitUntil: 'networkidle0',
                        timeout: 120000,
                    });
                } catch (error) {
                    LogSubscribe.next(error);
                    await page.close();
                    resolve();
                }

                const listImagesChapter = await page.evaluate(async () => {
                    const list = [];
                    document
                        .querySelectorAll('.reading-detail .page-chapter')
                        .forEach(element => {
                            const linkImg = element
                                .querySelector('img')
                                .getAttribute('data-original');
                            const nameImg = element
                                .querySelector('img')
                                .getAttribute('alt');
                            list.push({ linkImg, nameImg });
                        });

                    return list;
                });
                const saveChapter = await this.chapterService.createOrUpdate(
                    dataChapter.nameChapter,
                    dataChapter.idStory,
                    {
                        name: dataChapter.nameChapter,
                        images: listImagesChapter,
                        updated_at: moment()
                            .local()
                            .format('YYYY-MM-DDTHH:mm:ss.sssZ'),
                    },
                );
                LogSubscribe.next(
                    `hoàn tất thu thập dữ liệu chapter của truyện: ${nameStory}, ${saveChapter.name}, đóng tab`,
                );
                await page.close();
                resolve('step5: done');
            } catch (err) {
                LogSubscribe.next(err + ' => bỏ qua');
                resolve('next');
            }
        });
    }
}
