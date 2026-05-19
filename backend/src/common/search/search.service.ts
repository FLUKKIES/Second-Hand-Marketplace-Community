import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';
import { SearchPostDto } from './dto/search-post.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchPosts(dto: SearchPostDto) {
    const { keyword, categoryId, groupId, minPrice, maxPrice, type, sortBy, minRating } = dto;

    if (!keyword) {
      return null;
    }

    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      ...(groupId && { groupId }),
      ...(categoryId && { group: { categoryId: Number(categoryId) } }),
      ...(type && type !== 'ALL' && { type: type as any }),
      OR: [
        { content: { contains: keyword, mode: 'insensitive' } },
        {
          products: {
            some: {
              OR: [
                { name: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
              ],
            },
          },
        },
      ],
    };

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.products = {
        some: {
          ...(minPrice !== undefined && { price: { gte: minPrice } }),
          ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
        },
      };
    }

    const posts = await this.prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reviewsReceived: { select: { rating: true } },
          },
        },
        group: { select: { id: true, name: true, category: true } },
        images: true,
        products: true,
        _count: { select: { likes: true, comments: true } },
      },
      take: 50,
    });

    let results = posts.map((post) => {
      const totalRating = post.author.reviewsReceived.reduce((acc, r) => acc + r.rating, 0);
      const avgRating =
        post.author.reviewsReceived.length > 0
          ? totalRating / post.author.reviewsReceived.length
          : 0;

      return { ...post, author: { ...post.author, avgRating } };
    });

    if (minRating) {
      results = results.filter((p) => p.author.avgRating >= minRating);
    }

    if (sortBy === 'PRICE_ASC') {
      results.sort((a, b) => {
        const pa = a.products?.[0]?.price ? Number(a.products[0].price) : Infinity;
        const pb = b.products?.[0]?.price ? Number(b.products[0].price) : Infinity;
        return pa - pb;
      });
    } else if (sortBy === 'PRICE_DESC') {
      results.sort((a, b) => {
        const pa = a.products?.[0]?.price ? Number(a.products[0].price) : 0;
        const pb = b.products?.[0]?.price ? Number(b.products[0].price) : 0;
        return pb - pa;
      });
    } else {
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return results;
  }
}
