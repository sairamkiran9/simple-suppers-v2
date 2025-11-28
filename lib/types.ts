export interface MealPlan {
  id: number;
  title: string;
  provider: string;
  price: number;
  rating: number;
  subscribers: number;
  category: string;
  tags: string[];
  description: string;
  meals: {
    [key: string]: {
      dinner: string;
      lunch: string;
    };
  };
}

export interface UserProfile {
  name: string;
  type: string;
  subscription: string;
}

export interface Provider {
  name: string;
  plans: number;
  rating: number;
  earnings: string;
}

export type ViewType = 'landing' | 'browse' | 'detail' | 'creator' | 'dashboard' | 'login' | 'signup' | 'feed';

export interface AppData {
  sampleMealPlans: MealPlan[];
  userProfiles: UserProfile[];
  providers: Provider[];
}

export interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}
