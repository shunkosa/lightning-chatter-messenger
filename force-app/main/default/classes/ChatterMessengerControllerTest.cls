@isTest
private class ChatterMessengerControllerTest {
    @isTest(SeeAllData=true) public static void testChatterMessenger(){
        String userDomain = System.URL.getOrgDomainUrl().toExternalForm().removeStart('https://');
        System.assert(userDomain.contains('.my.'), 'My Domain is not enabeled');

        Profile p = [Select Id, Name FROM Profile where (UserType = 'Standard' AND PermissionsCustomizeApplication = true)][0];
        User u = new User(
            UserName = 'test@' + userDomain,
            Email = 'test@' + userDomain,
            LastName = 'test',
            Alias = 'test',
            TimeZoneSidKey = 'America/Los_Angeles',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'ISO-8859-1',
            LanguageLocaleKey = 'en_US',
            ProfileId = p.Id
        );
        insert u;

        ConnectApi.UserPage allInternalChatterUsers = ConnectApi.ChatterUsers.getUsers(null);
        ConnectApi.UserPage mockUserSearchResult = new ConnectApi.UserPage();
        mockUserSearchResult.users = new List<ConnectApi.UserDetail>();
        for(ConnectApi.UserDetail chatterUser : allInternalChatterUsers.users){
            if(chatterUser.username.equals('test@' + userDomain)){
                mockUserSearchResult.users.add(chatterUser);
                break;
            }
        } 
        ConnectApi.ChatterUsers.setTestSearchUsers(null, 'test', mockUserSearchResult);
        List<ChatterMessengerController.User> users = ChatterMessengerController.searchUsers('test');
        System.assert(users.get(0).id.equals(u.id), 'Failed to search users');

        System.assert(ChatterMessengerController.getConversation('').isEmpty(), 'Failed to initialize conversation');

        ChatterMessengerController.Message msg = ChatterMessengerController.sendMessage('test', String.valueOf(u.Id));
        System.assert(ChatterMessengerController.getConversations().size() >= 1, 'Failed to retrieve conversations');
        System.assert(ChatterMessengerController.getConversation(msg.conversationId).size() == 1, 'Failed to send message');

        System.runAs(u) {
            ChatterMessengerController.replyToMessage('test reply', msg.Id);
        }
        System.assert(ChatterMessengerController.getConversation(msg.conversationId).size() == 2, 'Failed to reply message');

    }

}
