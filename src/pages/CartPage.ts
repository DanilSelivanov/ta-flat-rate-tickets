import { Page } from '@playwright/test';

const SELECTORS = {
  seatInformation: '(//div[@class="performance"])[1]',
  priceInformation: 'td.price',
  quantityInformation: 'td.quantity',
  popupDonation: '#targetDonationHolder',
};

export default class CartPage {
  constructor(private page: Page) {}

  async handlePopup(): Promise<void> {
    if (await this.page.locator(SELECTORS.popupDonation).isVisible()) {
      await this.page.getByRole('link', { name: 'Skip', exact: true }).click();
    }
  }

  async getTicketInformation(): Promise<{
    seat: string;
    price: string;
    seatQuantity: string;
  }> {
    const seatInformation = (await this.page
      .locator(SELECTORS.seatInformation)
      .last()
      .textContent()) as string;
    const match: RegExpMatchArray | null =
      seatInformation.match(/WDCH - ([^\n]+)/); //find the first match in the item string.
    const extractedSeat: string = match![1].trim().replace(' - ', ' '); //use .split(' - ')[1] instead of replace() if only seat number is needed;
    return {
      seat: extractedSeat,
      price: Number(
        (await this.page
          .locator(SELECTORS.priceInformation)
          .getAttribute('data-price')) as string
      )
        .toFixed(2)
        .toString(),
      seatQuantity: (
        await this.page.locator(SELECTORS.quantityInformation).innerText()
      ).trim(),
    };
  }
}
