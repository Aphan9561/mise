export type DiscoveryRecipe = {
  id: string;
  title: string;
  cuisine: string;
  readyInMinutes: number;
  summary: string;
  imageUrl?: string;
  ingredients: string[];
  instructions: string[];
};

export const fallbackDiscoveryRecipes: DiscoveryRecipe[] = [
  {
    id: "fallback-miso-noodles",
    title: "Miso Peanut Noodles",
    cuisine: "Japanese-inspired",
    readyInMinutes: 20,
    summary: "A fast pantry dinner with chewy noodles and a savory peanut sauce.",
    imageUrl: "",
    ingredients: [
      "8 oz noodles",
      "2 tbsp miso",
      "2 tbsp peanut butter",
      "1 tbsp soy sauce",
      "1 lime",
      "Scallions",
    ],
    instructions: [
      "Boil the noodles until just tender, then reserve a cup of cooking water.",
      "Whisk miso, peanut butter, soy sauce, lime juice, and a splash of hot water.",
      "Toss noodles with sauce, adding cooking water until glossy.",
      "Top with scallions and serve warm.",
    ],
  },
  {
    id: "fallback-tomato-eggs",
    title: "Jammy Tomato Eggs",
    cuisine: "Weeknight",
    readyInMinutes: 18,
    summary: "Soft eggs simmered in a bright tomato sauce with toast for scooping.",
    imageUrl: "",
    ingredients: [
      "1 can crushed tomatoes",
      "4 eggs",
      "2 cloves garlic",
      "1 tsp smoked paprika",
      "Parsley",
      "Toast",
    ],
    instructions: [
      "Saute minced garlic in olive oil until fragrant.",
      "Simmer tomatoes and paprika until slightly reduced.",
      "Crack in eggs, cover, and simmer until the whites set.",
      "Finish with parsley and serve with toast.",
    ],
  },
  {
    id: "fallback-chickpea-skillet",
    title: "Crispy Chickpea Skillet",
    cuisine: "Mediterranean",
    readyInMinutes: 25,
    summary: "Crispy chickpeas, lemony yogurt, and greens in one skillet.",
    imageUrl: "",
    ingredients: [
      "1 can chickpeas",
      "Greek yogurt",
      "1 lemon",
      "Baby spinach",
      "Cumin",
      "Pita",
    ],
    instructions: [
      "Dry chickpeas well, then sear them in olive oil until crisp.",
      "Season with cumin, salt, and pepper.",
      "Fold in spinach until wilted.",
      "Serve over lemon yogurt with warm pita.",
    ],
  },
];
