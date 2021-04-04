import {readLayersFromCapabilities, readVersionFromCapabilities} from './capabilities'
import capabilities130 from '../../fixtures/wms/capabilities-brgm-1-3-0.xml'
import capabilities111 from '../../fixtures/wms/capabilities-brgm-1-1-1.xml'
import {parseXmlString} from "../shared/xml-utils";

describe('WMS capabilities', () => {
  describe('readVersionFromCapabilities', () => {
    it('finds the correct version (1.3.0)', () => {
      const doc = parseXmlString(capabilities130)
      expect(readVersionFromCapabilities(doc)).toBe('1.3.0')
    })
    it('finds the correct version (1.1.1)', () => {
      const doc = parseXmlString(capabilities111)
      expect(readVersionFromCapabilities(doc)).toBe('1.1.1')
    })
  })

  describe('readLayersFromCapabilities', () => {
    const expectedLayers = [
      {
        name: 'GEOSERVICES_GEOLOGIE',
        title: 'GéoServices : géologie, hydrogéologie et gravimétrie',
        abstract: 'Ensemble des services d\'accès aux données sur la géologie, l\'hydrogéologie et la gravimétrie, diffusées par le BRGM',
        availableCrs: expect.any(Array),
        childLayers: [
          {
            name: 'GEOLOGIE',
            title: 'Cartes géologiques',
            abstract: 'Cartes géologiques',
            availableCrs: expect.any(Array),
            childLayers: [
              {
                abstract: "BD Scan-Million-Géol est la base de données géoréférencées de la carte géologique image à 1/1 000 000",
                availableCrs: expect.any(Array),
                childLayers: [],
                name: "SCAN_F_GEOL1M",
                title: "Carte géologique image de la France au million"
              },
              {
                abstract: "BD Scan-Géol-250 est la base de données géoréférencées des cartes géologiques image à 1/250 000. Utilisation scientifique, technique, pédagogique",
                availableCrs: expect.any(Array),
                childLayers: [],
                name: "SCAN_F_GEOL250",
                title: "Carte géologique image de la France au 1/250000"
              },
              {
                abstract: "BD Scan-Géol-50 est la base de données géoréférencées des cartes géologiques 'papier' à 1/50 000",
                availableCrs: expect.any(Array),
                childLayers: [],
                name: "SCAN_D_GEOL50",
                title: "Carte géologique image de la France au 1/50 000e"
              }
            ]
          }
        ]
      }
    ]
    it('reads the layers (1.3.0)', () => {
      const doc = parseXmlString(capabilities130)
      expect(readLayersFromCapabilities(doc)).toEqual(expectedLayers)
    })
    it('reads the layers (1.1.1)', () => {
      const doc = parseXmlString(capabilities111)
      expect(readLayersFromCapabilities(doc)).toEqual(expectedLayers)
    })
  })
})
