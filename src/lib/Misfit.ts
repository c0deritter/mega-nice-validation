import Required from './constraints/Required'
import Unique from './constraints/Unique'

export default class Misfit {

  name!: string
  field?: string
  message?: string

  constructor(fieldOrName?: string, name?: string) {
    if (name == undefined) {
      this.name = <any> fieldOrName // avoid type checking with any
    }
    else {
      this.field = fieldOrName
      this.name = <any> name // avoid type checking with <any>
    }
  }

  setMessage(message: string|undefined): this {
    this.message = message
    return this
  }

  static required(field: string, message?: string) {
    return new Misfit(field, Required.name).setMessage(message)
  }

  static unique(field: string, message?: string) {
    return new Misfit(field, Unique.name).setMessage(message)
  }

  static notFound(field: string, message?: string) {
    return new Misfit(field, 'NotFound').setMessage(message)
  }
}