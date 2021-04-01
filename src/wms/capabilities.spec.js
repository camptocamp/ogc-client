import {readVersionFromCapabilities} from './capabilities'
import capabilities130 from '../../fixtures/wms/capabilities-brgm-1-3-0.xml'
import capabilities111 from '../../fixtures/wms/capabilities-brgm-1-1-1.xml'

describe('capabilities', () => {
  describe('readVersionFromCapabilities', () => {
    it('finds the correct version (1.3.0)', () => {
      const doc = new DOMParser().parseFromString(capabilities130, 'application/xml')
      expect(readVersionFromCapabilities(doc)).toBe('1.3.0')
    })
    it('finds the correct version (1.1.1)', () => {
      const doc = new DOMParser().parseFromString(capabilities111, 'application/xml')
      expect(readVersionFromCapabilities(doc)).toBe('1.1.1')
    })
  })
})
