/**
Anonymouse Apex to create test user in a development org
***/

//Unique string for username
String userDomain = System.URL.getOrgDomainUrl()
    .toExternalForm()
    .removeStart('https://');

//Query platform user profile
Profile p = [
    SELECT Id, Name
    FROM Profile
    WHERE
        UserLicense.LicenseDefinitionKey = 'AUL'
    ][0];

User u1 = new User(
    UserName = 'test1@' + userDomain,
    Email = 'test1@' + userDomain,
    LastName = 'test1',
    Alias = 'test1',
    TimeZoneSidKey = 'America/Los_Angeles',
    LocaleSidKey = 'en_US',
    EmailEncodingKey = 'ISO-8859-1',
    LanguageLocaleKey = 'en_US',
    ProfileId = p.Id
);

User u2 = new User(
    UserName = 'test2@' + userDomain,
    Email = 'test2@' + userDomain,
    LastName = 'test2',
    Alias = 'test2',
    TimeZoneSidKey = 'America/Los_Angeles',
    LocaleSidKey = 'en_US',
    EmailEncodingKey = 'ISO-8859-1',
    LanguageLocaleKey = 'en_US',
    ProfileId = p.Id
);

List<User> users = new List<User>{u1, u2};
insert users;

PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'LCM_Manager'][0];
insert new List<PermissionSetAssignment>{
    new PermissionSetAssignment(
        AssigneeId = u1.Id,
        PermissionSetId = ps.Id
    ),
    new PermissionSetAssignment(
        AssigneeId = u2.Id,
        PermissionSetId = ps.Id
    )
};