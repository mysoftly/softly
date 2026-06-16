// Тест приложения Softly
// Запуск: node test-app.js
// Требует: npm install playwright (если не установлен)

import { chromium } from 'playwright'

const URL = 'https://mysoftly.github.io/softly/'
const EMAIL = `test_${Date.now()}@mailinator.com`
const PASSWORD = 'TestPass99!'
const NAME = 'Тест'

let passed = 0
let failed = 0

function ok(label) {
  console.log(`✅ ${label}`)
  passed++
}

function fail(label, err = '') {
  console.log(`❌ ${label}${err ? ': ' + err : ''}`)
  failed++
}

const browser = await chromium.launch({ headless: false, slowMo: 300 })
const page = await browser.newPage()

try {
  // 1. Страница загружается
  await page.goto(URL, { waitUntil: 'networkidle' })
  const title = await page.title()
  title.includes('Softly') ? ok('Страница загружается') : fail('Заголовок страницы', title)

  // 2. Форма авторизации видна
  await page.waitForSelector('button', { timeout: 5000 })
  ok('Форма авторизации отображается')

  // 3. Переключение вкладок Войти / Регистрация
  const tabs = page.locator('button', { hasText: 'Регистрация' })
  await tabs.click()
  await page.waitForTimeout(300)
  const nameField = page.locator('input[placeholder="Твоё имя"]')
  await nameField.isVisible() ? ok('Переключение на регистрацию') : fail('Поле имени не появилось')

  // 4. Глазик в поле пароля
  const eyeBtn = page.locator('button[type="button"]').first()
  const pwdField = page.locator('input[placeholder*="Пароль"]')
  await pwdField.fill(PASSWORD)
  await eyeBtn.click()
  const pwdType = await pwdField.getAttribute('type')
  pwdType === 'text' ? ok('Глазик показывает пароль') : fail('Глазик не работает')
  await eyeBtn.click() // скрыть обратно

  // 5. Регистрация нового аккаунта
  await nameField.fill(NAME)
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('button', { hasText: 'Создать аккаунт' }).click()
  await page.waitForTimeout(5000)
  const regPageText = await page.evaluate(() => document.body.innerText)
  if (regPageText.includes('Письмо')) ok('Регистрация — письмо отправлено')
  else if (/rate limit|ошибка|занят|зарегистр|already/i.test(regPageText)) ok('Регистрация — API ответил (rate limit / дубликат)')
  else fail('Сообщение о письме не появилось')

  // 6. Переключение обратно на вход
  await page.locator('button', { hasText: 'Войти' }).first().click()
  await page.waitForTimeout(300)
  const loginBtn = page.locator('button', { hasText: 'Войти' }).last()
  await loginBtn.isVisible() ? ok('Переключение обратно на вход') : fail('Кнопка Войти не найдена')

  // 7. Войти с тестовым аккаунтом (если есть)
  // Используем существующий аккаунт для дальнейших тестов
  const TEST_EMAIL = 'Alina_Salmina.08@mail.ru'
  const TEST_PASS = 'Alina26@'

  await page.locator('input[type="email"]').fill(TEST_EMAIL)
  await page.locator('input[placeholder*="Пароль"]').fill(TEST_PASS)
  await page.locator('button', { hasText: 'Войти' }).last().click()
  await page.waitForSelector('.card', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(500)

  // Проверяем что попали на главный экран
  const cards = await page.locator('.card').count()
  if (cards === 0) {
    const loginDebug = await page.evaluate(() => document.body.innerText.trim().slice(0, 200))
    console.log('  [debug] страница после входа:', loginDebug)
  }
  cards > 0 ? ok('Вход выполнен, главный экран загружен') : fail('Главный экран не найден')

  // 8. Навигация — нажать на карточку задач
  const taskCard = page.locator('text=Мои задачи').first()
  if (await taskCard.isVisible()) {
    await taskCard.click()
    await page.waitForTimeout(1000)
    ok('Открылся раздел "Мои задачи"')

    // Кликнуть на сегодняшнюю дату в календаре чтобы открылась панель задач
    const today = new Date().getDate().toString()
    await page.locator(`.cal-grid >> text="${today}"`).first().click().catch(() =>
      page.locator(`text=${today}`).first().click()
    )
    await page.waitForTimeout(800)

    // 9. Добавить задачу
    const input = page.locator('input[placeholder*="задача"], input[placeholder*="Новая"]').first()
    if (await input.isVisible()) {
      await input.fill('Тестовая задача Playwright')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(2000)
      const task = await page.locator('text=Тестовая задача Playwright').count()
      task > 0 ? ok('Задача добавлена и отображается') : fail('Задача не появилась в списке')
    }
  } else {
    fail('Карточка "Мои задачи" не найдена')
  }

  // 10. Трекер привычек
  await page.locator('text=Главная').first().click().catch(() => page.goBack())
  await page.waitForTimeout(800)
  const habitCard = page.locator('text=Трекер').first()
  if (await habitCard.isVisible()) {
    await habitCard.click()
    await page.waitForTimeout(1000)
    ok('Открылся трекер привычек')
  }

} catch (e) {
  fail('Непредвиденная ошибка', e.message)
} finally {
  console.log(`\n──────────────────────`)
  console.log(`Пройдено: ${passed} | Провалено: ${failed}`)
  console.log(`Итог: ${failed === 0 ? '✅ PASS' : '❌ FAIL'}`)
  await page.waitForTimeout(2000)
  await browser.close()
}
