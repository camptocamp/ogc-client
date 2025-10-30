import {
  fetchStacDocument,
  fetchLink,
  getLinks,
  getLinkUrl,
  StacDocument,
} from './link-utils.js';
import {
  parseEndpointInfo,
  parseStacCatalog,
  parseStacCollection,
  parseStacItem,
  parseCollectionsList,
  parseConformance,
  checkStacCoreConformance,
  checkOgcFeaturesConformance,
  StacRootDocument,
  StacCollectionsDocument,
  StacItemsDocument,
  StacEndpointInfo,
} from './info.js';
import { StacCatalog, StacCollection, StacItem } from './model.js';
import { EndpointError } from '../shared/errors.js';
import { BoundingBox, DateTimeParameter } from '../shared/models.js';
import { clampBoundingBox } from '../shared/bbox-utils.js';
import { getBaseUrl } from '../shared/url-utils.js';

/**
 * Options for querying collection items
 */
export interface GetCollectionItemsOptions {
  /**
   * Maximum number of items to return
   */
  limit?: number;
  /**
   * Offset for pagination
   */
  offset?: number;
  /**
   * Bounding box to filter items [minx, miny, maxx, maxy]
   */
  bbox?: BoundingBox;
  /**
   * Date/time filter
   */
  datetime?: DateTimeParameter;
  /**
   * Additional query string to append to the URL
   */
  query?: string;
}

/**
 * Represents a STAC API endpoint for querying collections and items.
 * STAC API is based on OGC API - Features.
 */
export default class StacEndpoint {
  private root_: Promise<StacRootDocument>;
  private conformance_: Promise<string[]>;
  private collectionsDocument_: Promise<StacCollectionsDocument | null>;

  /**
   * Lazy-loaded root/landing page document
   */
  private get root(): Promise<StacRootDocument> {
    if (!this.root_) {
      this.root_ = fetchStacDocument<StacRootDocument>(this.baseUrl).catch(
        (e) => {
          throw new EndpointError(
            `Failed to fetch STAC root document: ${e.message}`
          );
        }
      );
    }
    return this.root_;
  }

  /**
   * Lazy-loaded conformance classes
   */
  private get conformance(): Promise<string[]> {
    if (!this.conformance_) {
      this.conformance_ = this.root.then((root) => {
        // Conformance can be in the root document or in a separate endpoint
        if (root.conformsTo && Array.isArray(root.conformsTo)) {
          return root.conformsTo;
        }
        // Try to fetch from conformance endpoint
        return fetchLink<StacDocument>(
          root,
          ['conformance', 'http://www.opengis.net/def/rel/ogc/1.0/conformance'],
          this.baseUrl
        )
          .then(parseConformance)
          .catch(() => []);
      });
    }
    return this.conformance_;
  }

  /**
   * Lazy-loaded collections document
   */
  private get collectionsDocument(): Promise<StacCollectionsDocument | null> {
    if (!this.collectionsDocument_) {
      this.collectionsDocument_ = this.root
        .then((root) => {
          const collectionsUrl = getLinkUrl(
            root,
            ['data', 'collections'],
            this.baseUrl
          );
          if (!collectionsUrl) return null;
          return fetchStacDocument<StacCollectionsDocument>(collectionsUrl);
        })
        .catch(() => null);
    }
    return this.collectionsDocument_;
  }

  /**
   * Creates a new STAC API endpoint
   * @param baseUrl Base URL of the STAC API (landing page)
   */
  constructor(private baseUrl: string) {}

  /**
   * Returns endpoint information from the landing page
   */
  get info(): Promise<StacEndpointInfo> {
    return this.root.then(parseEndpointInfo);
  }

  /**
   * Returns the root catalog
   */
  get catalog(): Promise<StacCatalog> {
    return this.root.then((root) => {
      // If the root is already a Catalog type, parse it
      if (root.type === 'Catalog') {
        return parseStacCatalog(root);
      }
      // Otherwise, it might be a Collection acting as the root
      // In this case, we'll just return the basic catalog info
      return {
        stac_version: root.stac_version as '1.0.0',
        stac_extensions: root.stac_extensions as string[] | undefined,
        type: 'Catalog',
        id: root.id || 'root',
        title: root.title,
        description: root.description || '',
        links: root.links || [],
      };
    });
  }

  /**
   * Returns array of conformance class URIs
   */
  get conformanceClasses(): Promise<string[]> {
    return this.conformance;
  }

  /**
   * Checks if the endpoint supports STAC API Core
   */
  get isStacApi(): Promise<boolean> {
    return this.conformance.then(checkStacCoreConformance);
  }

  /**
   * Checks if the endpoint supports OGC API Features
   */
  get supportsOgcFeatures(): Promise<boolean> {
    return this.conformance.then(checkOgcFeaturesConformance);
  }

  /**
   * Returns array of all collection IDs
   */
  get allCollections(): Promise<string[]> {
    return this.collectionsDocument.then((doc) =>
      doc ? parseCollectionsList(doc) : []
    );
  }

  /**
   * Retrieves detailed information about a specific collection
   * @param collectionId The collection identifier
   * @returns Promise resolving to StacCollection
   */
  async getCollection(collectionId: string): Promise<StacCollection> {
    const collectionsDoc = await this.collectionsDocument;
    if (!collectionsDoc) {
      throw new EndpointError('No collections available at this endpoint');
    }

    // Check if collection exists in the list
    const collectionIds = parseCollectionsList(collectionsDoc);
    if (!collectionIds.includes(collectionId)) {
      throw new EndpointError(`Collection not found: ${collectionId}`);
    }

    // Try to find collection in the collections array first
    const collection = collectionsDoc.collections.find(
      (col) => col.id === collectionId
    );
    if (collection) {
      return parseStacCollection(collection as unknown as StacDocument);
    }

    // Otherwise, fetch from the collection endpoint
    const collectionsUrl = getLinkUrl(
      await this.root,
      ['data', 'collections'],
      this.baseUrl
    );
    const collectionUrl = new URL(
      collectionId,
      collectionsUrl + '/'
    ).toString();
    const collectionDoc = await fetchStacDocument(collectionUrl);
    return parseStacCollection(collectionDoc);
  }

  /**
   * Retrieves items from a collection with optional filtering
   * @param collectionId The collection identifier
   * @param options Query options (limit, bbox, datetime, etc.)
   * @returns Promise resolving to array of StacItem objects
   */
  async getCollectionItems(
    collectionId: string,
    options: GetCollectionItemsOptions = {}
  ): Promise<StacItem[]> {
    const response = await this.getCollectionItemsResponse(
      collectionId,
      options
    );
    return response.features;
  }

  /**
   * Retrieves items response document including links for pagination
   * Use this method when you need access to pagination links (rel="next") or metadata
   * @param collectionId The collection identifier
   * @param options Query options (limit, bbox, datetime, etc.)
   * @returns Promise resolving to full StacItemsDocument with links
   */
  async getCollectionItemsResponse(
    collectionId: string,
    options: GetCollectionItemsOptions = {}
  ): Promise<StacItemsDocument> {
    const collection = await this.getCollection(collectionId);
    const itemsLinks = getLinks(
      collection as unknown as StacDocument,
      'items'
    );
    const itemsLink = itemsLinks[0];

    const url = await this.getCollectionItemsUrl(collectionId, options);

    // Use the link's type field as Accept header if available
    // This ensures we get STAC items instead of plain GeoJSON
    const acceptType = itemsLink?.type;
    const itemsDoc = await fetchStacDocument<StacItemsDocument>(url, acceptType);

    if (!itemsDoc.features || !Array.isArray(itemsDoc.features)) {
      throw new EndpointError('Items response does not contain features array');
    }

    // Parse features in place
    itemsDoc.features = itemsDoc.features.map((item) =>
      parseStacItem(item as unknown as StacDocument)
    );

    return itemsDoc;
  }

  /**
   * Retrieves a single item from a collection
   * @param collectionId The collection identifier
   * @param itemId The item identifier
   * @returns Promise resolving to StacItem
   */
  async getCollectionItem(
    collectionId: string,
    itemId: string
  ): Promise<StacItem> {
    const collection = await this.getCollection(collectionId);
    const itemsLinks = getLinks(
      collection as unknown as StacDocument,
      'items'
    );
    const itemsLink = itemsLinks[0];

    const itemsUrl = getLinkUrl(
      collection as unknown as StacDocument,
      'items',
      this.baseUrl
    );
    if (!itemsUrl) {
      throw new EndpointError(
        `Collection ${collectionId} does not have an items link`
      );
    }

    // Parse the items URL to preserve query parameters (like httpAccept)
    const itemUrl = new URL(itemsUrl);
    // Append the itemId to the path, preserving query params
    if (!itemUrl.pathname.endsWith('/')) {
      itemUrl.pathname += '/';
    }
    itemUrl.pathname += itemId;

    // Use the link's type field as Accept header if available
    const acceptType = itemsLink?.type;
    const itemDoc = await fetchStacDocument(itemUrl.toString(), acceptType);
    return parseStacItem(itemDoc);
  }

  /**
   * Builds a URL for querying collection items with filters
   * @param collectionId The collection identifier
   * @param options Query options
   * @returns Promise resolving to the constructed URL
   */
  async getCollectionItemsUrl(
    collectionId: string,
    options: GetCollectionItemsOptions = {}
  ): Promise<string> {
    const collection = await this.getCollection(collectionId);
    const itemsUrl = getLinkUrl(
      collection as unknown as StacDocument,
      'items',
      this.baseUrl
    );
    if (!itemsUrl) {
      throw new EndpointError(
        `Collection ${collectionId} does not have an items link`
      );
    }

    const url = new URL(itemsUrl, getBaseUrl());

    // Add query parameters only if not already present in the link
    // This preserves server-specific parameters (like httpAccept) from the link
    if (options.limit !== undefined && !url.searchParams.has('limit')) {
      url.searchParams.set('limit', options.limit.toString());
    }
    if (options.offset !== undefined && !url.searchParams.has('offset')) {
      url.searchParams.set('offset', options.offset.toString());
    }
    if (options.bbox && options.bbox.length === 4 && !url.searchParams.has('bbox')) {
      // Clamp bbox to valid WGS84 bounds to prevent server validation errors
      const clampedBbox = clampBoundingBox(options.bbox);
      url.searchParams.set('bbox', clampedBbox.join(','));
    }
    if (options.datetime !== undefined && !url.searchParams.has('datetime')) {
      const dateTime = options.datetime;
      url.searchParams.set(
        'datetime',
        dateTime instanceof Date
          ? dateTime.toISOString()
          : `${'start' in dateTime ? dateTime.start.toISOString() : '..'}/${
              'end' in dateTime ? dateTime.end.toISOString() : '..'
            }`
      );
    }
    if (options.query) {
      url.search += (url.search ? '&' : '') + encodeURI(options.query);
    }

    return url.toString();
  }
}
