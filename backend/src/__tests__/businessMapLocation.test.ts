import {
  mapLocationFromCreateBody,
  mapLocationToApi,
  mergeMapLocationPatch,
} from '../utils/businessMapLocation';

describe('businessMapLocation', () => {
  describe('mergeMapLocationPatch', () => {
    it('uses toObject when existing is a Mongoose-like document', () => {
      const existing = {
        toObject: () => ({
          googleMapsUrl: 'https://maps.example/a',
          latitude: 10,
          longitude: 20,
        }),
      };
      const { mapLocation, mapGeo } = mergeMapLocationPatch(existing, {});
      expect(mapLocation?.googleMapsUrl).toBe('https://maps.example/a');
      expect(mapGeo?.coordinates).toEqual([20, 10]);
    });

    it('deletes URL key when patch is whitespace-only string', () => {
      const { mapLocation } = mergeMapLocationPatch(
        { googleMapsUrl: 'https://keep.until.cleared/' },
        { googleMapsUrl: '   ' },
      );
      expect(mapLocation).toBeUndefined();
    });

    it('deletes latitude when patch is out of range', () => {
      const { mapLocation } = mergeMapLocationPatch(
        { latitude: 10, longitude: 20 },
        { latitude: 95 },
      );
      expect(mapLocation?.latitude).toBeUndefined();
      expect(mapLocation?.longitude).toBe(20);
    });

    it('deletes longitude when patch is out of range', () => {
      const { mapLocation } = mergeMapLocationPatch(
        { latitude: 10, longitude: 20 },
        { longitude: 200 },
      );
      expect(mapLocation?.latitude).toBe(10);
      expect(mapLocation?.longitude).toBeUndefined();
    });

    it('returns undefined mapLocation when all fields cleared', () => {
      const { mapLocation, mapGeo } = mergeMapLocationPatch(
        {
          googleMapsUrl: 'https://x.com',
          googleReviewsUrl: 'https://y.com',
          placeId: 'pid',
          latitude: 1,
          longitude: 2,
        },
        {
          googleMapsUrl: '',
          googleReviewsUrl: '',
          placeId: '',
          latitude: '',
          longitude: '',
        },
      );
      expect(mapLocation).toBeUndefined();
      expect(mapGeo).toBeUndefined();
    });
  });

  describe('mapLocationFromCreateBody / mapLocationToApi', () => {
    it('mapLocationToApi reads plain object from toObject doc', () => {
      const api = mapLocationToApi({
        mapLocation: {
          toObject: () => ({
            googleMapsUrl: 'https://m',
            latitude: 5,
            longitude: 6,
          }),
        },
      });
      expect(api).toMatchObject({ googleMapsUrl: 'https://m', latitude: 5, longitude: 6 });
    });

    it('mapLocationFromCreateBody still works for empty input', () => {
      expect(mapLocationFromCreateBody(null)).toEqual({});
    });
  });
});
