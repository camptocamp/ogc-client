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
        availableCrs: [
          "EPSG:4326",
          "CRS:84",
          "EPSG:3857",
          "EPSG:4171",
          "EPSG:2154",
        ],
        styles: ["default"],
        boundingBoxes: {
          "CRS:84": [
            "-180",
            "-90",
            "180",
            "90"
          ],
          "EPSG:2154": [
            "-1e+15",
            "-1e+15",
            "1e+15",
            "1e+15"
          ],
          "EPSG:3857": [
            "-1e+15",
            "-1e+15",
            "1e+15",
            "1e+15"
          ],
          "EPSG:4171": [
            "-180",
            "-90",
            "180",
            "90"
          ],
          "EPSG:4326": [
            "-180",
            "-90",
            "180",
            "90"
          ]
        },
        path: []
      },
      {
        name: 'GEOLOGIE',
        title: 'Cartes géologiques',
        abstract: 'Cartes géologiques',
        availableCrs: [
          "EPSG:4326",
          "CRS:84",
          "EPSG:3857",
          "EPSG:4171",
          "EPSG:2154",
        ],
        styles: ["default"],
        boundingBoxes: {},
        path: ['GEOSERVICES_GEOLOGIE']
      },
      {
        abstract: "BD Scan-Million-Géol est la base de données géoréférencées de la carte géologique image à 1/1 000 000",
        availableCrs: [
          "EPSG:4326",
          "EPSG:3857",
          "CRS:84",
          "EPSG:32620",
          "EPSG:32621"
        ],
        styles: ["inspire_common:DEFAULT", "inspire_common:OTHER"],
        boundingBoxes: {
          "CRS:84": [
            "-5.86764",
            "41.1701",
            "11.0789",
            "51.1419"
          ],
          "EPSG:32620": [
            "4.26677e+06",
            "6.57018e+06",
            "6.28215e+06",
            "8.59738e+06"
          ],
          "EPSG:32621": [
            "3.93464e+06",
            "6.12146e+06",
            "5.93425e+06",
            "8.11543e+06"
          ],
          "EPSG:3857": [
            "-653183",
            "5.03746e+06",
            "1.2333e+06",
            "6.64644e+06"
          ],
          "EPSG:4326": [
            "-5.86764",
            "41.1701",
            "11.0789",
            "51.1419"
          ]
        },
        name: "SCAN_F_GEOL1M",
        title: "Carte géologique image de la France au million",
        path: ["GEOSERVICES_GEOLOGIE", "GEOLOGIE"]
      },
      {
        abstract: "BD Scan-Géol-250 est la base de données géoréférencées des cartes géologiques image à 1/250 000. Utilisation scientifique, technique, pédagogique",
        availableCrs: [
          "EPSG:4326",
          "EPSG:3857",
          "CRS:84",
          "EPSG:32620",
          "EPSG:32621"
        ],
        styles: ["default"],
        boundingBoxes: {
          "CRS:84": [
            "-6.20495",
            "41.9671",
            "12.2874",
            "51.2917"
          ],
          "EPSG:32620": [
            "4.23619e+06",
            "6.6238e+06",
            "6.21236e+06",
            "8.70077e+06"
          ],
          "EPSG:32621": [
            "3.9038e+06",
            "6.1856e+06",
            "5.89555e+06",
            "8.21306e+06"
          ],
          "EPSG:3857": [
            "-690732",
            "5.15606e+06",
            "1.36783e+06",
            "6.67306e+06"
          ],
          "EPSG:4326": [
            "-6.20495",
            "41.9671",
            "12.2874",
            "51.2917"
          ]
        },
        name: "SCAN_F_GEOL250",
        title: "Carte géologique image de la France au 1/250000",
        path: ["GEOSERVICES_GEOLOGIE", "GEOLOGIE"]
      },
      {
        abstract: "BD Scan-Géol-50 est la base de données géoréférencées des cartes géologiques 'papier' à 1/50 000",
        availableCrs: [
          "EPSG:4326",
          "EPSG:3857",
          "CRS:84",
          "EPSG:32620",
          "EPSG:32621"
        ],
        styles: ["default"],
        boundingBoxes: {
          "CRS:84": [
            "-12.2064",
            "40.681",
            "11.894",
            "52.1672"
          ],
          "EPSG:32620": [
            "3.88148e+06",
            "6.13796e+06",
            "6.31307e+06",
            "8.70752e+06"
          ],
          "EPSG:32621": [
            "3.52434e+06",
            "5.74736e+06",
            "5.97375e+06",
            "8.23867e+06"
          ],
          "EPSG:3857": [
            "-1.35881e+06",
            "4.96541e+06",
            "1.32403e+06",
            "6.83041e+06"
          ],
          "EPSG:4326": [
            "-12.2064",
            "40.681",
            "11.894",
            "52.1672"
          ]
        },
        name: "SCAN_D_GEOL50",
        title: "Carte géologique image de la France au 1/50 000e",
        path: ["GEOSERVICES_GEOLOGIE", "GEOLOGIE"]
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
