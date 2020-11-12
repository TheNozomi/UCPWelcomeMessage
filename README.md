# UCPWelcomeMessage
Implements Message Wall welcome messages for new editors on Fandom's UCP.

### Setup
1. Clone and install dependencies
2. Set up env vars `FANDOM_USERNAME` and `FANDOM_PASSWORD` with the credentials of the account you want to use to send welcome messages
3. Create the message templates for each wiki you want to add. The filenames are `<lang>.<interwiki>.md`, for example: https://steven-universe.fandom.com => `steven-universe.md`; https://love-live.fandom.com/es/ => `es.love-live.md`
4. `npm start`
5. Profit?

### Template format
Fandom's Feeds messages are stored in their backend as a very limited subset of [Atlassian Document Format (ADF)](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/), which is stored as JSON on the `jsonModel` key. Since writing ADF manually isn't ideal, templates are written in Markdown and [md-to-adf](https://github.com/b-yond-infinite-network/md-to-adf) is used to convert it to ADF.

For each Markdown template file, the first line will be the message title. Following lines will be part of the message content, and these placeholders are available for substitution:
`$1`: Name of the user that edited
`$2`: The page edited

For example, the following template:
````
Welcome to hell!

Hi high **$1**! Welcome to _hell_. Thank you for your edit on **$2**.
* Check out the [Rules](https://community.fandom.com) before you start editing.
* Contact an admin if you need help.
* I don't have creativity sorry.
````

Renders as:
![](https://cdn.discordapp.com/attachments/247524732411445248/776188381281517578/unknown.png)