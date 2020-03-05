import { createElement } from 'lwc';
import ChatterMessenger from 'c/chatterMessenger';
import flushPromises from 'flush-promises';

describe('Navigation', () => {
    beforeEach(() => {
        //Add mock scrollIntoView function because it's not supported in jsdom yet.
        window.HTMLElement.prototype.scrollIntoView = function() {};
    });

    afterEach(() => {
        //The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('Render Home', () => {
        const element = createElement('c-chatter-messenger', {
            is: ChatterMessenger
        });
        document.body.appendChild(element);
        const headerEl = element.shadowRoot.querySelector('header');
        expect(headerEl.classList).toContain('home');
    });

    it('Navigation between Home and User Search', async () => {
        const element = createElement('c-chatter-messenger', {
            is: ChatterMessenger
        });
        document.body.appendChild(element);
        //Query button on Home
        const navigateToUserSearchButtonEl = element.shadowRoot.querySelector('lightning-button-icon');
        navigateToUserSearchButtonEl.click();
        await flushPromises();

        //Query header on Search user screen
        const userSearchHeaderEl = element.shadowRoot.querySelector('header');
        expect(userSearchHeaderEl.classList).toContain('user-search');

        //Query first button on Search user screen
        const navigateToHomeButtonEl = element.shadowRoot.querySelector('lightning-button-icon');
        navigateToHomeButtonEl.click();
        await flushPromises();

        const homeHeaderEl = element.shadowRoot.querySelector('header');
        expect(homeHeaderEl.classList).toContain('home');
    });
});
