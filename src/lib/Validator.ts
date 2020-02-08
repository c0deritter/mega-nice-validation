import Constraint from './Constraint'
import Misfit from './Misfit'

export interface ValidatorOptions {
  checkOnlyWhatIsThere?: boolean
}

export default class Validator {

  fieldConstraints: FieldConstraint[] = []

  add(field: string|string[], constraint: Constraint|((value: any, object: any) => Promise<Misfit|undefined>), condition?: (object: any) => Promise<boolean>) {
    this.fieldConstraints.push(new FieldConstraint(field, constraint, condition))
  }

  get fields(): (string|string[])[] {
    let fields: (string|string[])[] = []

    for (let fieldConstraint of this.fieldConstraints) {
      if (fieldConstraint.field != undefined) {
        fields.push(fieldConstraint.field)
      }
      else if (fieldConstraint.fields != undefined) {
        fields.push(fieldConstraint.fields)
      }
    }

    return fields
  }

  get singleFields(): string[] {
    let fields: string[] = []

    for (let fieldConstraint of this.fieldConstraints) {
      if (fieldConstraint.field != undefined && fields.indexOf(fieldConstraint.field) == -1) {
        fields.push(fieldConstraint.field)
      }
    }

    return fields
  }

  get combinedFields(): string[][] {
    let fields: string[][] = []

    for (let fieldConstraint of this.fieldConstraints) {
      if (fieldConstraint.fields != undefined && ! fields.some((fields: string[]) => arraysEqual(fields, fieldConstraint.fields))) {
        fields.push(fieldConstraint.fields)
      }
    }

    return fields
  }

  constraints(field: string|string[]): (Constraint|((value: any, object: any) => Promise<Misfit|undefined>))[] {
    let constraints: (Constraint|((value: any, object: any) => Promise<Misfit|undefined>))[] = []
    
    for (let fieldConstraint of this.fieldConstraints) {
      if (field === fieldConstraint.field) {
        constraints.push(fieldConstraint.constraint)
      }
      else if (field instanceof Array && fieldConstraint.fields && arraysEqual(field, fieldConstraint.fields)) {
        constraints.push(fieldConstraint.constraint)
      }
    }

    return constraints
  }

  fieldConstraintsForField(field: string|string[]): FieldConstraint[] {
    let fieldConstraints: FieldConstraint[] = []
    
    for (let fieldConstraint of this.fieldConstraints) {
      if (field === fieldConstraint.field) {
        fieldConstraints.push(fieldConstraint)
      }
      else if (field instanceof Array && fieldConstraint.fields && arraysEqual(field, fieldConstraint.fields)) {
        fieldConstraints.push(fieldConstraint)
      }
    }

    return fieldConstraints
  }

  async validate(object: any, options?: ValidatorOptions): Promise<Misfit[]> {
    let misfits: Misfit[] = []
    let misfittingFields: string[] = []

    for (let field of this.singleFields) {
      if (object[field] === undefined && options && options.checkOnlyWhatIsThere) {
        continue
      }

      let constraints = this.fieldConstraintsForField(field)

      for (let constraint of constraints) {
        let misfit

        if (constraint.condition != undefined && ! await constraint.condition(object)) {
          continue
        }

        misfit = await constraint.validate(object[field], object)

        if (misfit) {
          misfittingFields.push(field)
          misfit.field = field
          misfits.push(misfit)
          break
        }    
      }
    }

    for (let fields of this.combinedFields) {
      let oneOfTheFieldsAlreadyHasAMisfit = false
      for (let field of fields) {
        if (misfittingFields.indexOf(field) > -1) {
          oneOfTheFieldsAlreadyHasAMisfit = true
          break
        }
      }

      if (oneOfTheFieldsAlreadyHasAMisfit) {
        continue
      }

      let atLeastOneOfTheFieldsMissingInObject = false
      for (let field of fields) {
        if (object[field] === undefined) {
          atLeastOneOfTheFieldsMissingInObject = true
          break
        }
      }

      if (atLeastOneOfTheFieldsMissingInObject && options && options.checkOnlyWhatIsThere) {
        continue
      }

      let constraints = this.fieldConstraintsForField(fields)

      for (let constraint of constraints) {
        let misfit

        if (constraint.condition != undefined && ! await constraint.condition(object)) {
          continue
        }

        misfit = await constraint.validate(undefined, object)

        if (misfit) {
          misfit.fields = fields
          misfits.push(misfit)
          break
        }    
      }
    }

    return misfits
  }
}

function arraysEqual(a1?: string[], a2?: string[]): boolean {
  if (! a1 || ! a2) {
    return false
  }

  if (a1.length != a2.length) {
    return false
  }

  for (let i = 0; i < a1.length; i++) {
    if (a2.indexOf(a1[i]) == -1) {
      return false
    }
  }

  return true
}

class FieldConstraint { 
  field?: string
  fields?: string[]
  constraint!: Constraint|((value: any, object: any) => Promise<Misfit|undefined>)
  condition?: (object: any) => Promise<boolean>

  constructor(field: string|string[], constraint: Constraint|((value: any, object: any) => Promise<Misfit|undefined>), condition?: (object: any) => Promise<boolean>) {
    this.field = typeof field == 'string' ? field : undefined
    this.fields = field instanceof Array ? field : undefined
    this.constraint = constraint
    this.condition = condition
  }

  async validate(value: any, object: any): Promise<Misfit|undefined> {
    if (this.constraint instanceof Constraint) {
      return await this.constraint.validate(value, object)
    }
    else if (typeof this.constraint == 'function') {
      return await this.constraint(value, object)
    }
  }
}