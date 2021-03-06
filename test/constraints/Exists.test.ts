import { expect } from 'chai'
import 'mocha'
import { Misfit } from '../../src'
import Exists from '../../src/lib/constraints/Exists'

describe('constraints', function() {
  describe('Exists', function() {
    describe('validate', function() {
      describe('single field', function() {
        it('should return undefined if exists', async function() {
          let exists = new Exists(async (obj: any) => obj.value === 1)
          let misfit = await exists.validate({ value: 1 }, 'value')
          expect(misfit).to.be.undefined
        })
  
        it('should return undefined if the value is missing', async function() {
          let exists = new Exists(async (obj: any) => obj.value === 1)
  
          expect(await exists.validate({ value: undefined }, 'value')).to.be.undefined
          expect(await exists.validate({ value: null }, 'value')).to.be.undefined
          expect(await exists.validate({ value: '' }, 'value')).to.be.undefined
          expect(await exists.validate({ value: NaN }, 'value')).to.be.undefined
        })
  
        it('should return a misfit if not exists', async function() {
          let exists = new Exists(async (obj: any) => obj.value === 1)
          let misfit = await exists.validate({ value: 2 }, 'value')
          expect(misfit).to.be.instanceOf(Misfit)
        })  
      })

      describe('field combination', function() {
        it('should return undefined if exists', async function() {
          let exists = new Exists(async (obj: any) => obj.a === 0 && obj.b === 1)
          let misfit = await exists.validate({ a: 0, b: 1 }, ['a', 'b'])
          expect(misfit).to.be.undefined
        })
  
        it('should return undefined if the value is missing', async function() {
          let exists = new Exists(async (obj: any) => obj.a === 0 && obj.b === 1)
  
          expect(await exists.validate({ a: undefined, b: undefined }, ['a', 'b'])).to.be.undefined
          expect(await exists.validate({ a: null, b: null }, ['a', 'b'])).to.be.undefined
          expect(await exists.validate({ a: '', b: '' }, ['a', 'b'])).to.be.undefined
          expect(await exists.validate({ a: NaN, b: NaN }, ['a', 'b'])).to.be.undefined
        })
  
        it('should return a misfit if not exists', async function() {
          let exists = new Exists(async (obj: any) => obj.a === 0 && obj.b === 1)
          let misfit = await exists.validate({ a: 1, b: 2 }, ['a', 'b'])
          expect(misfit).to.be.instanceOf(Misfit)
        })  
      })
    })
  })
})
