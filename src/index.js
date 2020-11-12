import fs from 'fs';
import MDToADF from 'md-to-adf';
import FandomServices from './api/FandomServices';
import Wiki from './structs/Wiki';

const fandom = new FandomServices({
  username: process.env.FANDOM_USERNAME,
  password: process.env.FANDOM_PASSWORD
});

fs.readdir('./templates', (err, files) => {
  if (err) throw err;
  files.forEach((file) => {
    if (file.startsWith('.')) return;
    // eslint-disable-next-line no-shadow
    fs.readFile(`./templates/${file}`, 'utf-8', (err, fileContents) => {
      if (err) throw err;
      const interwikiName = file.replace(/\.[^/.]+$/, ''),
        interwiki = interwikiName.split('.');

      const wiki = interwiki.length === 2
        ? new Wiki({
          interwiki: interwiki[1],
          lang: interwiki[0]
        })
        : new Wiki({
          interwiki: interwiki[0]
        });
      console.log('Wiki added:', interwikiName);
      const template = fileContents.split(/[\r\n]+/);
      wiki.messageTitle = template.shift();
      wiki.messageTemplate = template.join('\n');
      wiki.userCache = [];

      wiki.on('edit', async (edit, wikiInfo) => {
        if (wiki.userCache.includes(edit.user)) return;

        wiki.getContribs(edit.user).then((contribs) => {
          if (contribs.length === 1) {
            const md = wiki.messageTemplate.replace(/\$1/g, edit.user)
              .replace(/\$2/g, contribs[0].title);
            const adf = MDToADF(md),
              json = adf.toString();

            fandom.postToWall(wikiInfo.wikiId, contribs[0].userid, wiki.messageTitle, json).then(() => {
              console.log(`[${interwikiName}] Sent welcome message to ${edit.user}`);
              wiki.userCache.push(edit.user);
            }).catch(console.error);
          } else wiki.userCache.push(edit.user);
        }).catch(console.error);
      });

      wiki.initialize();
    });
  });
});
