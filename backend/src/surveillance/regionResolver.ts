/**
 * Region Resolver
 * Resolves user location input (zip code or state) to a full ResolvedRegion.
 * Uses Firestore for zip-to-FIPS lookups and in-memory data for state/HHS mapping.
 */

import admin from 'firebase-admin'
import type { ResolvedRegion } from './types'

/** State abbreviation → HHS Region mapping (all 50 states + DC + territories) */
export const STATE_TO_HHS_REGION: Record<string, number> = {
  CT: 1, ME: 1, MA: 1, NH: 1, RI: 1, VT: 1,
  NJ: 2, NY: 2, PR: 2, VI: 2,
  DE: 3, DC: 3, MD: 3, PA: 3, VA: 3, WV: 3,
  AL: 4, FL: 4, GA: 4, KY: 4, MS: 4, NC: 4, SC: 4, TN: 4,
  IL: 5, IN: 5, MI: 5, MN: 5, OH: 5, WI: 5,
  AR: 6, LA: 6, NM: 6, OK: 6, TX: 6,
  IA: 7, KS: 7, MO: 7, NE: 7,
  CO: 8, MT: 8, ND: 8, SD: 8, UT: 8, WY: 8,
  AZ: 9, CA: 9, HI: 9, NV: 9, AS: 9, GU: 9, MP: 9,
  AK: 10, ID: 10, OR: 10, WA: 10,
}

/** State abbreviation → full name */
export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  PR: 'Puerto Rico', VI: 'Virgin Islands', AS: 'American Samoa', GU: 'Guam', MP: 'Northern Mariana Islands',
}

export class RegionResolver {
  /**
   * Resolve a zip code to a full region via Firestore lookup.
   */
  async resolveFromZip(zipCode: string): Promise<ResolvedRegion | null> {
    try {
      const db = admin.firestore()
      const doc = await db.collection('zip_to_fips').doc(zipCode).get()

      if (!doc.exists) return null

      const data = doc.data()!
      const stateAbbrev = (data.state as string) || ''
      const hhsRegion = STATE_TO_HHS_REGION[stateAbbrev]

      if (!hhsRegion) return null

      return {
        zipCode,
        county: data.county as string | undefined,
        fipsCode: data.fips as string | undefined,
        state: STATE_NAMES[stateAbbrev] || stateAbbrev,
        stateAbbrev,
        hhsRegion,
        geoLevel: 'county',
      }
    } catch (error) {
      console.warn('Zip code lookup failed:', error)
      return null
    }
  }

  /**
   * Resolve a state abbreviation to a region (in-memory, no async).
   */
  resolveFromState(stateAbbrev: string): ResolvedRegion | null {
    const upper = stateAbbrev.toUpperCase()
    const hhsRegion = STATE_TO_HHS_REGION[upper]
    if (!hhsRegion) return null

    return {
      state: STATE_NAMES[upper] || upper,
      stateAbbrev: upper,
      hhsRegion,
      geoLevel: 'state',
    }
  }

  /**
   * Resolve from either zip code or state, preferring zip.
   */
  async resolve(input: { zipCode?: string; state?: string }): Promise<ResolvedRegion | null> {
    // Try zip code first (more granular)
    if (input.zipCode) {
      const fromZip = await this.resolveFromZip(input.zipCode)
      if (fromZip) return fromZip
    }

    // Fall back to state
    if (input.state) {
      return this.resolveFromState(input.state)
    }

    return null
  }
}
