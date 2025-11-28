// @ts-nocheck

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seed() {
  const count = await prisma.activity.count()
  if (count > 0) {
    console.log('Activities already exist, skip seeding.')
    return
  }

  await prisma.activity.createMany({
    data: [
      {
        title: '公園健走團',
        description: '慢走 30 分鐘＋伸展，步調舒適，歡迎新手',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: '手機拍照教學',
        description: '教你用手機拍出好照片，現場練習與交流',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: '桌遊同樂會',
        description: '輕鬆的紙牌與合作桌遊，認識新朋友',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
    ],
  })

  console.log('✅ Seeded 3 activities.')
  await prisma.$disconnect()
}
