/**
 * Cliente CRUD genérico sobre una colección REST.
 *
 * @class BaseEndpoint
 */
export class BaseEndpoint {
  /**
   * @param {import('./base-api.js').BaseApi} baseApi
   * @param {string} endpointPath - Ruta relativa al baseURL (ej. `api/inventory/items`)
   */
  constructor(baseApi, endpointPath) {
    this.http = baseApi.http
    this.endpointPath = endpointPath
  }

  /**
   * @param {Record<string, unknown>} [params] - Query string
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getAll(params = {}) {
    return this.http.get(this.endpointPath, { params })
  }

  /**
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  getById(id) {
    return this.http.get(`${this.endpointPath}/${id}`)
  }

  /**
   * @param {Object} resource
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  create(resource) {
    return this.http.post(this.endpointPath, resource)
  }

  /**
   * @param {string|number} id
   * @param {Object} resource
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  update(id, resource) {
    return this.http.put(`${this.endpointPath}/${id}`, resource)
  }

  /**
   * @param {string|number} id
   * @param {Object} resource
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  patch(id, resource) {
    return this.http.patch(`${this.endpointPath}/${id}`, resource)
  }

  /**
   * @param {string|number} id
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  delete(id) {
    return this.http.delete(`${this.endpointPath}/${id}`)
  }
}
