import {
    compose,
    composeAsync,
    extractNumber,
    enforceHttpsUrl,
    fetchHtmlFromUrl,
    extractFromElems,
    getNumberFromUrl,
    fetchElemInnerText,
    fetchElemAttribute,
} from './helper';
import * as moment from 'moment';
import * as lodash from 'lodash';
import { CategoryService } from 'src/modules/category/category.service';
import { StoryService } from 'src/modules/story/story.service';
import { ChapterService } from 'src/modules/chapter/chapter.service';
import { Injectable } from '@nestjs/common';
import { LogSubscribe } from './socket';

@Injectable()
export class CrawService {
    constructor(
        private cateService: CategoryService,
        private storyService: StoryService,
        private chapterService: ChapterService,
    ) {}
    SCOTCH_BASE = 'http://truyenchon.com';
    RelativeUrl(url) {
        return lodash.isString(url)
            ? `${this.SCOTCH_BASE}${url.replace(/^\/*?/, '/')}`
            : null;
    }

    async getCateElements() {
        const $ = await fetchHtmlFromUrl(this.RelativeUrl('the-loai'));
        const categoriesEl = [];
        const categories = [];
        $('.cmszone .nav li').each(async (index, element) => {
            categoriesEl.push($(element));
        });
        categoriesEl.shift();
        LogSubscribe.next('Lấy danh sách category và lưu db');
        for (const element of categoriesEl) {
            await new Promise(async resolve => {
                const txt = fetchElemInnerText(element.find('a'));
                const link = fetchElemAttribute('href')(element.find('a'));
                const slug = link.split('/').pop();
                // console.log('CrawService -> getCateElements -> slug', slug);
                const category = await this.cateService.createOrUpdate(txt, {
                    name: txt,
                    slug,
                });
                // categories.push({ txt, link, idCate: category._id });
                resolve();
            });
        }
        return this.cateService.findAll();
    }
    async startCrawl(categories: [string]) {
        try {
            for (const category of categories) {
                await new Promise(async resolve => {
                    LogSubscribe.next(
                        `Cập nhật chi tiết cho thể loại ${category}`,
                    );
                    const cateFromDB = await this.cateService.find(category);
                    await this.getStoryElement(cateFromDB);
                    setTimeout(() => {
                        resolve();
                    }, 30000);
                });
            }
        } catch (error) {
            LogSubscribe.next('có lỗi xảy ra msg: ' + error);
        }
    }
    async getStoryElement(category: any): Promise<any> {
        const linkCate = this.RelativeUrl(`the-loai/${category.slug}`);
        return new Promise<any>(async resolve => {
            try {
                const $ = await fetchHtmlFromUrl(linkCate);
                await this.cateService.createOrUpdate(category.name, {
                    name: category.name,
                    description: fetchElemInnerText($('.description .info')),
                });
                let currentPage = parseInt(
                    fetchElemInnerText($('.pagination li.active a')),
                );
                // const totalPages = parseInt(
                //     getNumberFromUrl($('.pagination li:last-child a')),
                // );
                const totalPages = 2;
                while (currentPage <= totalPages) {
                    const _$ = await fetchHtmlFromUrl(
                        linkCate + '?page=' + currentPage,
                    );
                    const storyElements = _$('.items .item .image a');
                    const stories = [];
                    storyElements.each(async (index, element) => {
                        const title = fetchElemAttribute('title')(_$(element));
                        const link = fetchElemAttribute('href')(_$(element));
                        const banner = fetchElemAttribute('data-original')(
                            _$(element).find('img'),
                        );
                        stories.push({
                            title,
                            link,
                            banner,
                            idCate: category._id,
                        });
                    });
                    for (const story of stories) {
                        await new Promise(async resolve => {
                            LogSubscribe.next(
                                `Đang thu thập dữ liệu truyện: ${story.title}`,
                            );
                            // console.log('CrawService -> story', story);
                            await this.getStoryDetails(story);
                            resolve();
                        });
                    }
                    currentPage++;
                    LogSubscribe.next('tới page ' + currentPage);
                }

                setTimeout(() => {
                    resolve();
                }, 30000);
            } catch (error) {
                LogSubscribe.next('có lỗi xảy ra msg: ' + error);
                setTimeout(() => {
                    resolve();
                }, 5000);
            }
        });
    }
    async getStoryDetails(storyObj: any) {
        return new Promise(async resolve => {
            try {
                const $ = await fetchHtmlFromUrl(storyObj.link);
                console.log(
                    'CrawService -> getStoryDetails -> storyObj.link',
                    storyObj.link,
                );
                const author = fetchElemInnerText(
                    $('#item-detail').find(
                        '.detail-info .list-info .author p:last-child',
                    ),
                );
                const description = fetchElemInnerText(
                    $('#item-detail').find(
                        ' .detail-info .list-info .status p:last-child',
                    ),
                );
                const status = fetchElemInnerText(
                    $('#item-detail').find('.detail-content p:last-child'),
                );
                LogSubscribe.next(`Đang thu thập số lượng chapter.`);
                const checkExists = await this.storyService.find(
                    storyObj.title,
                );
                const story = await this.storyService.createOrUpdate(
                    storyObj.title,
                    storyObj.idCate,
                    {
                        name: storyObj.title,
                        banner: storyObj.banner,
                        author: author,
                        description: description,
                        status: status,
                    },
                );
                if (checkExists != null) {
                    LogSubscribe.next(
                        'đã tồn tại truyện ' +
                            story.name +
                            ' trong db => bỏ qua',
                    );
                    resolve();
                } else {
                    const listChapterEl = $('#nt_listchapter nav ul a');
                    let indexChapter = listChapterEl.length;
                    LogSubscribe.next(
                        `- Hoàn tất lưu dữ liệu truyện: ${story.name}`,
                    );
                    LogSubscribe.next(
                        `- Số lượng chapter: ${listChapterEl.length}`,
                    );
                    listChapterEl.each(async (index, element) => {
                        await new Promise(async resolve => {
                            const link = fetchElemAttribute('href')($(element));
                            const nameChapter = fetchElemInnerText($(element));
                            await this.getChapterElement({
                                nameChapter,
                                link,
                                idStory: story._id,
                                indexChapter,
                                nameStory: storyObj.title,
                            });
                            indexChapter--;
                            resolve();
                        });
                    });
                    setTimeout(() => {
                        resolve();
                    }, 5000);
                }
            } catch (error) {
                LogSubscribe.next('story, có lỗi xảy ra msg: ' + error);
                setTimeout(() => {
                    resolve();
                }, 5000);
            }
        });
    }

    async getChapterElement(chapterObj) {
        return new Promise(async resolve => {
            try {
                LogSubscribe.next(
                    `Đang thu thập dữ liệu chapter của truyện: ${chapterObj.nameStory},  ${chapterObj.nameChapter}`,
                );
                const $ = await fetchHtmlFromUrl(chapterObj.link);
                const arrImg = [];
                const listImgElement = $('.reading-detail .page-chapter img');
                listImgElement.each(async (index, element) => {
                    await new Promise(async resolve => {
                        const name = fetchElemAttribute('alt')($(element));
                        const img = fetchElemAttribute('data-original')(
                            $(element),
                        );
                        arrImg.push({ name, img });
                        resolve();
                    });
                });
                const saveChapter = await this.chapterService.createOrUpdate(
                    chapterObj.nameChapter,
                    chapterObj.idStory,
                    {
                        name: chapterObj.nameChapter,
                        images: arrImg,
                        updated_at: moment()
                            .local()
                            .format('YYYY-MM-DDTHH:mm:ss.sssZ'),
                    },
                );
                LogSubscribe.next(
                    `hoàn tất thu thập dữ liệu chapter của truyện: ${chapterObj.nameStory}, ${saveChapter.name}`,
                );
                resolve();
            } catch (error) {
                LogSubscribe.next('Chapter: có lỗi xảy ra msg: ' + error);
                resolve();
            }
        });
    }
}
