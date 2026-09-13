/**
 * Переводы только для лендинга (не для кабинетов). Три языка: ru — основной,
 * kk и en — переводы. Структура kk/en должна зеркалить ru один в один.
 */

const ru = {
  header: {
    login: 'Войти',
  },
  languageNames: {
    ru: 'Русский',
    kk: 'Қазақша',
    en: 'English',
  },
  hero: {
    headline: 'IT-школа, где вы обеспечите своему ребенку успешное будущее',
    subtitle: 'Scratch, Roblox Studio, Python и нейросети. Группы до 6 человек, 3 занятия в неделю. Highvill, Астана.',
    cta: 'Записаться на пробный урок',
    ctaHint: 'Первое занятие — бесплатно',
  },
  stats: {
    items: [
      { label: 'учеников уже обучили' },
      { label: 'направлений: Scratch, Roblox, Python, сайты, нейросети' },
      { label: 'человек максимум в группе' },
      { label: 'преподаватели на связи' },
    ],
  },
  courses: {
    title: 'Направления',
    subtitle: 'Подбираем направление по возрасту и интересам ребёнка',
    agesSuffix: 'лет',
    items: {
      scratch: {
        name: 'Scratch',
        explanation:
          'Первый язык программирования на визуальных блоках вместо текста — ребёнок с первого занятия собирает игру или мультфильм, а не читает теорию. За курс он проходит логику, циклы и условия так, что даже не замечает, что это «программирование».',
      },
      roblox: {
        name: 'Roblox Studio',
        explanation:
          'Создание собственных 3D-игр в Roblox на языке Lua — от первой локации до готовой игры, в которую можно позвать друзей. Здесь ребёнок делает шаг от простых блоков к настоящему коду, но в среде, которую уже хорошо знает как игрок.',
      },
      python: {
        name: 'Python',
        explanation:
          'Настоящий текстовый язык программирования: синтаксис, структуры данных, работа с API. Ученики пишут ботов, мини-игры и утилиты — код, который реально работает и решает задачу, а не учебный пример.',
      },
      webdev: {
        name: 'Разработка сайтов',
        explanation:
          'HTML, CSS и JavaScript — вёрстка страниц, стили, простая интерактивность. К концу курса у ребёнка есть свой сайт-визитка или лендинг, который можно показать друзьям по ссылке.',
      },
      ai: {
        name: 'Нейросети',
        explanation:
          'Как пользоваться современными нейросетями осознанно и с пользой: ChatGPT и Claude для учёбы, Suno для музыки, генерация видео и аватаров. 11 модулей о том, как AI помогает делать проекты, а не просто «поболтать с ботом».',
      },
    },
  },
  whyUs: {
    title: 'Почему мы',
    items: [
      { title: 'До 6 детей в группе', text: 'Преподаватель успевает подойти к каждому — не как в классе на 25 человек.' },
      { title: 'Свой проект в портфолио', text: 'После курса у ребёнка остаётся готовая игра, сайт или бот — не просто оценка в дневнике.' },
      { title: 'Стажировка после курса', text: 'Лучшие ученики попадают на школьную стажировку и помогают вести младшие группы.' },
      { title: 'Преподаватели-практики', text: 'Действующие разработчики, которые работают в IT, а не только преподают его.' },
    ],
  },
  howItWorks: {
    title: 'Как проходит обучение',
    steps: [
      { title: 'Пробный урок', text: 'Приходите на бесплатное занятие — ребёнок пробует, вы смотрите, как проходит урок.' },
      { title: 'Подбираем группу', text: 'По возрасту и уровню — группа до 6 человек, 3 занятия в неделю.' },
      { title: 'Учится и делает проект', text: 'Каждый модуль заканчивается своим проектом — не тестом, а готовой работой.' },
      { title: 'Показывает результат', text: 'Проект уходит в портфолио, доступное родителю в личном кабинете.' },
    ],
  },
  studentWorks: {
    title: 'Работы учеников',
    cta: 'Посмотреть проект',
    items: [
      {
        title: 'Платформер в Scratch',
        author: 'Амир, 9 лет',
        description: 'За несколько занятий собрал платформер с прыжками, врагами и счётом очков — от первого блока до playable-игры.',
      },
      {
        title: 'Симулятор кафе в Roblox Studio',
        author: 'Дана, 11 лет',
        description: 'Построила 3D-локацию кафе и написала на Lua скрипт приёма заказов — можно позвать друзей и играть вместе.',
      },
      {
        title: 'Чат-бот на Python',
        author: 'Тимур, 13 лет',
        description: 'Написал чат-бота на Python, который отвечает на вопросы и умеет считать — первый код, который реально работает.',
      },
      {
        title: 'Генератор картинок с нейросетью',
        author: 'Алия, 14 лет',
        description: 'Научилась использовать нейросеть для генерации иллюстраций по текстовому описанию для собственного проекта.',
      },
    ],
  },
  teachers: {
    title: 'Преподаватели',
    intro: 'Это действующие разработчики — они пишут код в реальных проектах и приносят на урок то, что происходит в IT прямо сейчас, а не только методичку.',
    items: {
      almaz: { role: 'Fullstack-разработчик', years: '10 лет опыта в разработке' },
      aidana: { role: 'Python-разработчик', years: '' },
      azamat: { role: 'Scratch, Roblox Studio', years: '' },
    },
  },
  testimonials: {
    title: 'Отзывы родителей',
    cta: 'Смотреть все отзывы в 2ГИС',
  },
  whatsIncluded: {
    title: 'Что входит в обучение',
    items: [
      '3 занятия в неделю по 60 минут',
      'Действующий IT-специалист в роли преподавателя',
      'Методичка с Гарварда',
      'Собственная платформа с личным кабинетом',
      'Собственная валюта школы — коины за успехи на уроках',
      'Магазин, где можно обменивать коины на призы',
      'Раз в месяц — мастер-класс',
      'Активности в школе',
    ],
  },
  faq: {
    title: 'Частые вопросы',
    items: [
      {
        q: 'С какого возраста можно начать?',
        a: 'С 7 лет. Направление подбираем по возрасту: Scratch для 7–10 лет, Roblox Studio для 10–13 лет, Python для 13–15 лет, нейросети — с 10 лет. Если сомневаетесь, на пробном уроке преподаватель подскажет, с чего лучше начать.',
      },
      {
        q: 'Ребёнок никогда не программировал. Он справится?',
        a: 'Да. Большинство наших учеников приходят с нуля. Scratch построен на визуальных блоках, и первую игру ребёнок собирает уже на первых занятиях. Мы начинаем с простого и усложняем постепенно.',
      },
      {
        q: 'Как проходит пробный урок?',
        a: 'Первое занятие бесплатное. Ребёнок пробует создать свой первый мини-проект, а вы видите, как устроен урок и подходит ли ему формат. Длительность 60 минут. Записаться можно на любой день с 12:00 до 18:00 в филиале на Кошкарбаева 10/1 (Highvill).',
      },
      {
        q: 'Можно ли родителю присутствовать на уроке?',
        a: 'Можно подождать в холле. На обычных занятиях дети сосредоточеннее, когда занимаются самостоятельно.',
      },
      {
        q: 'Сколько длится одно занятие?',
        a: '60 минут.',
      },
      {
        q: 'Нужен ли свой ноутбук?',
        a: 'Да, ноутбук нужен свой. Мы считаем, что он должен быть у ребёнка в любом случае — дома нужно доделывать домашние задания, и удобнее делать это на той же технике, на которой занимались на уроке.',
      },
      {
        q: 'Сколько детей в группе?',
        a: 'Не больше 6. Преподаватель успевает подойти к каждому, знает, на чём ребёнок застрял, и помогает разобраться, а не проходит тему «для всех сразу».',
      },
      {
        q: 'Как часто проходят занятия?',
        a: 'Есть два формата: 2 или 3 занятия в неделю. Три раза в неделю дают более быстрый прогресс, два удобнее, если у ребёнка плотный график.',
      },
      {
        q: 'Где проходят занятия и в какое время?',
        a: 'У нас три филиала в Астане: Кошкарбаева 10/1, ЖК Highvill, блок D6 (основной филиал, пробные уроки с 12:00 до 18:00); Туркестан 10 (группы с 11:00 до 15:00); Асфендиярова 5 (группы с 19:00 до 21:00).',
      },
      {
        q: 'Есть ли онлайн-формат?',
        a: 'Да, у нас есть отдельные онлайн-группы — актуальное расписание по направлениям уточняйте у администратора в WhatsApp. Но мы рекомендуем офлайн-формат: вживую ребёнку легче сосредоточиться, а преподаватель быстрее замечает, если что-то не получается.',
      },
      {
        q: 'На каком языке ведутся занятия?',
        a: 'Занятия проходят на русском и казахском языках.',
      },
    ],
  },
  location: {
    title: 'Адрес',
    cardTitle: '3 минуты пешком по Highvill',
    cta: 'Открыть на карте',
  },
  leadForm: {
    title: 'Записаться на пробный урок',
    subtitle: 'Свяжемся в течение рабочего дня. Обычно быстрее.',
    nameLabel: 'Имя',
    ageLabel: 'Возраст ребёнка',
    submit: 'Записаться на пробный урок',
    successTitle: 'Заявка принята',
    errorGeneric: 'Не удалось отправить. Попробуйте ещё раз или напишите в WhatsApp.',
    errorName: 'Введите имя',
    errorPhone: 'Введите номер телефона',
  },
  footer: {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
  },
  whatsapp: {
    fabMessage: 'Здравствуйте! Хочу узнать про курсы для ребёнка',
    footerMessage: 'Здравствуйте! Хочу узнать про курсы',
    studentWorksMessage: 'Здравствуйте! Хочу посмотреть примеры проектов учеников',
  },
};

const kk: typeof ru = {
  header: {
    login: 'Кіру',
  },
  languageNames: {
    ru: 'Русский',
    kk: 'Қазақша',
    en: 'English',
  },
  hero: {
    headline: 'Балаңыздың сәтті болашағын қамтамасыз ететін IT-мектеп',
    subtitle: 'Scratch, Roblox Studio, Python және нейрожелілер. Топта 6-ға дейін бала, аптасына 3 сабақ. Highvill, Астана.',
    cta: 'Ашық сабаққа жазылу',
    ctaHint: 'Алғашқы сабақ — тегін',
  },
  stats: {
    items: [
      { label: 'оқушыны оқыттық' },
      { label: 'бағыт: Scratch, Roblox, Python, сайттар, нейрожелілер' },
      { label: 'адам топта ең көбі' },
      { label: 'мұғалім әрдайым байланыста' },
    ],
  },
  courses: {
    title: 'Бағыттар',
    subtitle: 'Бағытты баланың жасы мен қызығушылығына қарай таңдаймыз',
    agesSuffix: 'жас',
    items: {
      scratch: {
        name: 'Scratch',
        explanation:
          'Мәтіннің орнына визуалды блоктармен жұмыс істейтін бірінші бағдарламалау тілі — бала бірінші сабақтан-ақ теорияны оқымай, ойын немесе мультфильм жасайды. Курс барысында ол логика, циклдар мен шарттарды «бағдарламалау» екенін байқамай-ақ үйренеді.',
      },
      roblox: {
        name: 'Roblox Studio',
        explanation:
          'Roblox-та Lua тілінде өз 3D-ойынын жасау — алғашқы локациядан достарын шақыруға болатын дайын ойынға дейін. Бала блоктардан нақты кодқа қадам жасайды, бірақ өзіне таныс, ойыншы ретінде жақсы білетін ортада.',
      },
      python: {
        name: 'Python',
        explanation:
          'Нағыз мәтіндік бағдарламалау тілі: синтаксис, деректер құрылымы, API-мен жұмыс. Оқушылар боттар, шағын ойындар мен утилиталар жазады — бұл оқу мысалы емес, шынымен жұмыс істейтін код.',
      },
      webdev: {
        name: 'Сайт әзірлеу',
        explanation:
          'HTML, CSS және JavaScript — беттерді бейнелеу, стильдер, қарапайым интерактивтілік. Курс соңында балада достарына сілтеме арқылы көрсетуге болатын өз сайты немесе лендингі болады.',
      },
      ai: {
        name: 'Нейрожелілер',
        explanation:
          'Заманауи нейрожелілерді саналы әрі пайдалы қолдану: оқу үшін ChatGPT пен Claude, музыка үшін Suno, видео мен аватар генерациясы. AI-дың жай «бот-пен сөйлесу» емес, нақты жобалар жасауға қалай көмектесетіні туралы 11 модуль.',
      },
    },
  },
  whyUs: {
    title: 'Неге біз',
    items: [
      { title: 'Топта 6-ға дейін бала', text: 'Мұғалім әр балаға үлгереді — 25 адамдық сыныптағыдай емес.' },
      { title: 'Портфолиода өз жобасы', text: 'Курстан кейін балада дайын ойын, сайт немесе бот қалады — күнделіктегі баға ғана емес.' },
      { title: 'Курстан кейін тәжірибе', text: 'Үздік оқушылар мектептік тәжірибеден өтіп, кіші топтарға көмектеседі.' },
      { title: 'Тәжірибелі мұғалімдер', text: 'Тек сабақ беріп қана қоймай, IT-де нақты жұмыс істейтін бағдарламашылар.' },
    ],
  },
  howItWorks: {
    title: 'Оқыту қалай өтеді',
    steps: [
      { title: 'Ашық сабақ', text: 'Тегін сабаққа келіңіз — бала байқап көреді, сіз сабақтың қалай өтетінін көресіз.' },
      { title: 'Топты таңдаймыз', text: 'Жасы мен деңгейіне қарай — 6-ға дейін адам, аптасына 3 сабақ.' },
      { title: 'Оқиды және жоба жасайды', text: 'Әр модуль тест емес, дайын жұмыспен — өз жобасымен аяқталады.' },
      { title: 'Нәтижесін көрсетеді', text: 'Жоба ата-анаға жеке кабинетте қолжетімді портфолиоға түседі.' },
    ],
  },
  studentWorks: {
    title: 'Оқушылардың жұмыстары',
    cta: 'Жобаны қарау',
    items: [
      {
        title: 'Scratch-те платформер',
        author: 'Әмір, 9 жаста',
        description: 'Бірнеше сабақта секіру, қарсыластар мен ұпай санағышы бар платформер жасады — алғашқы блоктан ойнауға болатын ойынға дейін.',
      },
      {
        title: 'Roblox Studio-да кафе симуляторы',
        author: 'Дана, 11 жаста',
        description: 'Кафенің 3D-локациясын құрды және Lua тілінде тапсырыс қабылдау скриптін жазды — достарын шақырып бірге ойнауға болады.',
      },
      {
        title: 'Python-да чат-бот',
        author: 'Тимур, 13 жаста',
        description: 'Сұрақтарға жауап беретін және санай алатын Python-да чат-бот жазды — шынымен жұмыс істейтін алғашқы коды.',
      },
      {
        title: 'Нейрожелімен сурет генераторы',
        author: 'Алия, 14 жаста',
        description: 'Өз жобасы үшін мәтіндік сипаттама бойынша иллюстрация генерациялауда нейрожеліні пайдалануды үйренді.',
      },
    ],
  },
  teachers: {
    title: 'Мұғалімдер',
    intro: 'Бұл — тәжірибелі бағдарламашылар: олар нақты жобаларда код жазады және сабаққа тек әдістемені емес, IT-де қазір нақты болып жатқанды алып келеді.',
    items: {
      almaz: { role: 'Fullstack-әзірлеуші', years: '10 жылдық тәжірибе' },
      aidana: { role: 'Python-әзірлеуші', years: '' },
      azamat: { role: 'Scratch, Roblox Studio', years: '' },
    },
  },
  testimonials: {
    title: 'Ата-аналардың пікірлері',
    cta: '2ГИС-тегі барлық пікірлерді қарау',
  },
  whatsIncluded: {
    title: 'Оқытуға не кіреді',
    items: [
      'Аптасына 3 сабақ, әрқайсысы 60 минут',
      'Мұғалім ретінде — тәжірибелі IT-маман',
      'Гарвард әдістемесі',
      'Жеке кабинеті бар меншікті платформа',
      'Мектептің өз валютасы — сабақтағы табыстары үшін коин',
      'Коиндерді сыйлыққа айырбастауға болатын дүкен',
      'Айына бір рет — шеберлік сабағы',
      'Мектептегі белсенді іс-шаралар',
    ],
  },
  faq: {
    title: 'Жиі қойылатын сұрақтар',
    items: [
      {
        q: 'Неше жастан бастауға болады?',
        a: '7 жастан. Бағытты жасына қарай таңдаймыз: 7–10 жасқа Scratch, 10–13 жасқа Roblox Studio, 13–15 жасқа Python, 10 жастан бастап нейрожелілер. Күмәндансаңыз, ашық сабақта мұғалім неден бастаған дұрыс екенін айтады.',
      },
      {
        q: 'Бала бұрын-соңды бағдарламаламаған. Ол үлгере ме?',
        a: 'Иә. Оқушыларымыздың көбі нөлден келеді. Scratch визуалды блоктарға негізделген, сондықтан бала алғашқы сабақтарда-ақ бірінші ойынын жасайды. Біз қарапайымнан бастап, біртіндеп күрделендіреміз.',
      },
      {
        q: 'Ашық сабақ қалай өтеді?',
        a: 'Алғашқы сабақ тегін. Бала өзінің бірінші шағын жобасын жасап көреді, ал сіз сабақтың қалай құрылғанын және баланызға форматтың сай келетінін көресіз. Ұзақтығы 60 минут. Кошкарбаев 10/1 (Highvill) филиалында кез келген күні 12:00-ден 18:00-ге дейін жазылуға болады.',
      },
      {
        q: 'Ата-ана сабақта отыра ала ма?',
        a: 'Дәлізде күте аласыз. Әдеттегі сабақтарда балалар өз бетінше жұмыс істегенде көбірек шоғырланады.',
      },
      {
        q: 'Бір сабақ қанша уақытқа созылады?',
        a: '60 минут.',
      },
      {
        q: 'Өз ноутбугі керек пе?',
        a: 'Иә, өз ноутбугі керек. Біз ноутбук баланың бәрібір болуы керек деп есептейміз — үйде үй тапсырмасын дәл сол техникада жалғастырған ыңғайлы.',
      },
      {
        q: 'Топта неше бала болады?',
        a: '6-дан аспайды. Мұғалім әр балаға үлгереді, баланың неден тоқтап қалғанын біледі және «барлығына бірдей» өтпей, түсінуге көмектеседі.',
      },
      {
        q: 'Сабақтар қаншалықты жиі өтеді?',
        a: 'Екі форматы бар: аптасына 2 немесе 3 сабақ. Үш рет апта сайын жылдамырақ прогресс береді, ал екі рет — баланың кестесі тығыз болса, ыңғайлырақ.',
      },
      {
        q: 'Сабақтар қайда және қай уақытта өтеді?',
        a: 'Астанада үш филиалымыз бар: Кошкарбаев 10/1, Highvill ЖК, D6 блогы (негізгі филиал, ашық сабақтар 12:00-ден 18:00-ге дейін); Түркістан 10 (топтар 11:00-ден 15:00-ге дейін); Асфендияров 5 (топтар 19:00-ден 21:00-ге дейін).',
      },
      {
        q: 'Онлайн формат бар ма?',
        a: 'Иә, бізде жеке онлайн-топтар бар — бағыттар бойынша нақты кестені WhatsApp арқылы әкімшіден біліп алыңыз. Бірақ біз офлайн форматты ұсынамыз: тірі сабақта балаға шоғырлану оңайырақ, ал мұғалім қиындықты тезірек байқайды.',
      },
      {
        q: 'Сабақтар қай тілде өтеді?',
        a: 'Сабақтар орыс және қазақ тілдерінде өтеді.',
      },
    ],
  },
  location: {
    title: 'Мекенжай',
    cardTitle: 'Highvill бойынша 3 минуттық жаяу жол',
    cta: 'Картадан ашу',
  },
  leadForm: {
    title: 'Ашық сабаққа жазылу',
    subtitle: 'Жұмыс күні ішінде хабарласамыз. Әдетте одан да тезірек.',
    nameLabel: 'Аты',
    ageLabel: 'Баланың жасы',
    submit: 'Ашық сабаққа жазылу',
    successTitle: 'Өтінім қабылданды',
    errorGeneric: 'Жіберу мүмкін болмады. Қайта көріңіз немесе WhatsApp-қа жазыңыз.',
    errorName: 'Атыңызды енгізіңіз',
    errorPhone: 'Телефон нөмірін енгізіңіз',
  },
  footer: {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
  },
  whatsapp: {
    fabMessage: 'Сәлеметсіз бе! Балама арналған курстар туралы білгім келеді',
    footerMessage: 'Сәлеметсіз бе! Курстар туралы білгім келеді',
    studentWorksMessage: 'Сәлеметсіз бе! Оқушылардың жоба мысалдарын қарағым келеді',
  },
};

const en: typeof ru = {
  header: {
    login: 'Log in',
  },
  languageNames: {
    ru: 'Русский',
    kk: 'Қазақша',
    en: 'English',
  },
  hero: {
    headline: 'The IT school where you secure your child’s successful future',
    subtitle: 'Scratch, Roblox Studio, Python and neural networks. Groups of up to 6, 3 lessons a week. Highvill, Astana.',
    cta: 'Book a trial lesson',
    ctaHint: 'The first lesson is free',
  },
  stats: {
    items: [
      { label: 'students already taught' },
      { label: 'tracks: Scratch, Roblox, Python, websites, AI' },
      { label: 'children max per group' },
      { label: 'teachers always reachable' },
    ],
  },
  courses: {
    title: 'Tracks',
    subtitle: 'We pick a track based on your child’s age and interests',
    agesSuffix: 'y.o.',
    items: {
      scratch: {
        name: 'Scratch',
        explanation:
          'A first programming language built on visual blocks instead of text — your child builds a game or animation from the very first lesson instead of reading theory. Over the course they pick up loops and conditions without even noticing it’s "programming".',
      },
      roblox: {
        name: 'Roblox Studio',
        explanation:
          'Building your own 3D games in Roblox with Lua — from a first location to a finished game you can invite friends to play. A step up from simple blocks to real code, inside an environment kids already know well as players.',
      },
      python: {
        name: 'Python',
        explanation:
          'A real text-based programming language: syntax, data structures, working with APIs. Students write bots, mini-games and small tools — code that actually runs and solves a problem, not a textbook exercise.',
      },
      webdev: {
        name: 'Web Development',
        explanation:
          'HTML, CSS and JavaScript — page layout, styling, simple interactivity. By the end of the course your child has their own personal website or landing page they can share with friends.',
      },
      ai: {
        name: 'Neural Networks',
        explanation:
          'How to use modern AI tools thoughtfully and productively: ChatGPT and Claude for schoolwork, Suno for music, video and avatar generation. 11 modules on how AI helps build real projects, not just "chat with a bot".',
      },
    },
  },
  whyUs: {
    title: 'Why us',
    items: [
      { title: 'Up to 6 kids per group', text: 'The teacher has time for every child — not like a class of 25.' },
      { title: 'A real project in the portfolio', text: 'After the course your child keeps a finished game, website or bot — not just a grade in a diary.' },
      { title: 'Internship after the course', text: 'Top students get a school internship and help run junior groups.' },
      { title: 'Practicing developers', text: 'Working developers who also teach — not just teachers reading about IT.' },
    ],
  },
  howItWorks: {
    title: 'How the learning works',
    steps: [
      { title: 'Trial lesson', text: 'Come to a free lesson — your child tries it out, you see how the lesson runs.' },
      { title: 'We pick a group', text: 'By age and level — a group of up to 6, 3 lessons a week.' },
      { title: 'Learns and builds a project', text: 'Every module ends with a project of their own — not a test, but finished work.' },
      { title: 'Shows the result', text: 'The project goes into a portfolio visible to the parent in the personal account.' },
    ],
  },
  studentWorks: {
    title: 'Student work',
    cta: 'See the project',
    items: [
      {
        title: 'A platformer in Scratch',
        author: 'Amir, 9 years old',
        description: 'Built a platformer with jumps, enemies and a score counter over a few lessons — from the first block to a playable game.',
      },
      {
        title: 'A café simulator in Roblox Studio',
        author: 'Dana, 11 years old',
        description: 'Built a 3D café location and wrote an order-taking script in Lua — friends can join in and play together.',
      },
      {
        title: 'A chatbot in Python',
        author: 'Timur, 13 years old',
        description: 'Wrote a Python chatbot that answers questions and can do basic maths — the first code that actually runs.',
      },
      {
        title: 'An AI image generator',
        author: 'Aliya, 14 years old',
        description: 'Learned to use an AI model to generate illustrations from a text prompt for her own project.',
      },
    ],
  },
  teachers: {
    title: 'Teachers',
    intro: 'These are practicing developers — they write code on real projects and bring what’s happening in IT right now to the lesson, not just a textbook.',
    items: {
      almaz: { role: 'Fullstack developer', years: '10 years in development' },
      aidana: { role: 'Python developer', years: '' },
      azamat: { role: 'Scratch, Roblox Studio', years: '' },
    },
  },
  testimonials: {
    title: 'Parent reviews',
    cta: 'See all reviews on 2GIS',
  },
  whatsIncluded: {
    title: 'What’s included',
    items: [
      '3 lessons a week, 60 minutes each',
      'A practicing IT specialist as the teacher',
      'A Harvard-based curriculum',
      'Our own learning platform with a personal account',
      'The school’s own currency — coins earned for progress',
      'A shop where coins can be exchanged for prizes',
      'A masterclass once a month',
      'Activities at the school',
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        q: 'From what age can a child start?',
        a: 'From age 7. We pick the track by age: Scratch for 7–10, Roblox Studio for 10–13, Python for 13–15, neural networks from age 10. If you’re not sure, the teacher will help you choose at the trial lesson.',
      },
      {
        q: 'My child has never coded before. Will they manage?',
        a: 'Yes. Most of our students start from zero. Scratch is built on visual blocks, so a child builds their first game within the very first lessons. We start simple and increase difficulty gradually.',
      },
      {
        q: 'How does the trial lesson work?',
        a: 'The first lesson is free. Your child tries building their first mini-project, and you get to see how the lesson is run and whether the format suits them. It lasts 60 minutes. You can book any day from 12:00 to 18:00 at the Koshkarbayeva 10/1 (Highvill) branch.',
      },
      {
        q: 'Can a parent stay in the room during the lesson?',
        a: 'You’re welcome to wait in the lobby. In regular lessons kids focus better when working on their own.',
      },
      {
        q: 'How long does one lesson last?',
        a: '60 minutes.',
      },
      {
        q: 'Does my child need their own laptop?',
        a: 'Yes, they’ll need their own laptop. We believe a child should have one anyway — homework needs to be finished at home, and it’s easier to do that on the same machine they use in class.',
      },
      {
        q: 'How many children are in a group?',
        a: 'No more than 6. The teacher has time to reach every child, knows exactly where each one is stuck, and helps them through it instead of teaching "to everyone at once".',
      },
      {
        q: 'How often are the lessons?',
        a: 'There are two formats: 2 or 3 lessons a week. Three times a week gives faster progress, two is more convenient for a busy schedule.',
      },
      {
        q: 'Where and when are the lessons held?',
        a: 'We have three branches in Astana: Koshkarbayeva 10/1, Highvill residential complex, block D6 (main branch, trial lessons 12:00–18:00); Turkestan 10 (groups 11:00–15:00); Asfendiyarova 5 (groups 19:00–21:00).',
      },
      {
        q: 'Is there an online format?',
        a: 'Yes, we have separate online groups — ask our administrator on WhatsApp for the current schedule by track. That said, we recommend the offline format: it’s easier for a child to focus in person, and the teacher notices sooner if something isn’t working.',
      },
      {
        q: 'What language are lessons taught in?',
        a: 'Lessons are taught in Russian and Kazakh.',
      },
    ],
  },
  location: {
    title: 'Address',
    cardTitle: 'A 3-minute walk within Highvill',
    cta: 'Open on the map',
  },
  leadForm: {
    title: 'Book a trial lesson',
    subtitle: 'We’ll get in touch within the business day. Usually faster.',
    nameLabel: 'Name',
    ageLabel: 'Child’s age',
    submit: 'Book a trial lesson',
    successTitle: 'Request received',
    errorGeneric: 'Couldn’t send it. Please try again or message us on WhatsApp.',
    errorName: 'Enter your name',
    errorPhone: 'Enter a phone number',
  },
  footer: {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
  },
  whatsapp: {
    fabMessage: 'Hello! I’d like to learn about courses for my child',
    footerMessage: 'Hello! I’d like to learn about the courses',
    studentWorksMessage: 'Hello! I’d like to see examples of student projects',
  },
};

export type Lang = 'ru' | 'kk' | 'en';
export type Dictionary = typeof ru;

export const LANGS: Lang[] = ['ru', 'kk', 'en'];
export const dictionaries: Record<Lang, Dictionary> = { ru, kk, en };
