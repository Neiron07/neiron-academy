/**
 * Маркетинговый текст, которого нет в API (отзывы, цены, преподаватели, адрес).
 * Это плейсхолдеры для примера — замените на реальные данные школы перед запуском.
 */

export const SITE = {
  city: 'Астана',
  district: 'ЖК Highvill',
  addressLine: 'г. Астана, ЖК Highvill, точный адрес уточняется в WhatsApp',
  instagram: 'https://instagram.com/neiron.academy',
  mapsQuery: 'Highvill Astana',
  twoGisReviewsUrl: 'https://2gis.kz/astana/firm/70000001105777339/tab/reviews',
};

export const WHY_US = [
  { title: 'До 6 детей в группе', text: 'Преподаватель успевает подойти к каждому — не как в классе на 25 человек.' },
  { title: 'Свой проект в портфолио', text: 'После курса у ребёнка остаётся готовая игра, сайт или бот — не просто оценка в дневнике.' },
  { title: 'Стажировка после курса', text: 'Лучшие ученики попадают на школьную стажировку и помогают вести младшие группы.' },
  { title: 'Преподаватели-практики', text: 'Программисты и дизайнеры, которые работают в IT, а не только преподают его.' },
];

export const HOW_IT_WORKS = [
  { step: 1, title: 'Пробный урок', text: 'Приходите на бесплатное занятие — ребёнок пробует, вы смотрите, как проходит урок.' },
  { step: 2, title: 'Подбираем группу', text: 'По возрасту и уровню — группа до 6 человек, 3 занятия в неделю.' },
  { step: 3, title: 'Учится и делает проект', text: 'Каждый модуль заканчивается своим проектом — не тестом, а готовой работой.' },
  { step: 4, title: 'Показывает результат', text: 'Проект уходит в портфолио, доступное родителю в личном кабинете.' },
];

// Фото — стоковые (Unsplash), временно, до реальных фото преподавателей.
export const TEACHERS = [
  {
    name: 'Данияр Ахметов',
    role: 'Python, Нейросети',
    years: '5 лет в разработке',
    photo: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Аружан Бекова',
    role: 'Scratch, Roblox Studio',
    years: '3 года преподавания детям',
    photo: 'https://images.unsplash.com/photo-1573496527892-904f897eb744?auto=format&fit=crop&w=400&q=80',
  },
];

// Фото — стоковые (Unsplash), иллюстративные, временно вместо реальных скриншотов проектов.
export const STUDENT_WORKS = [
  {
    title: 'Платформер в Scratch',
    author: 'Амир, 9 лет',
    photo: 'https://images.unsplash.com/photo-1610484826917-0f101a7bf7f4?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Симулятор кафе в Roblox Studio',
    author: 'Дана, 11 лет',
    photo: 'https://images.unsplash.com/photo-1638452033979-14fba9e17fbb?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Чат-бот на Python',
    author: 'Тимур, 13 лет',
    photo: 'https://images.unsplash.com/photo-1653566031471-85365f8d0ae0?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Генератор картинок с нейросетью',
    author: 'Алия, 14 лет',
    photo: 'https://images.unsplash.com/photo-1540058404349-2e5fabf32d75?auto=format&fit=crop&w=600&q=80',
  },
];

export const TESTIMONIALS = [
  {
    text: 'Сын ходит уже полгода, сделал свою первую игру в Roblox — гордится больше, чем оценками в школе.',
    author: 'Мама ученика, 10 лет',
  },
  {
    text: 'Видно, что группы маленькие — преподаватель правда знает, на чём каждый ребёнок застрял.',
    author: 'Папа ученицы, 12 лет',
  },
];

export const PRICING = [
  { title: 'Разовое занятие', price: 8000, note: 'если не уверены, что подойдёт' },
  { title: 'Абонемент на 8 занятий', price: 52000, note: 'месяц обучения, 2 занятия в неделю' },
  { title: 'Абонемент на 12 занятий', price: 72000, note: 'месяц обучения, 3 занятия в неделю' },
];
