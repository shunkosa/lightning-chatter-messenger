import { createElement } from 'lwc';
import ChatterMessenger from 'c/chatterMessenger';
import { registerApexTestWireAdapter } from '@salesforce/sfdx-lwc-jest';

import getConversations from '@salesforce/apex/ChatterMessengerController.getConversations';
const mockGetConversations = require('./data/getConversations.json');
const getConversationsAdapter = registerApexTestWireAdapter(getConversations);

import getConversation from '@salesforce/apex/ChatterMessengerController.getConversation';
const mockGetConversation = require('./data/getConversation.json');
const getConversationAdapter = registerApexTestWireAdapter(getConversation);

import searchUsers from '@salesforce/apex/ChatterMessengerController.searchUsers';
const mockSearchUsers = require('./data/searchUsers.json');
const searchUsersAdapter = registerApexTestWireAdapter(searchUsers);

import flushPromises from 'flush-promises';

describe('c-chatter-messenger', () => {
    beforeEach(() => {
        //Add mock scrollIntoView function because it's not supported in jsdom yet.
        window.HTMLElement.prototype.scrollIntoView = function() {};
    });

    afterEach(() => {
        //The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('Renders home', () => {
        const element = createElement('c-chatter-messenger', {
            is: ChatterMessenger
        });
        document.body.appendChild(element);
        const headerEl = element.shadowRoot.querySelector('header');
        expect(headerEl.classList).toContain('home');
    });

    it('Navigates between home and user-search', async () => {
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

        //Query the first button on Search user screen
        const navigateToHomeButtonEl = element.shadowRoot.querySelector('lightning-button-icon');
        navigateToHomeButtonEl.click();
        await flushPromises();

        const homeHeaderEl = element.shadowRoot.querySelector('header');
        expect(homeHeaderEl.classList).toContain('home');
    });

    it('Searches user and starts a conversation', async () => {
        const element = createElement('c-chatter-messenger', {
            is: ChatterMessenger
        });
        document.body.appendChild(element);

        searchUsersAdapter.emit(mockSearchUsers);
        //Navigate to User search
        const navigateToUserSearchButtonEl = element.shadowRoot.querySelector('lightning-button-icon');
        navigateToUserSearchButtonEl.click();
        await flushPromises();

        //Assert that navigated to the user search screen and users are rendered
        const userEls = element.shadowRoot.querySelectorAll('div.user');
        expect(userEls).toHaveLength(4);

        //Select the first user
        const userLinkEl = element.shadowRoot.querySelector('div.user a');
        userLinkEl.click();
        await flushPromises();

        //Assert that a pill which has the selected user id is rendered
        const newRecipientEl = element.shadowRoot.querySelector('lightning-pill');
        expect(newRecipientEl).toBeDefined();
        expect(newRecipientEl.dataset.id).toBe(userLinkEl.dataset.id);

        //Start a conversation
        const startConversationButtonEl = element.shadowRoot.querySelectorAll('lightning-button-icon')[1];
        startConversationButtonEl.click();
        await flushPromises();

        const textareaEl = element.shadowRoot.querySelector('textarea');
        textareaEl.value = 'Hello!';

        const sendButtonEl = element.shadowRoot.querySelector('lightning-button-icon.send-message');
        expect(sendButtonEl).toBeDefined();
        sendButtonEl.click();
    });

    it('Navigates between home and conversation-detail', async () => {
        const element = createElement('c-chatter-messenger', {
            is: ChatterMessenger
        });
        document.body.appendChild(element);

        getConversationsAdapter.emit(mockGetConversations);
        getConversationAdapter.emit(mockGetConversation);
        await flushPromises();

        const conversationEls = element.shadowRoot.querySelectorAll('div.conversation');
        expect(conversationEls).toHaveLength(3);

        //Query the first conversation
        const linkEl = element.shadowRoot.querySelector('div.conversation a');
        linkEl.click();
        await flushPromises();

        //Query header on Conversation
        const conversationDetailHeaderEl = element.shadowRoot.querySelector('header');
        expect(conversationDetailHeaderEl.classList).toContain('conversation-detail');

        //Back to home
        const previousButtonEl = element.shadowRoot.querySelector('lightning-button-icon');
        previousButtonEl.click();
        await flushPromises();

        const homeHeaderEl = element.shadowRoot.querySelector('header');
        expect(homeHeaderEl.classList).toContain('home');
    });
});
