/* global axios */
import ApiClient from './ApiClient';

class AudioAuditsAPI extends ApiClient {
  constructor() {
    super('jrc_contact_center/audio_audits', { accountScoped: true });
  }

  list(page = 1) {
    return axios.get(this.url, { params: { page } });
  }

  upload(audio) {
    const form = new FormData();
    form.append('audio', audio);
    return axios.post(this.url, form);
  }

  retryAnalysis(id) {
    return axios.post(`${this.url}/${id}/retry_analysis`);
  }

  recording(id) {
    return axios.get(`${this.url}/${id}/audio`, { responseType: 'blob' });
  }
}

export default new AudioAuditsAPI();
