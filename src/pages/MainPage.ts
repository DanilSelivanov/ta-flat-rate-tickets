import { Locator, Page } from '@playwright/test';

const SELECTORS = {
  quantitySelector: 'div.input-group',
  increaseTicketAmount: 'button.input-group-addon.btn.increment',
  decreaseTicketAmount: 'button.input-group-addon.btn.decrement',
  ticketInformation: 'button.syos-lineitem__title',
  priceInformation: 'span.syos-price__value',
  backButton: 'div.syos-back-button',
  modalWindowConfirm: 'div.syos-modal',
};

type PriceZone =
  | 'Any Best Available Seat'
  | 'Front Orchestra'
  | 'Orchestra'
  | 'Orchestra E/W'
  | 'Terrace'
  | 'Balcony';

export default class MainPage {
  constructor(private page: Page) {}

  async addSeats(quantity: number): Promise<void> {
    await this.page.waitForSelector(SELECTORS.quantitySelector);
    await this.page.dblclick(SELECTORS.decreaseTicketAmount);
    await this.page.click(SELECTORS.increaseTicketAmount, {
      clickCount: quantity,
    });
  }

  async selectSection(section: string) {
    await this.page.getByLabel(section, { exact: true }).first().hover();
    await this.page.getByLabel(section, { exact: true }).first().click();
  }

  async selectPriceZone(type: PriceZone): Promise<void> {
    const containerLocator = `//div[@class='syos-level-selector-price-types__item__contents']`;
    const typeLocator = `${containerLocator}//span[text()='${type}']`;
    const notAvailableLocator = `${typeLocator}//span[text()='.No Available.']`;
    await this.page.waitForSelector(containerLocator);
    const typeElement = await this.page.waitForSelector(typeLocator);
    if (!typeElement) {
      throw new Error(`Price zone '${type}' not found.`);
    }
    const noAvailableElement = await typeElement.$(
      'xpath=' + notAvailableLocator
    );
    if (noAvailableElement) {
      throw new Error(`Price zone '${type}' is not available.`);
    }
    await typeElement.click();
  }

  continueButton: Locator = this.page.getByRole('button', {
    name: 'Continue',
    exact: true,
  });

  confirmButton: Locator = this.page.getByRole('button', {
    name: 'Confirm seats',
    exact: true,
  });

  async getTicketInformation(): Promise<{
    seat: string;
    price: string;
  }> {
    return {
      seat: (
        await this.page.locator(SELECTORS.ticketInformation).innerText()
      ).trim(),
      price: (await this.page.locator(SELECTORS.priceInformation).innerText())
        .trim()
        .replace('$', ''),
    };
  }

  async getActiveSections(): Promise<string[]> {
    const allSectionsLocators = await this.page.$$('text.st0.st1');
    const unavailableSectionsLocator = await this.page.$$('text.unavailable');
    const allSections: string[] = [];
    const unavailableSections: string[] = ['Terrace View', 'Organ', 'Stage']; //unbookable by default
    for (const label of allSectionsLocators) {
      allSections.push((await label.textContent()) as unknown as string);
    }
    for (const label of unavailableSectionsLocator) {
      unavailableSections.push(
        (await label.textContent()) as unknown as string
      );
    }
    const activeSections: string[] = allSections.filter(
      (item) => !unavailableSections.includes(item)
    );

    return activeSections;
  }

  async getUnavailableSections(): Promise<string[]> {
    const unavailableSections: string[] = [];
    const unavailableSectionsLocator = await this.page.$$('text.unavailable');
    for (const label of unavailableSectionsLocator) {
      unavailableSections.push(
        (await label.textContent()) as unknown as string
      );
    }
    return unavailableSections;
  }

  async getBackToMenu() {
    await this.page.click(SELECTORS.backButton);
    await this.page.waitForSelector(SELECTORS.modalWindowConfirm);
    await this.page
      .getByRole('button', {
        name: 'Confirm',
        exact: true,
      })
      .click();
  }
}
