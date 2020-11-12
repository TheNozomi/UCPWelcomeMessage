import axios from 'axios';
import querystring from 'querystring';

class FandomServices {
  constructor(params) {
    this.username = params.username;
    this.password = params.password;
    this.http = axios.create({
      baseURL: 'https://services.fandom.com/'
    });
  }

  logIn() {
    return new Promise((resolve, reject) => {
      this.http.post('/auth/token', querystring.stringify({
        username: this.username,
        password: this.password
      })).then((response) => {
        const { data } = response;
        this._user = {
          ...{
            username: this.username
          },
          ...data
        };
        resolve(this._user);
      }).catch(reject);
    });
  }

  async postToWall(siteId, userId, title, content) {
    if (!this._user) await this.logIn();
    const escapedJSON = content
      .replace(/\\n/g, '\\n')
      .replace(/\\'/g, "\\'")
      .replace(/\\"/g, '\\"')
      .replace(/\\&/g, '\\&')
      .replace(/\\r/g, '\\r')
      .replace(/\\t/g, '\\t')
      .replace(/\\b/g, '\\b')
      .replace(/\\f/g, '\\f');
    return new Promise((resolve, reject) => {
      this.http.post(`/discussion/wall/${siteId}/${userId}/threads`, {
        siteId: parseInt(siteId, 10),
        title,
        jsonModel: escapedJSON
      }, {
        headers: {
          Cookie: `access_token=${this._user.access_token}`
        }
      }).then((response) => {
        if (response.status === 201 && response.data) resolve(response.data);
      }).catch(reject);
    });
  }
}

export default FandomServices;
