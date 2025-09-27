import { AppData } from './types';

export const sampleData: AppData = {
  sampleMealPlans: [
    {
      id: 1,
      title: "Quick & Cheap Weekly Meals",
      provider: "Mom of Five Kitchen",
      price: 6,
      rating: 4.8,
      subscribers: 234,
      category: "Budget-Friendly",
      tags: ["quick", "budget", "family"],
      description: "7 dinners and 7 lunch ideas, all under $15 total cost",
      meals: {
        monday: {"dinner": "Spaghetti with Meat Sauce", "lunch": "Leftover Pasta"},
        tuesday: {"dinner": "Chicken Stir Fry", "lunch": "Chicken Salad"},
        wednesday: {"dinner": "Taco Night", "lunch": "Taco Bowl"},
        thursday: {"dinner": "Baked Potato Bar", "lunch": "Loaded Potato Soup"},
        friday: {"dinner": "Homemade Pizza", "lunch": "Pizza Rolls"},
        saturday: {"dinner": "Slow Cooker Chili", "lunch": "Chili Dogs"},
        sunday: {"dinner": "Breakfast for Dinner", "lunch": "Sandwich & Soup"}
      }
    },
    {
      id: 2,
      title: "Gluten-Free College Meals",
      provider: "Healthy Campus Chef",
      price: 8,
      rating: 4.6,
      subscribers: 156,
      category: "Dietary",
      tags: ["gluten-free", "dorm-friendly", "budget"],
      description: "Dorm-kitchen approved meals for celiac and gluten-sensitive students",
      meals: {
        monday: {"dinner": "GF Pasta with Marinara", "lunch": "Rice Bowl with Veggies"},
        tuesday: {"dinner": "Chicken & Rice", "lunch": "GF Wrap"},
        wednesday: {"dinner": "Quinoa Salad", "lunch": "Soup & GF Bread"},
        thursday: {"dinner": "GF Pizza", "lunch": "Leftover Pizza"},
        friday: {"dinner": "Stir-Fry with Rice Noodles", "lunch": "Salad Bowl"},
        saturday: {"dinner": "GF Pancakes", "lunch": "Smoothie Bowl"},
        sunday: {"dinner": "Baked Chicken", "lunch": "Chicken Salad"}
      }
    },
    {
      id: 3,
      title: "30-Minute Family Dinners",
      provider: "Busy Mom Solutions",
      price: 7,
      rating: 4.9,
      subscribers: 312,
      category: "Family",
      tags: ["quick", "family", "kid-friendly"],
      description: "Quick dinners that kids will actually eat - all under 30 minutes",
      meals: {
        monday: {"dinner": "Mac and Cheese with Hidden Veggies", "lunch": "Mac & Cheese Cups"},
        tuesday: {"dinner": "Chicken Nuggets & Sweet Potato Fries", "lunch": "Chicken Wraps"},
        wednesday: {"dinner": "Mini Pizzas", "lunch": "Pizza Lunchables"},
        thursday: {"dinner": "Sloppy Joes", "lunch": "Leftover Sloppy Joes"},
        friday: {"dinner": "Fish Sticks & Rice", "lunch": "Fish Sandwich"},
        saturday: {"dinner": "Quesadillas", "lunch": "Quesadilla Rolls"},
        sunday: {"dinner": "Meatball Subs", "lunch": "Meatball Pasta"}
      }
    }
  ],
  userProfiles: [
    {"name": "John D.", "type": "Divorced Dad", "subscription": "Quick & Cheap Weekly Meals"},
    {"name": "Maria S.", "type": "College Student", "subscription": "Gluten-Free College Meals"},
    {"name": "Sarah M.", "type": "Busy Mom", "subscription": "30-Minute Family Dinners"}
  ],
  providers: [
    {"name": "Mom of Five Kitchen", "plans": 3, "rating": 4.8, "earnings": "$1,247"},
    {"name": "Healthy Campus Chef", "plans": 2, "rating": 4.6, "earnings": "$892"},
    {"name": "Busy Mom Solutions", "plans": 4, "rating": 4.9, "earnings": "$1,683"}
  ]
};