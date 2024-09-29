import type { XmlDocument } from '@rgrove/parse-xml';
import type { Provider } from './models.js';
import {
  findChildElement,
  getElementAttribute,
  getElementText,
  getRootElement,
} from './xml-utils.js';

/**
 * Read standard OWS provider information from capabilities
 * @param capabilitiesDoc
 */
export function readProviderFromCapabilities(
  capabilitiesDoc: XmlDocument
): Provider {
  const serviceProvider = findChildElement(
    getRootElement(capabilitiesDoc),
    'ServiceProvider'
  );
  const serviceContact = findChildElement(serviceProvider, 'ServiceContact');
  const contactInfo = findChildElement(serviceContact, 'ContactInfo');
  const phone = findChildElement(contactInfo, 'Phone');
  const address = findChildElement(contactInfo, 'Address');
  return {
    name: getElementText(findChildElement(serviceProvider, 'ProviderName')),
    site: getElementAttribute(
      findChildElement(serviceProvider, 'ProviderSite'),
      'xlink:href'
    ),
    contact: {
      name: getElementText(findChildElement(serviceContact, 'IndividualName')),
      position: getElementText(
        findChildElement(serviceContact, 'PositionName')
      ),
      phone: getElementText(findChildElement(phone, 'Voice')),
      fax: getElementText(findChildElement(phone, 'Facsimile')),
      address: {
        deliveryPoint: getElementText(
          findChildElement(address, 'DeliveryPoint')
        ),
        city: getElementText(findChildElement(address, 'City')),
        administrativeArea: getElementText(
          findChildElement(address, 'AdministrativeArea')
        ),
        postalCode: getElementText(findChildElement(address, 'PostalCode')),
        country: getElementText(findChildElement(address, 'Country')),
      },
      email: getElementText(findChildElement(address, 'ElectronicMailAddress')),
    },
  };
}
