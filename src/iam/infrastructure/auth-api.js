import { BaseApi } from '@/shared/infrastructure/base-api.js'

const authPath = 'api/authentication'

export class AuthApi extends BaseApi {
  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ id: number, username: string, token: string }>}
   */
  async signIn(username, password) {
    const { data } = await this.http.post(`${authPath}/sign-in`, {
      username,
      password,
    })
    return data
  }

  /**
   * @param {string} username
   * @param {string} password
   */
  async signUp(username, password) {
    const { data } = await this.http.post(`${authPath}/sign-up`, {
      username,
      password,
    })
    return data
  }
}
