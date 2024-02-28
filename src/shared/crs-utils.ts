import { CrsCode } from './models.js';

// This list was taken from GDAL
// and may not be completely up-to-date
const LatLonCrsList = [
  'EPSG:4046', // RGRDC 2005
  'EPSG:4075', // SREF98
  'EPSG:4120', // Greek
  'EPSG:4122', // ATS77
  'EPSG:4124', // RT90
  'EPSG:4126', // LKS94 (ETRS89)
  'EPSG:4149', // CH1903
  'EPSG:4151', // CHTRF95
  'EPSG:4153', // Rassadiran
  'EPSG:4155', // Dabola 1981
  'EPSG:4157', // Mount Dillon
  'EPSG:4159', // ELD79
  'EPSG:4161', // Pampa del Castillo
  'EPSG:4163', // Yemen NGN96
  'EPSG:4165', // Bissau
  'EPSG:4167', // NZGD2000
  'EPSG:4169', // American Samoa 1962
  'EPSG:4171', // RGF93
  'EPSG:4173', // IRENET95
  'EPSG:4175', // Sierra Leone 1968
  'EPSG:4178', // Pulkovo 1942(83)
  'EPSG:4180', // EST97
  'EPSG:4182', // Azores Occidental 1939
  'EPSG:4184', // Azores Oriental 1940
  'EPSG:4188', // OSNI 1952
  'EPSG:4190', // POSGAR 98
  'EPSG:4191', // Albanian 1987
  'EPSG:4196', // Ammassalik 1958
  'EPSG:4198', // Kousseri
  'EPSG:4202', // AGD66
  'EPSG:4210', // Arc 1960
  'EPSG:4211', // Batavia
  'EPSG:4214', // Beijing 1954
  'EPSG:4226', // Cote d'Ivoire
  'EPSG:4229', // Egypt 1907
  'EPSG:4231', // ED87
  'EPSG:4233', // Gandajika 1970
  'EPSG:4236', // Hu Tzu Shan 1950
  'EPSG:4238', // ID74
  'EPSG:4240', // Indian 1975
  'EPSG:4242', // JAD69
  'EPSG:4244', // Kandawala
  'EPSG:4246', // KOC
  'EPSG:4248', // PSAD56
  'EPSG:4250', // Leigon
  'EPSG:4252', // Lome
  'EPSG:4255', // Herat North
  'EPSG:4258', // ETRS89
  'EPSG:4261', // Merchich
  'EPSG:4264', // Mhast
  'EPSG:4267', // NAD27
  'EPSG:4270', // Nahrwan 1967
  'EPSG:4273', // NGO 1948
  'EPSG:4276', // NSWC 9Z-2
  'EPSG:4279', // OS(SN)80
  'EPSG:4281', // Palestine 1923
  'EPSG:4284', // Pulkovo 1942
  'EPSG:4286', // Qatar 1948
  'EPSG:4288', // Loma Quintana
  'EPSG:4292', // Sapper Hill 1943
  'EPSG:4295', // Serindung
  'EPSG:4297', // Tananarive
  'EPSG:4299', // TM65
  'EPSG:4302', // Trinidad 1903
  'EPSG:4324', // WGS 72BE
  'EPSG:4326', // WGS 84
];

/**
 * Inverted coordinates is meant from the POV of a programmer, i.e. Y before X
 * Note: can handle full URNs for EPSG codes
 */
export function hasInvertedCoordinates(crsName: CrsCode) {
  return LatLonCrsList.indexOf(simplifyEpsgUrn(crsName)) > -1;
}

/**
 * When given a full URN pointing to an EPSG code, will return the simplified
 * name, e.g.: `urn:ogc:def:crs:EPSG::2154` translates to `EPSG:2154`
 * On other kind of URNs (i.e. `urn:ogc:def:crs:OGC:1.3:CRS84`), returns the
 * URN untouched
 */
export function simplifyEpsgUrn(fullCrsName: CrsCode): CrsCode {
  if (/^urn:(?:x-)?ogc:def:crs:epsg:/.test(fullCrsName.toLowerCase())) {
    const code = /([0-9]+)$/.exec(fullCrsName)[1];
    return `EPSG:${code}`;
  }
  return fullCrsName;
}
