import { MapDefinition, MAP_PRESETS } from './maps';

export class MapRegistry {
  private static instance: MapRegistry;
  private maps: Map<string, MapDefinition> = new Map();

  private constructor() {
    Object.values(MAP_PRESETS).forEach(m => this.registerMap(m));
  }

  public static getInstance(): MapRegistry {
    if (!MapRegistry.instance) {
      MapRegistry.instance = new MapRegistry();
    }
    return MapRegistry.instance;
  }

  public registerMap(mapDef: MapDefinition) {
    this.maps.set(mapDef.id, mapDef);
  }

  public getMap(id: string): MapDefinition | undefined {
    return this.maps.get(id);
  }

  public getAllMaps(): MapDefinition[] {
    return Array.from(this.maps.values());
  }
}
