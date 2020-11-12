import { EventEmitter } from 'events';
import { stringify } from 'querystring';
import axios from 'axios';

class Wiki extends EventEmitter {
  constructor(params) {
    super(params);
    this.authToken = params.authToken;
    this.interwiki = params.interwiki;
    this.lang = params.lang || 'en';
    this.baseURL = `https://${this.interwiki}.fandom.com${this.lang !== 'en' ? `/${this.lang}` : ''}`;
  }

  initialize() {
    const siprop = ['general', 'statistics', 'rightsinfo', 'variables'],
      uiprop = ['blockinfo', 'rights', 'groups', 'changeablegroups', 'editcount', 'ratelimits', 'registrationdate'];
    this._query({
      meta: 'siteinfo|userinfo',
      siprop: siprop.join('|'),
      uiprop: uiprop.join('|'),
      list: 'recentchanges',
      rctype: 'edit|new|categorize',
      rcshow: '!anon|!bot'
    }).then((result) => {
      const data = result.query;
      this._wikiInfo = {
        wikiId: data.variables.find((variable) => variable.id === 'wgCityId')['*']
      };
      siprop.forEach((el) => { this._wikiInfo[el] = data[el]; });
      this._wikiInfo.userinfo = data.userinfo;
      if (data.recentchanges && data.recentchanges.length > 0) this._rcend = data.recentchanges[0].timestamp;
    }).catch((err) => {
      console.error(err);
    });

    this._interval = setInterval(this.fetchRC.bind(this), 5000);
  }

  fetchRC() {
    const query = {
      list: 'recentchanges',
      rctype: 'edit|new',
      rcshow: '!anon|!bot',
      rcprop: 'user|title|ids|timestamp|comment|flags|tags|loginfo|sizes',
      rclimit: 500
    };
    if (this._rcend) query.rcend = this._rcend;

    this._query(query).then((result) => {
      if (result.query && result.query.recentchanges) {
        const data = result.query.recentchanges.filter((el) => new Date(el.timestamp) > new Date(this._rcend));
        if (data.length > 0) {
          data.forEach((edit) => {
            this.emit('edit', edit, this._wikiInfo);
          });
          this._rcend = data[0].timestamp;
        }
      } else console.error(`[${this.baseURL}] No data from API:Recentchanges`, result);
    }).catch((err) => {
      console.error(`[${this.baseURL}] Something exploded:`, err);
    });
  }

  getUser(username) {
    return new Promise((resolve, reject) => {
      const query = {
        list: 'users',
        ususers: username,
        usprop: 'groups|editcount'
      };
      this._query(query).then((response) => {
        if (response.error || !response.query.users[0] || response.query.users[0].missing) reject(new Error('User does not exist'));
        else {
          const user = response.query.users[0];
          resolve(user);
        }
      }).catch(reject);
    });
  }

  getContribs(username) {
    return new Promise((resolve, reject) => {
      const query = {
        list: 'usercontribs',
        ucuser: username
      };
      this._query(query).then((response) => {
        if (response.error) reject(new Error('MediaWiki API error'));
        else resolve(response.query.usercontribs);
      }).catch(reject);
    });
  }

  _query(params) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const { data } = await axios.get(`${this.baseURL}/api.php?${stringify({
        ...params,
        ...{
          action: 'query',
          format: 'json'
        }
      })}`).catch(reject);
      if (data) resolve(data);
      else reject(new Error('No data'));
    });
  }
}

export default Wiki;
