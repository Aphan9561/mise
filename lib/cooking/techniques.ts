export type TechniqueDefinition = {
  term: string;
  explanation: string;
  cue: string;
};

export const techniqueDefinitions: TechniqueDefinition[] = [
  {
    term: "braise",
    explanation:
      "Brown the food first, then cook it slowly with a small amount of liquid until it turns tender.",
    cue: "Look for gentle bubbles, not a rolling boil.",
  },
  {
    term: "bake",
    explanation:
      "Cook food with dry heat in an oven until it sets, browns, or becomes tender.",
    cue: "Use the recipe's visual cue before relying only on the timer.",
  },
  {
    term: "beat",
    explanation:
      "Stir quickly and forcefully to combine ingredients or add air.",
    cue: "The mixture should look smoother and more uniform.",
  },
  {
    term: "blanch",
    explanation:
      "Briefly cook food in boiling water, then cool it quickly to stop the cooking.",
    cue: "Vegetables should look brighter but still feel crisp.",
  },
  {
    term: "broil",
    explanation:
      "Cook food directly under intense top heat to brown or char the surface.",
    cue: "Watch closely because browning can happen in seconds.",
  },
  {
    term: "chop",
    explanation:
      "Cut food into pieces that do not need to be perfectly uniform.",
    cue: "Keep pieces close in size so they cook at the same pace.",
  },
  {
    term: "cream",
    explanation:
      "Beat fat and sugar together until lighter and fluffy, usually for baking.",
    cue: "The mixture should look paler and less grainy.",
  },
  {
    term: "dice",
    explanation:
      "Cut food into small cubes so each piece cooks evenly.",
    cue: "Smaller dice cook faster and blend more evenly into sauces.",
  },
  {
    term: "deglaze",
    explanation:
      "Add liquid to a hot pan and scrape up the browned bits stuck to the bottom. Those bits carry concentrated flavor.",
    cue: "The liquid should hiss when it hits the pan.",
  },
  {
    term: "drain",
    explanation:
      "Pour off excess liquid from food after boiling, rinsing, or resting.",
    cue: "Shake gently so extra water does not dilute the dish.",
  },
  {
    term: "fold",
    explanation:
      "Use a spatula to gently lift and turn a lighter mixture into a heavier one without knocking out too much air.",
    cue: "Stop once the streaks are mostly gone.",
  },
  {
    term: "fry",
    explanation:
      "Cook food in hot fat until the outside browns and crisps.",
    cue: "The oil should bubble steadily around the food, not smoke.",
  },
  {
    term: "grate",
    explanation:
      "Rub food against a grater to make small shreds or fine pieces.",
    cue: "Use light pressure for fluffy shreds and firmer pressure for dense foods.",
  },
  {
    term: "knead",
    explanation:
      "Press and fold dough repeatedly to build structure and elasticity.",
    cue: "The dough should become smoother and spring back slightly.",
  },
  {
    term: "julienne",
    explanation:
      "Cut food into thin matchsticks so it cooks evenly and blends cleanly into a dish.",
    cue: "Aim for pieces about the width of a matchstick.",
  },
  {
    term: "mince",
    explanation:
      "Cut an ingredient into very small pieces so its flavor spreads through the dish.",
    cue: "Garlic and herbs should look finely chopped, not chunky.",
  },
  {
    term: "mix",
    explanation:
      "Stir ingredients together until they are evenly combined.",
    cue: "Stop once there are no obvious pockets of unmixed ingredients.",
  },
  {
    term: "peel",
    explanation:
      "Remove the outer skin or rind from an ingredient.",
    cue: "Take off only the tough outer layer unless the recipe says otherwise.",
  },
  {
    term: "poach",
    explanation:
      "Gently cook food in barely simmering liquid.",
    cue: "The liquid should quiver with small bubbles, not boil hard.",
  },
  {
    term: "roast",
    explanation:
      "Cook food uncovered with dry oven heat until browned and tender.",
    cue: "Look for browned edges and a tender center.",
  },
  {
    term: "reduce",
    explanation:
      "Simmer liquid so water evaporates and the sauce becomes thicker and more flavorful.",
    cue: "Drag a spoon through the pan; it should leave a brief trail.",
  },
  {
    term: "simmer",
    explanation:
      "Cook liquid just below a boil, with small bubbles gently breaking the surface.",
    cue: "Lower the heat if the pot starts aggressively bubbling.",
  },
  {
    term: "sear",
    explanation:
      "Cook the surface of food over high heat until it develops a browned crust.",
    cue: "Let the food sit still long enough to release naturally.",
  },
  {
    term: "saute",
    explanation:
      "Cook small pieces of food quickly in a little fat over medium-high heat.",
    cue: "The pan should sound lively but not smell burnt.",
  },
  {
    term: "slice",
    explanation:
      "Cut food into thin, flat pieces.",
    cue: "Keep slices even so they cook or layer consistently.",
  },
  {
    term: "stir",
    explanation:
      "Move ingredients around with a spoon or spatula to combine them or prevent sticking.",
    cue: "Scrape the bottom and corners of the pan as you go.",
  },
  {
    term: "toast",
    explanation:
      "Heat food until it becomes browned, crisp, and more aromatic.",
    cue: "Use smell as a guide; toasted can turn burnt quickly.",
  },
  {
    term: "toss",
    explanation:
      "Lift and turn ingredients together until they are evenly coated or mixed.",
    cue: "Use a wide bowl or pan so ingredients move without crushing.",
  },
  {
    term: "whisk",
    explanation:
      "Beat ingredients with a whisk to combine, smooth, or add air.",
    cue: "Use quick circles or side-to-side strokes.",
  },
];

const normalizedDefinitions = new Map(
  techniqueDefinitions.map((definition) => [
    definition.term.toLowerCase(),
    definition,
  ]),
);

const aliases = new Map([
  ["sauté", "saute"],
  ["sautée", "saute"],
  ["sauted", "saute"],
  ["sautéed", "saute"],
  ["sautéing", "saute"],
]);

export const techniqueTerms = techniqueDefinitions.map(
  (definition) => definition.term,
);

export function findTechniqueDefinition(term: string) {
  const normalizedTerm = term.toLowerCase();

  return normalizedDefinitions.get(aliases.get(normalizedTerm) ?? normalizedTerm);
}
