import { LightningElement, track, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import chatterMessengerStyle from '@salesforce/resourceUrl/chatterMessengerStyle';
import { loadStyle } from 'lightning/platformResourceLoader';
import searchUsers from '@salesforce/apex/ChatterMessengerController.searchUsers';
import getConversations from '@salesforce/apex/ChatterMessengerController.getConversations';
import getConversation from '@salesforce/apex/ChatterMessengerController.getConversation';
import sendMessage from '@salesforce/apex/ChatterMessengerController.sendMessage';
import replyToMessage from '@salesforce/apex/ChatterMessengerController.replyToMessage';

export default class ChatterMessenger extends LightningElement {
    connectedCallback() {
        Promise.all([loadStyle(this, chatterMessengerStyle + '/style.css')]);
    }

    renderedCallback() {
        if (this.showsConversation) {
            this.template.querySelector(".container").scrollIntoView(false);
        }
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

    get formattedRecipientNames() {
        if (this.conversationId) {
            for (let c of this.conversations) {
                if (c.id === this.conversationId) {
                    return c.formattedRecipientNames;
                }
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
    }

    sendMessage() {
        if (this.conversationId) {
            replyToMessage({ text: this.newMessage, msgId: this.messages[this.messages.length - 1].id })
                .then(() => {
                    this.newMessage = '';
                    refreshApex(this.wiredMessagesResult);
                })
                .catch(error => {
                    console.log('error occurred sending message : ' + JSON.stringify(error));
                })
        } else {
            let newRecipientIds = '';
            for (let r of this.newRecipients) {
                newRecipientIds += r.id + ',';
            }
            newRecipientIds = newRecipientIds.slice(0, -1); //Remove the last comma
            sendMessage({ text: this.newMessage, recipients: newRecipientIds })
                .then(result => {
                    this.newMessage = '';
                    this.conversationId = result.conversationId;
                    refreshApex(this.wiredMessagesResult);
                })
                .catch(error => {
                    console.log('error occurred sending message : ' + JSON.stringify(error));
                })
        }
    }

    refreshConversation() {
        refreshApex(this.wiredMessagesResult);
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
        const keyword = event.target.value
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
        for (let u of this.newRecipients) {
            if (u.id === event.target.dataset.id) {
                return;
            }
        }
        //Add user to new recipient list 
        for (let u of this.users) {
            if (u.id === event.target.dataset.id) {
                this.newRecipients.push(u);
                break;
            }
        }
    }

    removeFromNewRecipients(event) {
        this.newRecipients = this.newRecipients.filter(u => {
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
        this.userSearchKeyword = '';
        this.newRecipients = [];
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