import { createElement } from 'lwc';
import { subscribe } from 'lightning/empApi';
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

import sendMessage from '@salesforce/apex/ChatterMessengerController.sendMessage';
const mockSendMessage = require('./data/sendMessage.json');

import flushPromises from 'flush-promises';

jest.mock(
    '@salesforce/apex/ChatterMessengerController.sendMessage',
    () => {
        return {
            default: jest.fn()
        };
    },
    { virtual: true }
);

describe('c-chatter-messenger', () => {
    beforeEach(() => {
        //Add mock scrollIntoView function because it's not supported in jsdom yet.
        window.HTMLElement.prototype.scrollIntoView = function() {};
    });

    describe('Home', () => {
        afterEach(() => {
            //The jsdom instance is shared across test cases in a single file so reset the DOM
            while (document.body.firstChild) {
                document.body.removeChild(document.body.firstChild);
            }
            jest.clearAllMocks();
        });

        it('Renders home', () => {
            //Innitiate component
            const element = createElement('c-chatter-messenger', {
                is: ChatterMessenger
            });
            document.body.appendChild(element);

            const headerEl = element.shadowRoot.querySelector('header');
            expect(headerEl.classList).toContain('home');
        });

        it('Navigates to user-search screen', async () => {
            //Innitiate component
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
        });

        it('Renders conversation list', async () => {
            //Innitiate component
            const element = createElement('c-chatter-messenger', {
                is: ChatterMessenger
            });
            document.body.appendChild(element);

            //Mock Conversations
            getConversationsAdapter.emit(mockGetConversations);
            getConversationAdapter.emit(mockGetConversation);
            await flushPromises();

            //Assert that conversations are rendered
            const conversationEls = element.shadowRoot.querySelectorAll('div.conversation');
            expect(conversationEls).toHaveLength(3);
        });

        it('Navigates to conversation-detail screen', async () => {
            //Innitiate component
            const element = createElement('c-chatter-messenger', {
                is: ChatterMessenger
            });
            document.body.appendChild(element);

            //Mock Conversations
            getConversationsAdapter.emit(mockGetConversations);
            getConversationAdapter.emit(mockGetConversation);
            await flushPromises();

            //Query the first conversation
            const linkEl = element.shadowRoot.querySelector('div.conversation a');
            linkEl.click();
            await flushPromises();

            //Query header on the conversation
            const conversationDetailHeaderEl = element.shadowRoot.querySelector('header');
            expect(conversationDetailHeaderEl.classList).toContain('conversation-detail');
        });

        it('Receives a new message on home', async () => {
            //Mock conversations
            getConversationsAdapter.emit(mockGetConversations);
            getConversationAdapter.emit(mockGetConversation);
            await flushPromises();

            //Mock streaming
            const mockEvent = require('./data/event.json');
            const mockResponse = require('./data/subscribe.json');
            subscribe.mockImplementation((channel, replayId, onMessageCallback) => {
                onMessageCallback(mockEvent);
                return Promise.resolve(mockResponse);
            });

            //Innitiate component
            const element = createElement('c-chatter-messenger', {
                is: ChatterMessenger
            });
            document.body.appendChild(element);

            expect(subscribe.mock.calls[0][0]).toBe('/event/ChatterMessageEvent__e');
            expect(subscribe.mock.calls[0][1]).toBe(-1);
        });
    });

    describe('User-search', () => {
        let element;
        beforeEach(async () => {
            element = createElement('c-chatter-messenger', {
                is: ChatterMessenger
            });
            document.body.appendChild(element);

            //Navigates to user-search
            const navigateToUserSearchButtonEl = element.shadowRoot.querySelector('lightning-button-icon');
            navigateToUserSearchButtonEl.click();

            //Mock user search result
            searchUsersAdapter.emit(mockSearchUsers);
            await flushPromises();
        });

        afterEach(() => {
            while (document.body.firstChild) {
                document.body.removeChild(document.body.firstChild);
            }
            jest.clearAllMocks();
        });

        it('Navigates to home', async () => {
            //Query the first button on user-search screen
            const navigateToHomeButtonEl = element.shadowRoot.querySelector('lightning-button-icon');
            navigateToHomeButtonEl.click();
            await flushPromises();

            const homeHeaderEl = element.shadowRoot.querySelector('header');
            expect(homeHeaderEl.classList).toContain('home');
        });

        it('Searches user', async () => {
            //Search user
            const inputEl = element.shadowRoot.querySelector('lightning-input');
            inputEl.value = 'test';
            inputEl.dispatchEvent(new CustomEvent('change'));

            //Assert that users are rendered
            const userEls = element.shadowRoot.querySelectorAll('div.user');
            expect(userEls).toHaveLength(4);
        });

        it('Selects a recipient', async () => {
            //Select the first user
            const userLinkEl = element.shadowRoot.querySelector('div.user a');
            userLinkEl.click();
            await flushPromises();

            //Assert that a pill which has the selected user id is rendered
            const newRecipientEl = element.shadowRoot.querySelector('lightning-pill');
            expect(newRecipientEl).toBeDefined();
            expect(newRecipientEl.dataset.id).toBe(userLinkEl.dataset.id);
        });

        it('Removes a recipient', async () => {
            //Select the first user
            const userLinkEl = element.shadowRoot.querySelector('div.user a');
            userLinkEl.click();
            await flushPromises();

            const newRecipientEl = element.shadowRoot.querySelector('lightning-pill');
            //Remove the selected user
            newRecipientEl.dispatchEvent(new CustomEvent('remove'));
            await flushPromises();

            const removedRecipientsEl = element.shadowRoot.querySelector('lightning-pill');
            expect(removedRecipientsEl).toBeNull();
        });

        it('Navigates to the previous page from conversation-detail before sending a message', async () => {
            //Select the first user
            const userLinkEl = element.shadowRoot.querySelector('div.user a');
            userLinkEl.click();
            await flushPromises();

            //Navigate to a new conversation screen
            const startConversationButtonEl = element.shadowRoot.querySelectorAll('lightning-button-icon')[1];
            startConversationButtonEl.click();
            await flushPromises();

            //Previous page should be user-search screen
            const previousButtonEl = element.shadowRoot.querySelector('lightning-button-icon');
            previousButtonEl.click();
            await flushPromises();

            const headerEl = element.shadowRoot.querySelector('header');
            expect(headerEl.classList).toContain('user-search');
        });

        it('Starts a conversation', async () => {
            //Mock user search result and send message
            searchUsersAdapter.emit(mockSearchUsers);
            await flushPromises();

            //Select the first user
            const userLinkEl = element.shadowRoot.querySelector('div.user a');
            userLinkEl.click();
            await flushPromises();

            //Navigate to a new conversation screen
            const startConversationButtonEl = element.shadowRoot.querySelectorAll('lightning-button-icon')[1];
            startConversationButtonEl.click();
            await flushPromises();

            //Mock apex sendMessage() response
            sendMessage.mockResolvedValue(mockSendMessage);

            //Send a message
            const textareaEl = element.shadowRoot.querySelector('textarea');
            textareaEl.value = 'Hello!';
            textareaEl.dispatchEvent(new CustomEvent('input'));
            textareaEl.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13 }));

            //Assert that textarea is flushed after sending the message
            await flushPromises();
            expect(textareaEl.value).toBe('');
        });
    });

    describe('Conversation-detail', () => {
        let element;
        beforeEach(async () => {
            element = createElement('c-chatter-messenger', {
                is: ChatterMessenger
            });
            document.body.appendChild(element);

            //Mock Conversations
            getConversationsAdapter.emit(mockGetConversations);
            getConversationAdapter.emit(mockGetConversation);
            await flushPromises();

            //Query the first conversation and navigates to the conversation detail
            const linkEl = element.shadowRoot.querySelector('div.conversation a');
            linkEl.click();
            await flushPromises();
        });

        afterEach(() => {
            while (document.body.firstChild) {
                document.body.removeChild(document.body.firstChild);
            }
            jest.clearAllMocks();
        });

        it('Navigates to home', async () => {
            //Navigates to home
            const previousButtonEl = element.shadowRoot.querySelector('lightning-button-icon');
            previousButtonEl.click();
            await flushPromises();

            //Assert that home is rendered
            const homeHeaderEl = element.shadowRoot.querySelector('header');
            expect(homeHeaderEl.classList).toContain('home');
        });

        it('Replies to the message', async () => {
            const textareaEl = element.shadowRoot.querySelector('textarea');
            textareaEl.value = 'How are you?';
            textareaEl.dispatchEvent(new CustomEvent('input'));
            textareaEl.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13 }));

            await flushPromises();
            expect(textareaEl.value).toBe('');
        });

        it('Receives a new message on conversation-detail', async () => {
            //TODO: Call onMessageCallback again after component rendered;
        });
    });
});
