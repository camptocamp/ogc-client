/**
 * @license BSD-3-Clause
 * Copyright (c) 2024 OS4CSAPI contributors
 */

/**
 * OGC API – Connected Systems (CSAPI) Client Module
 *
 * This module provides TypeScript/JavaScript clients for interacting with
 * OGC API - Connected Systems endpoints. It implements client-side access
 * for all CSAPI Part 1 and Part 2 resource collections.
 *
 * @module ogc-api/csapi
 * @see {@link https://ogcapi.ogc.org/connectedsystems/|OGC API - Connected Systems}
 * @see OGC 23-001 (Part 1)
 * @see OGC 23-002 (Part 2)
 *
 * @example
 * // Import specific clients
 * import { SystemsClient, DeploymentsClient } from '@camptocamp/ogc-client';
 *
 * // Or use the aggregate CSAPIClients object
 * import { CSAPIClients } from '@camptocamp/ogc-client';
 * const client = new CSAPIClients.SystemsClient('https://api.example.com');
 * const systems = await client.list();
 */

/* -------------------------------------------------------------------------- */
/*                     OGC API – Connected Systems Index                      */
/* -------------------------------------------------------------------------- */

export * from './systems';
export * from './deployments';
export * from './procedures';
export * from './samplingFeatures';
export * from './properties';
export * from './datastreams';
export * from './observations';
export * from './controlStreams';
export * from './commands';
export * from './feasibility';
export * from './systemEvents';
export * from './helpers';
export * from './model';

/* -------------------------------------------------------------------------- */
/*                            Client Class Imports                            */
/* -------------------------------------------------------------------------- */

import { SystemsClient } from './systems';
import { DeploymentsClient } from './deployments';
import { ProceduresClient } from './procedures';
import { SamplingFeaturesClient } from './samplingFeatures';
import { PropertiesClient } from './properties';
import { DatastreamsClient } from './datastreams';
import { ObservationsClient } from './observations';
import { ControlStreamsClient } from './controlStreams';
import { CommandsClient } from './commands';
import { FeasibilityClient } from './feasibility';
import { SystemEventsClient } from './systemEvents';

/* -------------------------------------------------------------------------- */
/*                        Connected Systems Client Map                        */
/* -------------------------------------------------------------------------- */

/**
 * Aggregate mapping of all CSAPI client classes.
 *
 * Provides a single import point for all Connected Systems API clients.
 * Each client provides typed access to a specific CSAPI resource collection.
 *
 * @property {typeof SystemsClient} SystemsClient - Client for /systems endpoint
 * @property {typeof DeploymentsClient} DeploymentsClient - Client for /deployments endpoint
 * @property {typeof ProceduresClient} ProceduresClient - Client for /procedures endpoint
 * @property {typeof SamplingFeaturesClient} SamplingFeaturesClient - Client for /samplingFeatures endpoint
 * @property {typeof PropertiesClient} PropertiesClient - Client for /properties endpoint
 * @property {typeof DatastreamsClient} DatastreamsClient - Client for /datastreams endpoint
 * @property {typeof ObservationsClient} ObservationsClient - Client for /observations endpoint
 * @property {typeof ControlStreamsClient} ControlStreamsClient - Client for /controlStreams endpoint
 * @property {typeof CommandsClient} CommandsClient - Client for /commands endpoint
 * @property {typeof FeasibilityClient} FeasibilityClient - Client for /feasibility endpoint
 * @property {typeof SystemEventsClient} SystemEventsClient - Client for /systemEvents endpoint
 *
 * @example
 * import { CSAPIClients } from '@camptocamp/ogc-client';
 *
 * const apiRoot = 'https://api.example.com';
 * const systemsClient = new CSAPIClients.SystemsClient(apiRoot);
 * const deploymentsClient = new CSAPIClients.DeploymentsClient(apiRoot);
 *
 * const systems = await systemsClient.list();
 * const deployments = await deploymentsClient.list();
 */
export const CSAPIClients = {
  SystemsClient,
  DeploymentsClient,
  ProceduresClient,
  SamplingFeaturesClient,
  PropertiesClient,
  DatastreamsClient,
  ObservationsClient,
  ControlStreamsClient,
  CommandsClient,
  FeasibilityClient,
  SystemEventsClient,
};

/* -------------------------------------------------------------------------- */
/*                                End of File                                 */
/* -------------------------------------------------------------------------- */
