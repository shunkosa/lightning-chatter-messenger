# Lightning Chatter Messenger

[![Github Workflow](https://github.com/shunkosa/lightning-chatter-messenger/workflows/unit%20test/badge.svg?branch=master)](https://github.com/shunkosa/lightning-chatter-messenger/actions?query=workflow%3A%22unit%20test%22) [![codecov](https://codecov.io/gh/shunkosa/lightning-chatter-messenger/branch/master/graph/badge.svg)](https://codecov.io/gh/shunkosa/lightning-chatter-messenger)

⚡Chatter messenger utility item, which supports private chatter conversation, in Salesforce Lightning Experience. Built by Lightning Web Component.

<img src="./doc/img/utility_item.png">

## 📦 Installation

Click the following link. Before installation, my domain must be enabled in the target org.

-   [Install to Production/DE](https://login.salesforce.com/packaging/installPackage.apexp?p0=04tf4000004Ez0PAAS)
-   [Install to Sandbox](https://test.salesforce.com/packaging/installPackage.apexp?p0=04tf4000004Ez0PAAS)

You can also install in your scratch org by cloning this repo and pushing the source.

[![Deploy](https://deploy-to-sfdx.com/dist/assets/images/DeployToSFDX.svg)](https://deploy-to-sfdx.com/)

After installation, add `chatterMessenger` custom component as an utility item in application setting.

<img src="./doc/img/application_setting.png" width="600px" border="1">

Make sure that the profile of the users has create and read access to Chatter Message Event to refresh the screen automatically.

## 🛠 Development

1. Clone this repo and run `npm install`.
2. Authorize a DevHub (if not yet) and create a scratch org, and then push the source to the org. (Or use sfdx button above)
3. Assign permission.

```
sfdx force:user:permset:assign -n LCM_Manager
```

4. Create test users.

```
sfdx force:apex:execute -f ./scripts/apex/init.apex
```

## ✋ Feedback/Contributing

Feature requests, bug reports and pull requests are welcome🙏🏻

## 🎉 Special Thanks

-   [Akira Kuratani](https://www.twitter.com/a_kuratani/) - This project is inspired by his [LightningMessage](https://www.github.com/kuratani/LightningMessage/) app.

## 👀 License

The source code is licensed under the [MIT license](./LICENSE)
