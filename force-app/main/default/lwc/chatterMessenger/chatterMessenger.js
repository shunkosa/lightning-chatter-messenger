import { LightningElement, track, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { subscribe, onError } from 'lightning/empApi';
import searchUsers from '@salesforce/apex/ChatterMessengerController.searchUsers';
import getConversations from '@salesforce/apex/ChatterMessengerController.getConversations';
import getConversation from '@salesforce/apex/ChatterMessengerController.getConversation';
import sendMessage from '@salesforce/apex/ChatterMessengerController.sendMessage';
import replyToMessage from '@salesforce/apex/ChatterMessengerController.replyToMessage';
import publishNewMessageEvent from '@salesforce/apex/ChatterMessengerController.publishNewMessageEvent';

export default class ChatterMessenger extends LightningElement {
    connectedCallback() {
        const messageCallback = (response) => {
            const receivedConversationId = response.data.payload.conversationId__c;
            const receivedMessageId = response.data.payload.messageId__c;
            if (
                this.conversationId &&
                this.conversationId === receivedConversationId &&
                this.messages[0].id !== receivedMessageId
            ) {
                //Refresh in the ongoing conversation detail
                refreshApex(this.wiredMessagesResult);
            } else if (this.conversations.some((c) => c.id === receivedConversationId)) {
                //Refresh in the users' home
                refreshApex(this.wiredConversationsResult);
            }
        };

        subscribe('/event/ChatterMessageEvent__e', -1, messageCallback).then((response) => {
            console.log('Successfully subscribed to : ', JSON.stringify(response.channel));
        });
    }

    renderedCallback() {
        if (this.showsConversation) {
            if (!this.messagesLoaded && this.messages.length > 0) {
                this.messagesLoaded = true;
                if (this.getSelectedConversationDetail().latestMessageId !== this.getLatestMessageId()) {
                    refreshApex(this.wiredMessagesResult);
                }
                this.template.querySelector('.container').scrollIntoView(false);
            }
        } else if (this.showsHome) {
            this.template.querySelector('.container').scrollIntoView(true);
        }
    }

    registerErrorListener() {
        onError((error) => {
            console.log('Received error from server: ', JSON.stringify(error));
        });
    }

    //Home (Conversation list)
    wiredConversationsResult; //Wired Apex result so it can be refreshed programmatically
    @track conversations = [];
    @wire(getConversations)
    wiredConversations(result) {
        this.wiredConversationsResult = result;
        if (result.data) {
            this.conversations = result.data;
        }
    }

    //Conversation Detail (Message List)
    @track conversationId = '';
    @track messages = [];
    messagesLoaded = false;
    wiredMessagesResult; //Wired Apex result so it can be refreshed programmatically
    @wire(getConversation, { convId: '$conversationId' })
    wiredMessages(result) {
        this.wiredMessagesResult = result;
        if (result.data) {
            this.messages = [];
            for (let m of result.data) {
                this.messages.unshift(m);
            }
        } else if (result.error) {
            console.log(result.error);
        }
    }

    getSelectedConversationDetail() {
        return this.conversations.find((c) => c.id === this.conversationId);
    }

    getLatestMessageId() {
        return this.messages[this.messages.length - 1].id;
    }

    get formattedRecipientNames() {
        if (this.conversationId) {
            const c = this.getSelectedConversationDetail();
            if (c) {
                return c.formattedRecipientNames;
            }
        }
        let result = '';
        for (let r of this.newRecipients) {
            result += r.name + ', ';
        }
        result = result.slice(0, -2); //Remove the last comma
        return result;
    }

    //New Message
    @track newMessage = '';
    handleChangeNewMessage(event) {
        this.newMessage = event.target.value;
        //Auto-resize
        let offset = event.target.offsetHeight - event.target.clientHeight;
        event.target.style.height = 'auto';
        event.target.style.height = event.target.scrollHeight + offset + 'px';
    }

    handleKeyDown(event) {
        if (event.keyCode === 13 && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    sendMessage() {
        if (this.conversationId) {
            //Reply
            const msgId = this.getLatestMessageId();
            replyToMessage({ text: this.newMessage, msgId: msgId })
                .then(() => {
                    this.handleAfterSend(msgId);
                })
                .catch((error) => {
                    console.log('Error occurred while sending message : ' + JSON.stringify(error));
                });
        } else {
            //New conversation
            let newRecipientIds = '';
            for (let r of this.newRecipients) {
                newRecipientIds += r.id + ',';
            }
            newRecipientIds = newRecipientIds.slice(0, -1); //Remove the last comma
            sendMessage({ text: this.newMessage, recipients: newRecipientIds })
                .then((result) => {
                    this.conversationId = result.conversationId;
                    this.handleAfterSend(result.id);
                    this.messagesLoaded = true;
                })
                .catch((error) => {
                    console.log('Error occurred while sending message : ' + JSON.stringify(error));
                });
        }
    }

    handleAfterSend(messageId) {
        this.newMessage = '';
        this.template.querySelector('.message-textarea').value = '';
        refreshApex(this.wiredMessagesResult);
        publishNewMessageEvent({
            conversationId: this.conversationId,
            messageId: messageId
        }).catch((error) => {
            console.log('Error occurred while publishing event : ' + JSON.stringify(error));
        });
    }

    //Search User
    @track userSearchKeyword = '';
    @track users = [];
    @wire(searchUsers, { query: '$userSearchKeyword' })
    wiredUsers(result) {
        if (result.data) {
            this.users = result.data;
        } else if (result.error) {
            console.log(result.error);
        }
    }

    handleChangeUserSearchKeyword(event) {
        window.clearTimeout(this.delayTimeout);
        const keyword = event.target.value;
        this.delayTimeout = setTimeout(() => {
            this.userSearchKeyword = keyword;
        }, 300);
    }

    @track newRecipients = [];
    @track isOverfilled = false;

    get hasNewRecipients() {
        return this.newRecipients.length > 0;
    }

    addNewRecipients(event) {
        if (this.newRecipients.length >= 9) {
            this.isOverfilled = true;
            return;
        }
        //Do nothing if the selected user is already in new recipient list
        if (this.newRecipients.some((u) => u.id === event.target.dataset.id)) {
            return;
        }
        //Add user to new recipient list
        this.newRecipients.push(this.users.find((u) => u.id === event.target.dataset.id));
    }

    removeFromNewRecipients(event) {
        this.newRecipients = this.newRecipients.filter((u) => {
            return u.id !== event.target.dataset.id;
        });
        if (this.newRecipients.length < 9) {
            this.isOverfilled = false;
        }
    }

    //Navigation
    @track showsHome = true;
    @track showsConversation = false;
    @track showsUserSearchForm = false;

    navigateToHome() {
        this.showsHome = true;
        this.showsConversation = false;
        this.showsUserSearchForm = false;
        this.conversationId = '';
        this.userSearchKeyword = '';
        this.newRecipients = [];
        this.messagesLoaded = false;
        refreshApex(this.wiredConversationsResult);
    }

    navigateToConversation(event) {
        this.showsHome = false;
        this.showsConversation = true;
        this.showsUserSearchForm = false;
        this.conversationId = event.target.dataset.id;
    }

    navigateToUserSearchForm() {
        this.showsHome = false;
        this.showsConversation = false;
        this.showsUserSearchForm = true;
    }

    navigateToPreviousPage() {
        if (this.conversationId) {
            this.navigateToHome();
        } else {
            this.navigateToUserSearchForm();
        }
    }
}
