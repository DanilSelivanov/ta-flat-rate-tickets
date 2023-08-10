import { test, expect } from '@playwright/test';
import CartPage from '../src/pages/CartPage';
import MainPage from '../src/pages/MainPage';
import * as _ from 'lodash';

require('dotenv').config({ path: './.env' });

test.describe('Automation test that covers the following scenarios.', () => {
  const url = 'en/syos2/package/' + String(process.env.SITE_EVENT);

  test('Scenario 1', async ({ page }) => {
    const mainPage = new MainPage(page);

    const seatQuantity = 2;
    let sectionStatementA: string[] = [];
    let sectionStatementB: string[] = [];
    let sectionStatementC: string[] = [];

    await test.step('Navigate to the site', async () => {
      await page.goto(`./${url}`, { waitUntil: 'load' });
    });

    await test.step('Add 2 Standart seats:', async () => {
      await mainPage.addSeats(seatQuantity);
    });

    for (const section of await mainPage.getActiveSections()) {
      await test.step(`Select ${section} section`, async () => {
        await mainPage.selectSection(section);
      });

      await test.step(`Collect information about ${section} section`, async () => {
        sectionStatementC = await mainPage.getUnavailableSections();
        await mainPage.continueButton.click();
        page.on('dialog', async (dialog) => {
          sectionStatementB.push(section);
          await dialog.dismiss();
        });
        if (await mainPage.confirmButton.isVisible()) {
          sectionStatementA.push(section);
          await mainPage.getBackToMenu();
        }
      });
    }

    await test.step('Final report', async () => {
      console.log(
        'how many sections were active:' +
          (await mainPage.getActiveSections()).length
      );
      console.log(
        'section met the requirement a:' + sectionStatementA.toString()
      );
      console.log(
        'section met the requirement b:',
        sectionStatementB.toString()
      );
      console.log(
        'section met the requirement c:',
        sectionStatementC.toString()
      );
    });
  });

  test('Scenario 2', async ({ page }) => {
    const mainPage = new MainPage(page);
    const cartPage = new CartPage(page);
    let bookedTicketInfo: any;

    const seatQuantity = 1;

    await test.step('Navigate to the site', async () => {
      await page.goto(`./${url}`, { waitUntil: 'load' });
    });

    await test.step('Select "Any Best Available Seat", then click "Continue"', async () => {
      await mainPage.selectPriceZone('Any Best Available Seat');
      await mainPage.addSeats(seatQuantity);
      await mainPage.continueButton.click();
    });

    await test.step('Select one seat and click "Confirm Seats"', async () => {
      await mainPage.confirmButton.waitFor({ state: 'visible' });
      bookedTicketInfo = await mainPage.getTicketInformation();
      await mainPage.confirmButton.click();
    });

    await test.step('On the cart page: verify the quantity, price, and seat information is correct', async () => {
      await page.waitForURL('/en/booking/basket', {
        waitUntil: 'domcontentloaded',
      });
      await cartPage.handlePopup();
      expect(
        _.set(bookedTicketInfo, 'seatQuantity', seatQuantity.toString())
      ).toEqual(await cartPage.getTicketInformation());
    });
  });
});
