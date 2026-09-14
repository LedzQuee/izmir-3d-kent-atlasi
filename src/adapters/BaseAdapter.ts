import type { CityPoint } from './types';

export abstract class BaseAdapter<T> {
  abstract normalize(rawData: T[]): CityPoint[];
}
