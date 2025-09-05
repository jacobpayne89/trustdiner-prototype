import { EstablishmentWithStats } from '../../../shared/types/core';

// In-memory prototype database - no external dependencies
class PrototypeDatabase {
  private establishments: EstablishmentWithStats[] = [];
  private users: any[] = [];
  private reviews: any[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    // Load sample data
    this.establishments = [
      {
        id: '1',
        name: 'The Allergen-Free Kitchen',
        address: '123 Safe Street, London SW1A 1AA',
        latitude: 51.5074,
        longitude: -0.1278,
        phone: '+44 20 7123 4567',
        website: 'https://allergen-free-kitchen.com',
        cuisine_type: 'Modern British',
        price_range: '££',
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        google_place_id: 'ChIJdd4hrwug2EcRmSrV3Vo6llI',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        allergen_scores: {
          gluten: 5,
          dairy: 5,
          nuts: 4,
          shellfish: 5,
          eggs: 4,
          soy: 5
        },
        review_count: 12,
        average_rating: 4.8
      },
      {
        id: '2', 
        name: 'Pret A Manger',
        address: '456 High Street, London W1K 5SA',
        latitude: 51.5155,
        longitude: -0.1426,
        phone: '+44 20 7234 5678',
        website: 'https://pret.co.uk',
        cuisine_type: 'Cafe',
        price_range: '£',
        image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
        google_place_id: 'ChIJdd4hrwug2EcRmSrV3Vo6llJ',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        allergen_scores: {
          gluten: 3,
          dairy: 3,
          nuts: 2,
          shellfish: 5,
          eggs: 3,
          soy: 4
        },
        review_count: 8,
        average_rating: 3.9
      },
      {
        id: '3',
        name: 'Dishoom',
        address: '789 Covent Garden, London WC2E 8RF',
        latitude: 51.5118,
        longitude: -0.1226,
        phone: '+44 20 7345 6789',
        website: 'https://dishoom.com',
        cuisine_type: 'Indian',
        price_range: '££',
        image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
        google_place_id: 'ChIJdd4hrwug2EcRmSrV3Vo6llK',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        allergen_scores: {
          gluten: 4,
          dairy: 2,
          nuts: 3,
          shellfish: 4,
          eggs: 4,
          soy: 3
        },
        review_count: 15,
        average_rating: 4.5
      },
      {
        id: '4',
        name: 'Wagamama',
        address: '321 Oxford Street, London W1C 1DX',
        latitude: 51.5154,
        longitude: -0.1447,
        phone: '+44 20 7456 7890',
        website: 'https://wagamama.com',
        cuisine_type: 'Asian',
        price_range: '££',
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
        google_place_id: 'ChIJdd4hrwug2EcRmSrV3Vo6llL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        allergen_scores: {
          gluten: 3,
          dairy: 4,
          nuts: 2,
          shellfish: 3,
          eggs: 3,
          soy: 2
        },
        review_count: 22,
        average_rating: 4.2
      },
      {
        id: '5',
        name: 'Leon',
        address: '654 Regent Street, London W1B 5RP',
        latitude: 51.5138,
        longitude: -0.1406,
        phone: '+44 20 7567 8901',
        website: 'https://leon.co',
        cuisine_type: 'Healthy Fast Food',
        price_range: '£',
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
        google_place_id: 'ChIJdd4hrwug2EcRmSrV3Vo6llM',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        allergen_scores: {
          gluten: 4,
          dairy: 4,
          nuts: 3,
          shellfish: 5,
          eggs: 4,
          soy: 4
        },
        review_count: 18,
        average_rating: 4.3
      }
    ];

    // Sample users
    this.users = [
      {
        id: '1',
        email: 'demo@trustdiner.com',
        name: 'Demo User',
        allergens: ['gluten', 'dairy'],
        created_at: new Date().toISOString()
      }
    ];

    // Sample reviews
    this.reviews = [
      {
        id: '1',
        establishment_id: '1',
        user_id: '1',
        allergen_scores: { gluten: 5, dairy: 5, nuts: 4 },
        comment: 'Excellent allergen-free options! Staff very knowledgeable.',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        establishment_id: '2',
        user_id: '1',
        allergen_scores: { gluten: 3, dairy: 3 },
        comment: 'Good labeling but limited gluten-free options.',
        created_at: new Date().toISOString()
      }
    ];

    this.initialized = true;
    console.log('🎯 Prototype database initialized with sample data');
  }

  // Mock PostgreSQL query interface
  async query(text: string, params?: any[]): Promise<any> {
    await this.initialize();

    // Parse basic SQL queries and return appropriate data
    const lowerText = text.toLowerCase().trim();

    if (lowerText.includes('select now()')) {
      return { rows: [{ timestamp: new Date().toISOString() }] };
    }

    if (lowerText.includes('select') && lowerText.includes('establishments')) {
      return { rows: this.establishments };
    }

    if (lowerText.includes('select') && lowerText.includes('users')) {
      return { rows: this.users };
    }

    if (lowerText.includes('select') && lowerText.includes('reviews')) {
      return { rows: this.reviews };
    }

    // For other queries, return empty result
    return { rows: [] };
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      message: 'Prototype in-memory database',
      timestamp: new Date().toISOString()
    };
  }

  // Get establishments with filtering
  async getEstablishments(filters?: any) {
    await this.initialize();
    return this.establishments;
  }

  // Get single establishment
  async getEstablishment(id: string) {
    await this.initialize();
    return this.establishments.find(e => e.id === id);
  }

  // Add establishment (for demo purposes)
  async addEstablishment(establishment: Partial<EstablishmentWithStats>) {
    await this.initialize();
    const newEstablishment = {
      ...establishment,
      id: String(this.establishments.length + 1),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as EstablishmentWithStats;
    
    this.establishments.push(newEstablishment);
    return newEstablishment;
  }
}

// Export singleton instance
export const prototypeDb = new PrototypeDatabase();

// Mock pool interface to match existing code
export const mockPool = {
  query: (text: string, params?: any[]) => prototypeDb.query(text, params),
  totalCount: 1,
  idleCount: 1,
  waitingCount: 0,
  on: () => {},
  end: () => Promise.resolve()
};
