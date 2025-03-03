export type TileMapLayer = {
  title: string
  srs: string
  profile: string
  href: string
  extension?: string
}

export type TileMapMetadata = {
  type: string
  mimeType: string
  href: string
}

export type TileMapLayerDetails = TileMapLayer & {
  metadata?: TileMapMetadata[]
  bounds?: {
    crs: string
    minx: number
    miny: number
    maxx: number
    maxy: number
  }
  tileFormat?: {
    width: number
    height: number
    mimeType: string
    extension: string
  }
  tileSets?: Array<{
    href: string
    order: number
    unitsPerPixel: number
    minRow?: number
    maxRow?: number
    minCol?: number
    maxCol?: number
  }>
}